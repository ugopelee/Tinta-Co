"""Pruebas del agente lector de facturas.

No tocan la red: el modelo es un doble que devuelve una llamada a herramienta
guionizada y Supabase es un doble que anota lo que se le pide.
"""

import base64
import logging
import os
import time
from pathlib import Path
from typing import Any

import pytest
from langchain_core.language_models import BaseChatModel
from langchain_core.messages import AIMessage, HumanMessage
from langchain_core.outputs import ChatGeneration, ChatResult
from postgrest.exceptions import APIError

import agente
from herramientas import DatosFactura


class ModeloGuionizado(BaseChatModel):
    """Responde siempre con la misma llamada a guardar_factura."""

    argumentos: dict[str, Any]
    llamadas: int = 0
    mensajes_recibidos: list = []

    @property
    def _llm_type(self) -> str:
        return "guionizado"

    def bind_tools(self, tools, **kwargs):
        return self

    def _generate(self, messages, stop=None, run_manager=None, **kwargs):
        self.llamadas += 1
        self.mensajes_recibidos.append(messages)
        mensaje = AIMessage(
            content="",
            tool_calls=[
                {"name": "guardar_factura", "args": self.argumentos, "id": f"c{self.llamadas}"}
            ],
        )
        return ChatResult(generations=[ChatGeneration(message=mensaje)])


class ModeloSoloTexto(ModeloGuionizado):
    """Contesta con texto y sin llamar a la herramienta."""

    texto: str = ""

    def _generate(self, messages, stop=None, run_manager=None, **kwargs):
        self.llamadas += 1
        return ChatResult(generations=[ChatGeneration(message=AIMessage(content=self.texto))])


class RespuestaFalsa:
    def __init__(self, data):
        self.data = data


class ConsultaFalsa:
    def __init__(self, supabase, tabla):
        self.supabase, self.tabla = supabase, tabla

    def insert(self, fila):
        self.fila = fila
        return self

    def execute(self):
        if self.supabase.error_insert:
            raise self.supabase.error_insert
        self.supabase.inserciones.append((self.tabla, self.fila))
        return RespuestaFalsa([{"id": "id-123"}])


class BucketFalso:
    def __init__(self, supabase, nombre):
        self.supabase, self.nombre = supabase, nombre

    def upload(self, path, file, file_options=None):
        self.supabase.subidas.append((self.nombre, path, file_options))

    def remove(self, paths):
        self.supabase.borrados.append((self.nombre, paths))


class AlmacenFalso:
    def __init__(self, supabase):
        self.supabase = supabase

    def from_(self, nombre):
        return BucketFalso(self.supabase, nombre)


class SupabaseFalso:
    def __init__(self, error_insert=None):
        self.error_insert = error_insert
        self.inserciones, self.subidas, self.borrados = [], [], []
        self.storage = AlmacenFalso(self)

    def table(self, nombre):
        return ConsultaFalsa(self, nombre)


DATOS = {
    "numero": "A-2026/041",
    "fecha": "2026-10-03",
    "proveedor": "Papelería Sur S.L.",
    "nif": "B12345678",
    "base": "100.00",
    "iva": "21.00",
    "total": "121.00",
}


@pytest.fixture
def carpetas(tmp_path):
    for nombre in ("entrada", "procesadas", "errores"):
        (tmp_path / nombre).mkdir()
    return tmp_path


@pytest.fixture
def factura(carpetas):
    ruta = carpetas / "entrada" / "factura.pdf"
    ruta.write_bytes(b"%PDF-1.4 falso")
    return ruta


def test_caso_feliz_inserta_una_vez_y_mueve_a_procesadas(factura, carpetas):
    modelo = ModeloGuionizado(argumentos=DATOS)
    supabase = SupabaseFalso()

    resultado = agente.procesar(factura, modelo, supabase)

    assert resultado.ok
    assert modelo.llamadas == 1  # el bucle termina sin volver a llamar a Claude
    assert len(supabase.inserciones) == 1
    tabla, fila = supabase.inserciones[0]
    assert tabla == "facturas_proveedor"
    assert fila["numero"] == "A-2026/041"
    assert fila["fecha"] == "2026-10-03"
    assert fila["nombre_archivo"] == "factura.pdf"
    assert fila["archivo"].startswith("2026/") and fila["archivo"].endswith("-factura.pdf")
    assert supabase.subidas[0][0] == "facturas-proveedor"
    assert not factura.exists()
    assert (carpetas / "procesadas" / "factura.pdf").exists()


@pytest.mark.parametrize(
    "nombre, tipo",
    [
        ("f.pdf", "application/pdf"),
        ("f.PDF", "application/pdf"),
        ("f.jpg", "image/jpeg"),
        ("f.jpeg", "image/jpeg"),
        ("f.png", "image/png"),
        ("f.webp", "image/webp"),
    ],
)
def test_el_archivo_se_sube_con_su_tipo_mime(carpetas, nombre, tipo):
    ruta = carpetas / "entrada" / nombre
    ruta.write_bytes(b"contenido")
    supabase = SupabaseFalso()

    agente.procesar(ruta, ModeloGuionizado(argumentos=DATOS), supabase)

    assert supabase.subidas[0][2] == {"content-type": tipo}


