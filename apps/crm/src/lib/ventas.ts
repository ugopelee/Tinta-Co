import { tiposIva } from "@tinta/compartido/estudio";

/** Las cifras se editan como texto para no pelearse con la coma ni con el campo vacío. */
export type LineaEditable = {
  clave: string;
  descripcion: string;
  diseno_id: string | null;
  cantidad: string;
  precio: string;
  descuento: string;
  iva: number;
};

let contador = 0;

export function lineaEditable(datos: {
  descripcion: string;
  diseno_id: string | null;
  cantidad?: number;
  precio_unitario?: number;
  descuento?: number;
  iva?: number;
}): LineaEditable {
  return {
    clave: `linea-${++contador}`,
    descripcion: datos.descripcion,
    diseno_id: datos.diseno_id,
    cantidad: String(datos.cantidad ?? 1),
    precio: String(datos.precio_unitario ?? 0),
    descuento: String(datos.descuento ?? 0),
    iva: datos.iva ?? tiposIva[0],
  };
}
