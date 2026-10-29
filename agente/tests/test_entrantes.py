"""Pruebas de la cola de facturas subidas desde el CRM.

Mismo enfoque que test_agente.py: sin red. El doble de Supabase guarda las
filas de `facturas_entrantes` en memoria y entiende las consultas que hace
el agente (select/update/delete con filtros eq).
"""

import pytest

import agente
from test_agente import DATOS, ModeloGuionizado, RespuestaFalsa


class ConsultaEnMemoria:
    def __init__(self, supabase, tabla):
        self.supabase, self.tabla = supabase, tabla
        self.operacion, self.datos, self.filtros = "select", None, []

    def select(self, *_columnas):
        return self

    def order(self, *_args, **_kwargs):
        return self

    def eq(self, columna, valor):
        self.filtros.append((columna, valor))
        return self

    def insert(self, fila):
        self.operacion, self.datos = "insert", fila
        return self

    def update(self, cambios):
        self.operacion, self.datos = "update", cambios
        return self

    def delete(self):
        self.operacion = "delete"
        return self

    def execute(self):
        if self.tabla == "facturas_proveedor":
            self.supabase.inserciones.append(self.datos)
            return RespuestaFalsa([{"id": "id-123"}])
        filas = self.supabase.entrantes
        coinciden = [f for f in filas if all(f.get(c) == v for c, v in self.filtros)]
        if self.operacion == "update":
            for fila in coinciden:
                fila.update(self.datos)
        elif self.operacion == "delete":
            self.supabase.entrantes = [f for f in filas if f not in coinciden]
        return RespuestaFalsa([dict(f) for f in coinciden])


class BucketEnMemoria:
    def __init__(self, supabase):
        self.supabase = supabase

    def upload(self, path, file, file_options=None):
        self.supabase.objetos[path] = file

    def download(self, path):
        return self.supabase.objetos[path]

    def remove(self, paths):
        for path in paths:
            self.supabase.objetos.pop(path, None)


class AlmacenEnMemoria:
    def __init__(self, supabase):
        self.supabase = supabase

    def from_(self, _nombre):
        return BucketEnMemoria(self.supabase)


class SupabaseEnMemoria:
    def __init__(self, entrantes):
        self.entrantes = entrantes
        self.inserciones = []
        self.objetos = {f["archivo"]: b"%PDF-1.4 falso" for f in entrantes}
        self.storage = AlmacenEnMemoria(self)

    def table(self, nombre):
        return ConsultaEnMemoria(self, nombre)


def entrante(id_="a1b2c3d4-0000", nombre="luz.pdf", estado="pendiente"):
    return {"id": id_, "archivo": f"entrada/{id_}-{nombre}", "nombre_archivo": nombre, "estado": estado}


@pytest.fixture
def carpetas(tmp_path):
    for nombre in agente.CARPETAS:
        (tmp_path / nombre).mkdir()
    return tmp_path


def test_subida_correcta_crea_la_factura_y_vacia_la_cola(carpetas):
    supabase = SupabaseEnMemoria([entrante()])

    agente._pasada_crm(carpetas, ModeloGuionizado(argumentos=DATOS), supabase)

    assert len(supabase.inserciones) == 1
    assert supabase.inserciones[0]["nombre_archivo"] == "luz.pdf"
    assert supabase.entrantes == []
    # Queda solo la copia que sube guardar_factura, no la de entrada/.
    assert list(supabase.objetos) == [supabase.inserciones[0]["archivo"]]
    assert (carpetas / "procesadas" / "luz.pdf").exists()


def test_subida_con_importes_que_no_cuadran_queda_en_error_con_motivo(carpetas):
    supabase = SupabaseEnMemoria([entrante()])

    agente._pasada_crm(carpetas, ModeloGuionizado(argumentos={**DATOS, "total": "150.00"}), supabase)

    assert supabase.inserciones == []
    [fila] = supabase.entrantes
    assert fila["estado"] == "error"
    assert fila["motivo"].startswith("Los importes no cuadran")
    # El original sigue en el bucket para verlo o reintentar.
    assert fila["archivo"] in supabase.objetos


