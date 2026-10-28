"""Agente lector de facturas de proveedor.

Python + LangChain: toma facturas (PDF o foto) de una carpeta, se las pasa a
Claude por OpenRouter, y cuando Claude pide guardar_factura, el agente ejecuta
la herramienta, que escribe en Supabase. Claude nunca toca la base de datos.
"""

import argparse
import base64
import logging
import os
import shutil
import time
import uuid
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv
from langchain.agents import create_agent
from langchain.agents.middleware import ModelCallLimitMiddleware
from langchain_core.messages import AIMessage, HumanMessage, ToolMessage

from herramientas import TIPOS_MIME, FacturaDuplicada, crear_guardar_factura

# 1. Modelo
MODELO_POR_DEFECTO = "anthropic/claude-sonnet-5.5"

# 2. Prompt del sistema (el del diagrama, tal cual)
PROMPT_SISTEMA = """Eres un asistente de administración.
Lee la factura que te paso (PDF o foto).
Saca: número, fecha, proveedor, NIF,
base imponible, IVA y total.
Si un dato no aparece, déjalo vacío.
No inventes nada.
Cuando lo tengas, llama a guardar_factura."""

SUFIJOS_SOPORTADOS = set(TIPOS_MIME)
SEGUNDOS_ENTRE_PASADAS = 10
# Una copia lenta o una descarga puede tener el archivo a medias; se espera a la pasada siguiente.
EDAD_MINIMA_SEGUNDOS = 2
MAX_TEXTO_CLAUDE = 300
CARPETAS = ("entrada", "procesadas", "errores")

log = logging.getLogger("agente")
# Para avisar una sola vez de cada archivo ignorado y no llenar el registro en cada pasada.
_ignorados: set[Path] = set()


@dataclass
class Resultado:
    ok: bool
    detalle: str


def construir_mensaje(ruta: Path) -> HumanMessage | None:
    """Mensaje con la factura como bloque estándar de LangChain.

    ChatOpenRouter convierte estos bloques al formato de OpenRouter, así que
    no hace falta construir `image_url` ni `file_data` a mano.
    """
    tipo = TIPOS_MIME.get(ruta.suffix.lower())
    if tipo is None:
        return None
    if tipo == "application/pdf":
        bloque = {"type": "file", "mime_type": tipo, "filename": ruta.name}
    else:
        bloque = {"type": "image", "mime_type": tipo}
    bloque["base64"] = base64.b64encode(ruta.read_bytes()).decode("ascii")
    return HumanMessage(content=[{"type": "text", "text": "Esta es la factura."}, bloque])


def _mover(ruta: Path, destino: str, razon: str | None = None) -> None:
    carpeta = ruta.parent.parent / destino
    carpeta.mkdir(exist_ok=True)
    final = carpeta / ruta.name
    if final.exists():
        # No se pisa nada: el archivo anterior puede ser la única copia de otra factura.
        marca = f"{time.strftime('%Y%m%d-%H%M%S')}-{uuid.uuid4().hex[:6]}"
        final = carpeta / f"{ruta.stem}-{marca}{ruta.suffix}"
    shutil.move(ruta, final)
    if razon:
        (carpeta / f"{final.name}.error.txt").write_text(razon, encoding="utf-8")


def _razon_del_fallo(mensajes: list) -> str:
    """Por qué no se guardó, cuando el bucle terminó sin éxito."""
    for mensaje in mensajes:
        if isinstance(mensaje, ToolMessage) and mensaje.status == "error":
            return str(mensaje.content)
    respuestas = [m for m in mensajes if isinstance(m, AIMessage) and m.text.strip()]
    texto = respuestas[-1].text.strip()[:MAX_TEXTO_CLAUDE] if respuestas else ""
    return f"Claude no llamó a guardar_factura: {texto}" if texto else "Claude no llamó a guardar_factura"