def test_nif_vacio_se_guarda_como_null(factura):
    modelo = ModeloGuionizado(argumentos={**DATOS, "nif": "  "})
    supabase = SupabaseFalso()

    agente.procesar(factura, modelo, supabase)

    assert supabase.inserciones[0][1]["nif"] is None


def test_importes_que_no_cuadran_no_insertan_y_van_a_errores(factura, carpetas):
    modelo = ModeloGuionizado(argumentos={**DATOS, "total": "150.00"})
    supabase = SupabaseFalso()

    resultado = agente.procesar(factura, modelo, supabase)

    assert not resultado.ok
    assert supabase.inserciones == []
    assert supabase.subidas == []
    assert modelo.llamadas == 1
    assert (carpetas / "errores" / "factura.pdf").exists()
    assert (carpetas / "errores" / "factura.pdf.error.txt").exists()


def test_factura_duplicada_va_a_errores_y_borra_lo_subido(factura, carpetas):
    error = APIError({"code": "23505", "message": "duplicate key value"})
    modelo = ModeloGuionizado(argumentos=DATOS)
    supabase = SupabaseFalso(error_insert=error)

    resultado = agente.procesar(factura, modelo, supabase)

    assert not resultado.ok
    assert "duplicada" in resultado.detalle
    assert len(supabase.borrados) == 1
    assert supabase.borrados[0][1] == [supabase.subidas[0][1]]
    razon = (carpetas / "errores" / "factura.pdf.error.txt").read_text(encoding="utf-8")
    assert "duplicada" in razon


def test_otro_error_de_base_de_datos_va_a_errores(factura, carpetas):
    error = APIError({"code": "42501", "message": "permission denied"})
    resultado = agente.procesar(
        factura, ModeloGuionizado(argumentos=DATOS), SupabaseFalso(error_insert=error)
    )

    assert not resultado.ok
    assert "duplicada" not in resultado.detalle
    assert (carpetas / "errores" / "factura.pdf").exists()


def test_el_modelo_recibe_el_prompt_y_la_factura(factura):
    modelo = ModeloGuionizado(argumentos=DATOS)
    agente.procesar(factura, modelo, SupabaseFalso())

    mensajes = modelo.mensajes_recibidos[0]
    assert mensajes[0].content == agente.PROMPT_SISTEMA
    assert isinstance(mensajes[1], HumanMessage)


def test_datos_factura_acepta_importes_que_cuadran_con_tolerancia():
    DatosFactura(**{**DATOS, "total": "121.02"})
    with pytest.raises(ValueError):
        DatosFactura(**{**DATOS, "total": "121.05"})


def test_construir_mensaje_pdf(carpetas):
    ruta = carpetas / "a.pdf"
    ruta.write_bytes(b"%PDF")

    mensaje = agente.construir_mensaje(ruta)

    bloque = next(b for b in mensaje.content if b["type"] == "file")
    assert bloque["mime_type"] == "application/pdf"
    assert bloque["filename"] == "a.pdf"
    assert base64.b64decode(bloque["base64"]) == b"%PDF"


def test_construir_mensaje_imagen(carpetas):
    ruta = carpetas / "a.JPG"
    ruta.write_bytes(b"\xff\xd8")

    mensaje = agente.construir_mensaje(ruta)

    bloque = next(b for b in mensaje.content if b["type"] == "image")
    assert bloque["mime_type"] == "image/jpeg"


def test_construir_mensaje_formato_no_soportado(carpetas):
    ruta = carpetas / "notas.txt"
    ruta.write_text("hola")

    assert agente.construir_mensaje(ruta) is None


def envejecer(ruta):
    """Hace que el archivo parezca llevar tiempo en la carpeta."""
    antiguo = time.time() - 60
    os.utime(ruta, (antiguo, antiguo))


def test_pasada_deja_intactos_los_formatos_no_soportados(carpetas):
    ruta = carpetas / "entrada" / "notas.txt"
    ruta.write_text("hola")
    envejecer(ruta)
    modelo = ModeloGuionizado(argumentos=DATOS)

    agente._pasada(carpetas, modelo, SupabaseFalso())

    assert ruta.exists()
    assert modelo.llamadas == 0
    assert not (carpetas / "errores" / "notas.txt").exists()


def test_procesar_rechaza_formato_no_soportado(carpetas):
    ruta = carpetas / "entrada" / "notas.txt"
    ruta.write_text("hola")

    resultado = agente.procesar(ruta, ModeloGuionizado(argumentos=DATOS), SupabaseFalso())

    assert not resultado.ok