def test_solo_se_leen_las_pendientes(carpetas):
    supabase = SupabaseEnMemoria([entrante(estado="error"), entrante("ffff0000-1111", estado="leyendo")])
    modelo = ModeloGuionizado(argumentos=DATOS)

    agente._pasada_crm(carpetas, modelo, supabase)

    assert modelo.llamadas == 0
    assert supabase.inserciones == []


def test_una_ya_reclamada_por_otro_agente_no_se_lee(carpetas):
    fila = entrante()
    supabase = SupabaseEnMemoria([{**fila, "estado": "leyendo"}])
    modelo = ModeloGuionizado(argumentos=DATOS)

    assert agente.procesar_entrante(fila, carpetas, modelo, supabase) is None
    assert modelo.llamadas == 0


def test_original_que_no_se_puede_descargar_queda_en_error(carpetas):
    supabase = SupabaseEnMemoria([entrante()])
    supabase.objetos.clear()

    agente._pasada_crm(carpetas, ModeloGuionizado(argumentos=DATOS), supabase)

    [fila] = supabase.entrantes
    assert fila["estado"] == "error"
    assert "No se pudo descargar" in fila["motivo"]


def test_nombre_repetido_en_crm_no_pisa_el_archivo(carpetas):
    (carpetas / "crm" / "luz.pdf").write_bytes(b"otra factura")
    supabase = SupabaseEnMemoria([entrante()])

    agente._pasada_crm(carpetas, ModeloGuionizado(argumentos=DATOS), supabase)

    assert (carpetas / "crm" / "luz.pdf").read_bytes() == b"otra factura"
    assert supabase.inserciones[0]["nombre_archivo"] == "luz-a1b2c3d4.pdf"


def test_la_descarga_no_va_a_entrada_para_que_la_pasada_de_carpeta_no_la_robe(carpetas, monkeypatch):
    vistas = []
    original = agente.procesar
    monkeypatch.setattr(agente, "procesar", lambda ruta, *a: (vistas.append(ruta.parent.name), original(ruta, *a))[1])
    supabase = SupabaseEnMemoria([entrante()])

    agente._pasada_crm(carpetas, ModeloGuionizado(argumentos=DATOS), supabase)

    assert vistas == ["crm"]


def test_si_procesar_revienta_la_fila_queda_en_error_y_no_leyendo(carpetas, monkeypatch):
    def revienta(*_args):
        raise OSError("disco lleno")

    monkeypatch.setattr(agente, "procesar", revienta)
    supabase = SupabaseEnMemoria([entrante()])

    agente._pasada_crm(carpetas, ModeloGuionizado(argumentos=DATOS), supabase)

    [fila] = supabase.entrantes
    assert fila["estado"] == "error"
    assert "disco lleno" in fila["motivo"]


def test_reiniciar_devuelve_a_la_cola_las_que_se_quedaron_leyendo():
    supabase = SupabaseEnMemoria([entrante(estado="leyendo"), entrante("ffff0000-1111", estado="error")])

    agente.reiniciar_entrantes(supabase)

    assert [f["estado"] for f in supabase.entrantes] == ["pendiente", "error"]


def test_motivo_legible_quita_la_plantilla_de_langgraph():
    detalle = (
        "Error invoking tool 'guardar_factura' with kwargs {...} with error:\n"
        " total: Value error, Los importes no cuadran: base 1 + IVA 1 != total 5\n"
        " Please fix the error and try again."
    )
    assert agente.motivo_legible(detalle) == "Los importes no cuadran: base 1 + IVA 1 != total 5"
    assert agente.motivo_legible("Factura duplicada: X ya tiene la factura 1") == "Factura duplicada: X ya tiene la factura 1"


def test_motivo_legible_resume_los_errores_de_openrouter():
    detalle = "ResponseValidationError: Response validation failed: 5 validation errors for Unmarshaller\nbody.choices ..."
    assert agente.motivo_legible(detalle) == "El modelo de IA no ha respondido bien. Pulsa Reintentar."
