/**
 * Importes de las facturas. Los totales replican la función SQL que emite las
 * facturas: cada línea se redondea a céntimo, el IVA se calcula por tipo sobre
 * la base agrupada y el redondeo es «medio hacia fuera de cero», como Postgres
 * con numeric. En coma flotante 0.15 * 0.5 da 0.07499999999999999, así que el
 * valor se normaliza a 15 cifras significativas antes de redondear; si no, un
 * medio céntimo caería hacia abajo.
 */

export type LineaImporte = {
  cantidad: number;
  precio_unitario: number;
  /** Porcentaje, de 0 a 100. */
  descuento: number;
  /** Porcentaje de IVA, por ejemplo 21. */
  iva: number;
};

/** Redondea a céntimos con el medio alejándose de cero. */
export function redondear(valor: number): number {
  const centimos = Math.round(Number((Math.abs(valor) * 100).toPrecision(15)));
  if (centimos === 0) return 0;
  return (Math.sign(valor) * centimos) / 100;
}

/** Base de la línea tras el descuento, redondeada a céntimo. */
export function importeLinea(linea: LineaImporte): number {
  return redondear(linea.cantidad * linea.precio_unitario * (1 - linea.descuento / 100));
}

/** Totales de la factura. El IVA se calcula por tipo sobre la base de cada grupo. */
export function totales(lineas: LineaImporte[]): {
  base: number;
  cuotaIva: number;
  total: number;
  porIva: { iva: number; base: number; cuota: number }[];
} {
  const basePorIva = new Map<number, number>();
  for (const linea of lineas) {
    basePorIva.set(linea.iva, (basePorIva.get(linea.iva) ?? 0) + importeLinea(linea));
  }

  const porIva = [...basePorIva]
    .sort(([a], [b]) => b - a)
    .map(([iva, sumaBase]) => {
      const base = redondear(sumaBase);
      return { iva, base, cuota: redondear((base * iva) / 100) };
    });

  const base = redondear(porIva.reduce((suma, grupo) => suma + grupo.base, 0));
  const cuotaIva = redondear(porIva.reduce((suma, grupo) => suma + grupo.cuota, 0));
  return { base, cuotaIva, total: redondear(base + cuotaIva), porIva };
}

const formatoEuro = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });

/** Importe en euros con dos decimales, p. ej. «153,00 €». */
export function euros(valor: number): string {
  return formatoEuro.format(valor);
}
