"""Herramienta guardar_factura: la única que escribe en Supabase.

La ejecuta el agente, nunca Claude: Claude solo pide llamarla con unos datos.
"""

import logging
import uuid
from datetime import date
from decimal import Decimal
from pathlib import Path

from langchain_core.tools import BaseTool, tool
from postgrest.exceptions import APIError
from pydantic import BaseModel, Field, model_validator

log = logging.getLogger("agente")

# Extensiones que el agente lee y su tipo MIME. Una sola tabla, a mano: el MIME
# que adivina `mimetypes` depende del sistema y puede variar de un equipo a otro.
TIPOS_MIME = {
    ".pdf": "application/pdf",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
}

BUCKET = "facturas-proveedor"
TABLA = "facturas_proveedor"
# Código de Postgres para unique_violation (índice facturas_proveedor_unica).
VIOLACION_UNICIDAD = "23505"
# Tolerancia por redondeos de céntimo entre base + IVA y total.
TOLERANCIA = Decimal("0.02")


class FacturaDuplicada(Exception):
    """Ya existe una factura del mismo proveedor con ese número."""


class DatosFactura(BaseModel):
    """Datos de una factura de proveedor leídos del documento."""

    numero: str = Field(min_length=1, description="Número de la factura tal como aparece impreso.")
    fecha: date = Field(description="Fecha de emisión de la factura en formato ISO, AAAA-MM-DD.")
    proveedor: str = Field(min_length=1, description="Nombre o razón social de quien emite la factura.")
    nif: str | None = Field(
        default=None,
        description="NIF o CIF del proveedor. Cadena vacía si no aparece en el documento.",
    )
    base: Decimal = Field(description="Base imponible en euros, sin IVA, con punto decimal.")
    iva: Decimal = Field(description="Importe del IVA en euros (no el porcentaje), con punto decimal.")
    total: Decimal = Field(description="Total de la factura en euros, con punto decimal.")

    @model_validator(mode="after")
    def importes_cuadran(self) -> "DatosFactura":
        if abs(self.base + self.iva - self.total) > TOLERANCIA:
            raise ValueError(
                f"Los importes no cuadran: base {self.base} + IVA {self.iva} != total {self.total}"
            )
        return self


def crear_guardar_factura(supabase, ruta: Path) -> BaseTool:
    """Crea la herramienta ligada al archivo que se está procesando.

    Claude no ve el archivo en disco ni la base de datos; por eso la ruta se
    cierra aquí y no es un argumento de la herramienta.
    """

    @tool("guardar_factura", args_schema=DatosFactura, return_direct=True)
    def guardar_factura(
        numero: str,
        fecha: date,
        proveedor: str,
        nif: str | None,
        base: Decimal,
        iva: Decimal,
        total: Decimal,
    ) -> str:
        """Guarda en la base de datos los datos de la factura leída."""
        # Subir primero: si el INSERT falla se borra el archivo y no queda huérfano.
        destino = f"{fecha.year}/{uuid.uuid4()}-{ruta.name}"
        tipo = TIPOS_MIME[ruta.suffix.lower()]
        almacen = supabase.storage.from_(BUCKET)
        almacen.upload(destino, ruta.read_bytes(), {"content-type": tipo})
        try:
            respuesta = (
                supabase.table(TABLA)
                .insert(
                    {
                        "numero": numero,
                        "fecha": fecha.isoformat(),
                        "proveedor": proveedor,
                        # Un NIF vacío significa "no aparece": NULL, no cadena vacía.
                        "nif": (nif or "").strip() or None,
                        # Texto en vez de float para no perder precisión en el JSON.
                        "base": str(base),
                        "iva": str(iva),
                        "total": str(total),
                        "archivo": destino,
                        "nombre_archivo": ruta.name,
                    }
                )
                .execute()
            )
            identificador = respuesta.data[0]["id"]
        except Exception as error:
            # Cualquier fallo (red, respuesta vacía, RLS...) deja el archivo huérfano.
            try:
                almacen.remove([destino])
            except Exception:
                log.exception("no se pudo borrar el archivo huérfano %s", destino)
            if isinstance(error, APIError) and error.code == VIOLACION_UNICIDAD:
                raise FacturaDuplicada(
                    f"Factura duplicada: {proveedor} ya tiene la factura {numero}"
                ) from error
            raise
        return f"guardada {identificador}"

    return guardar_factura