def _ejecutar(ruta: Path, modelo, supabase) -> Resultado:
    mensaje = construir_mensaje(ruta)
    if mensaje is None:
        return Resultado(False, f"Formato no soportado: {ruta.suffix or ruta.name}")

    # 3. Memoria: ninguna. Un agente nuevo y sin checkpointer por factura, así
    # cada una es una conversación limpia.
    # 4. Bucle: como mucho una llamada a Claude. return_direct ya corta el bucle
    # al guardar; el límite cubre además el caso en que los datos no pasan la
    # validación y el bucle devolvería el error a Claude para reintentar.
    ejecutor = create_agent(
        modelo,
        tools=[crear_guardar_factura(supabase, ruta)],
        system_prompt=PROMPT_SISTEMA,
        middleware=[ModelCallLimitMiddleware(run_limit=1, exit_behavior="end")],
    )
    mensajes = ejecutor.invoke({"messages": [mensaje]})["messages"]

    ultimo = mensajes[-1]
    if isinstance(ultimo, ToolMessage) and ultimo.status != "error":
        return Resultado(True, str(ultimo.content))
    return Resultado(False, _razon_del_fallo(mensajes))


def procesar(ruta: Path, modelo, supabase) -> Resultado:
    """Procesa un archivo y lo deja en procesadas/ o errores/."""
    try:
        resultado = _ejecutar(ruta, modelo, supabase)
    except FacturaDuplicada as error:
        resultado = Resultado(False, str(error))
    except Exception as error:  # un archivo malo no debe parar al resto
        resultado = Resultado(False, f"{type(error).__name__}: {error}")

    if resultado.ok:
        _mover(ruta, "procesadas")
        log.info("ok %s: %s", ruta.name, resultado.detalle)
    else:
        _mover(ruta, "errores", resultado.detalle)
        log.error("error %s: %s", ruta.name, resultado.detalle)
    return resultado


def _pendientes(entrada: Path) -> list[Path]:
    ahora = time.time()
    pendientes = []
    for ruta in sorted(entrada.iterdir()):
        if not ruta.is_file() or ruta.name == ".gitkeep":
            continue
        if ruta.suffix.lower() not in SUFIJOS_SOPORTADOS:
            if ruta not in _ignorados:
                _ignorados.add(ruta)
                log.debug("ignorado %s: formato no soportado", ruta.name)
            continue
        if ahora - ruta.stat().st_mtime < EDAD_MINIMA_SEGUNDOS:
            continue
        pendientes.append(ruta)
    return pendientes


def _pasada(carpeta: Path, modelo, supabase) -> None:
    for ruta in _pendientes(carpeta / "entrada"):
        try:
            procesar(ruta, modelo, supabase)
        except Exception:  # p. ej. no se pudo mover: se registra y sigue con el resto
            log.exception("error %s: no se pudo terminar de procesar", ruta.name)


def main() -> None:
    from langchain_openrouter import ChatOpenRouter
    from supabase import create_client

    load_dotenv(Path(__file__).parent / ".env")
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

    analizador = argparse.ArgumentParser(description="Lee facturas de proveedor y las guarda en Supabase.")
    analizador.add_argument("--vigilar", action="store_true", help="repite la pasada cada 10 s")
    args = analizador.parse_args()

    carpeta = Path(os.getenv("CARPETA_FACTURAS", Path(__file__).parent / "facturas"))
    modelo = ChatOpenRouter(model=os.getenv("MODELO", MODELO_POR_DEFECTO), temperature=0)
    supabase = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])

    for nombre in CARPETAS:
        (carpeta / nombre).mkdir(parents=True, exist_ok=True)

    while True:
        try:
            _pasada(carpeta, modelo, supabase)
        except Exception:  # p. ej. carpeta no disponible: se reintenta en la pasada siguiente
            log.exception("error al leer la carpeta de entrada")
        if not args.vigilar:
            break
        time.sleep(SEGUNDOS_ENTRE_PASADAS)


if __name__ == "__main__":
    main()
