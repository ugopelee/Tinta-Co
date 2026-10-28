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
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv
from langchain.agents import create_agent
from langchain.agents.middleware import ModelCallLimitMiddleware
from langchain_core.messages import HumanMessage, ToolMessage

from herramientas import FacturaDuplicada, crear_guardar_factura

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

TIPOS_IMAGEN = {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp"}
SEGUNDOS_ENTRE_PASADAS = 10

log = logging.getLogger("agente")


@dataclass
class Resultado:
    ok: bool
    detalle: str


def construir_mensaje(ruta: Path) -> HumanMessage | None:
    """Mensaje con la factura como bloque estándar de LangChain.

    ChatOpenRouter convierte estos bloques al formato de OpenRouter, así que
    no hace falta construir `image_url` ni `file_data` a mano.
    """
    sufijo = ruta.suffix.lower()
    if sufijo == ".pdf":
        bloque = {"type": "file", "mime_type": "application/pdf", "filename": ruta.name}
    elif sufijo in TIPOS_IMAGEN:
        bloque = {"type": "image", "mime_type": TIPOS_IMAGEN[sufijo]}
    else:
        return None
    bloque["base64"] = base64.b64encode(ruta.read_bytes()).decode("ascii")
    return HumanMessage(content=[{"type": "text", "text": "Esta es la factura."}, bloque])


def _mover(ruta: Path, destino: str, razon: str | None = None) -> None:
    carpeta = ruta.parent.parent / destino
    carpeta.mkdir(exist_ok=True)
    shutil.move(ruta, carpeta / ruta.name)
    if razon:
        (carpeta / f"{ruta.name}.error.txt").write_text(razon, encoding="utf-8")


def _razon_del_fallo(mensajes: list) -> str:
    """Por qué no se guardó, cuando el bucle terminó sin éxito."""
    for mensaje in mensajes:
        if isinstance(mensaje, ToolMessage) and mensaje.status == "error":
            return str(mensaje.content)
    return "Claude no llamó a guardar_factura"


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


def _pasada(carpeta: Path, modelo, supabase) -> None:
    entrada = carpeta / "entrada"
    for ruta in sorted(p for p in entrada.iterdir() if p.is_file() and p.name != ".gitkeep"):
        procesar(ruta, modelo, supabase)


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

    while True:
        _pasada(carpeta, modelo, supabase)
        if not args.vigilar:
            break
        time.sleep(SEGUNDOS_ENTRE_PASADAS)


if __name__ == "__main__":
    main()