def test_pasada_salta_archivos_recien_modificados(carpetas):
    reciente = carpetas / "entrada" / "nueva.pdf"
    reciente.write_bytes(b"%PDF a medias")
    modelo = ModeloGuionizado(argumentos=DATOS)

    agente._pasada(carpetas, modelo, SupabaseFalso())

    assert reciente.exists()
    assert modelo.llamadas == 0

    envejecer(reciente)
    agente._pasada(carpetas, modelo, SupabaseFalso())

    assert not reciente.exists()
    assert modelo.llamadas == 1


def test_dos_archivos_con_el_mismo_nombre_acaban_en_errores(carpetas):
    modelo = ModeloGuionizado(argumentos={**DATOS, "total": "999"})
    for contenido in (b"uno", b"dos"):
        ruta = carpetas / "entrada" / "factura.pdf"
        ruta.write_bytes(contenido)
        agente.procesar(ruta, modelo, SupabaseFalso())

    pdfs = sorted((carpetas / "errores").glob("*.pdf"))
    assert len(pdfs) == 2
    assert {p.read_bytes() for p in pdfs} == {b"uno", b"dos"}
    for pdf in pdfs:
        assert (carpetas / "errores" / f"{pdf.name}.error.txt").exists()


def test_un_fallo_al_mover_no_para_el_lote(carpetas, monkeypatch, caplog):
    for nombre in ("a.pdf", "b.pdf"):
        ruta = carpetas / "entrada" / nombre
        ruta.write_bytes(b"%PDF")
        envejecer(ruta)
    original = agente._mover

    def mover_con_fallo(ruta, destino, razon=None):
        if ruta.name == "a.pdf":
            raise OSError("disco lleno")
        original(ruta, destino, razon)

    monkeypatch.setattr(agente, "_mover", mover_con_fallo)

    with caplog.at_level(logging.ERROR, logger="agente"):
        agente._pasada(carpetas, ModeloGuionizado(argumentos=DATOS), SupabaseFalso())

    assert (carpetas / "procesadas" / "b.pdf").exists()
    assert "a.pdf" in caplog.text


def test_error_generico_al_insertar_borra_la_subida_y_va_a_errores(factura, carpetas):
    supabase = SupabaseFalso(error_insert=ConnectionError("sin red"))

    resultado = agente.procesar(factura, ModeloGuionizado(argumentos=DATOS), supabase)

    assert not resultado.ok
    assert "duplicada" not in resultado.detalle
    assert supabase.borrados[0][1] == [supabase.subidas[0][1]]
    assert (carpetas / "errores" / "factura.pdf").exists()


def test_si_falla_el_borrado_se_conserva_el_error_original(factura, carpetas):
    supabase = SupabaseFalso(error_insert=ConnectionError("sin red"))

    def remove_roto(paths):
        raise RuntimeError("borrado roto")

    supabase.storage.from_ = lambda nombre: type(
        "B", (BucketFalso,), {"remove": lambda self, paths: remove_roto(paths)}
    )(supabase, nombre)

    resultado = agente.procesar(factura, ModeloGuionizado(argumentos=DATOS), supabase)

    assert "sin red" in resultado.detalle


def test_sin_llamada_a_la_herramienta_la_razon_incluye_el_texto_de_claude(factura, carpetas):
    modelo = ModeloSoloTexto(argumentos={}, texto="No veo ninguna factura en la imagen. " + "x" * 400)
    supabase = SupabaseFalso()

    resultado = agente.procesar(factura, modelo, supabase)

    assert not resultado.ok
    assert "No veo ninguna factura" in resultado.detalle
    assert len(resultado.detalle) < 400
    assert supabase.inserciones == []
    assert (carpetas / "errores" / "factura.pdf").exists()


def test_la_fila_insertada_lleva_importes_como_texto_y_tipos_correctos(factura):
    supabase = SupabaseFalso()

    agente.procesar(factura, ModeloGuionizado(argumentos=DATOS), supabase)

    fila = supabase.inserciones[0][1]
    assert (fila["base"], fila["iva"], fila["total"]) == ("100.00", "21.00", "121.00")
    assert all(isinstance(fila[k], str) for k in ("numero", "fecha", "proveedor", "archivo"))
    assert fila["nif"] == "B12345678"


def test_main_sin_variables_explica_cuales_faltan_y_sale(monkeypatch, caplog):
    monkeypatch.setattr(agente, "load_dotenv", lambda *a, **k: None)
    monkeypatch.setattr("sys.argv", ["agente.py"])
    monkeypatch.setenv("OPENROUTER_API_KEY", "")
    monkeypatch.setenv("SUPABASE_URL", "")
    monkeypatch.setenv("SUPABASE_SERVICE_ROLE_KEY", "valor")

    with caplog.at_level(logging.ERROR, logger="agente"), pytest.raises(SystemExit) as salida:
        agente.main()

    assert salida.value.code == 1
    assert "OPENROUTER_API_KEY" in caplog.text
    assert "SUPABASE_URL" in caplog.text
    assert "SUPABASE_SERVICE_ROLE_KEY" not in caplog.text
    assert ".env.example" in caplog.text
