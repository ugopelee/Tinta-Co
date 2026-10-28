import { describe, expect, it } from "vitest";
import { euros, importeLinea, totales } from "./importes";

describe("importeLinea", () => {
  it("aplica el descuento a la base de la línea", () => {
    expect(importeLinea({ cantidad: 2, precio_unitario: 85, descuento: 10, iva: 21 })).toBe(153);
  });

  it("redondea sin errores de coma flotante", () => {
    expect(importeLinea({ cantidad: 3, precio_unitario: 0.1, descuento: 0, iva: 21 })).toBe(0.3);
  });

  it("redondea el medio céntimo hacia arriba como Postgres", () => {
    expect(importeLinea({ cantidad: 1, precio_unitario: 0.15, descuento: 50, iva: 21 })).toBe(0.08);
  });
});

describe("totales", () => {
  it("agrupa el IVA por tipo y suma base, cuota y total", () => {
    expect(
      totales([
        { cantidad: 1, precio_unitario: 100, descuento: 0, iva: 21 },
        { cantidad: 1, precio_unitario: 50, descuento: 0, iva: 10 },
      ]),
    ).toEqual({
      base: 150,
      cuotaIva: 26,
      total: 176,
      porIva: [
        { iva: 21, base: 100, cuota: 21 },
        { iva: 10, base: 50, cuota: 5 },
      ],
    });
  });

  it("devuelve ceros sin líneas", () => {
    expect(totales([])).toEqual({ base: 0, cuotaIva: 0, total: 0, porIva: [] });
  });
});

describe("euros", () => {
  it("formatea en euros con dos decimales y localiza en es-ES", () => {
    expect(euros(153)).toBe("153,00 €");
  });
});
