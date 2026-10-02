/**
 * Trimestres naturales para Informes y para el CSV de la gestoría. Las fechas
 * van como texto «AAAA-MM-DD» (igual que `fecha_cobro`), así que comparar
 * cadenas basta y no hay zonas horarias que muevan un cobro de trimestre.
 */

export type Trimestre = {
  anio: number;
  numero: 1 | 2 | 3 | 4;
  /** «2026-T3», el valor que viaja en la URL. */
  clave: string;
  desde: string;
  /** Primer día del trimestre siguiente: el rango es [desde, hasta). */
  hasta: string;
  nombre: string;
};

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

const dia = (anio: number, mes: number) =>
  `${anio + Math.floor(mes / 12)}-${String((mes % 12) + 1).padStart(2, "0")}-01`;

export function trimestre(anio: number, numero: number): Trimestre {
  const n = (Math.min(4, Math.max(1, numero)) as Trimestre["numero"]);
  const mesInicio = (n - 1) * 3;
  return {
    anio,
    numero: n,
    clave: `${anio}-T${n}`,
    desde: dia(anio, mesInicio),
    hasta: dia(anio, mesInicio + 3),
    nombre: `${MESES[mesInicio]} – ${MESES[mesInicio + 2]} ${anio}`,
  };
}

/** El de hoy en Madrid si la clave no vale: un enlace roto no rompe la vista. */
export function trimestreDe(clave: string | string[] | undefined): Trimestre {
  const coincide = typeof clave === "string" ? clave.match(/^(\d{4})-T([1-4])$/) : null;
  if (coincide) return trimestre(Number(coincide[1]), Number(coincide[2]));

  const hoy = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" }).format(new Date());
  const [anio, mes] = hoy.split("-").map(Number);
  return trimestre(anio, Math.ceil(mes / 3));
}

export const anterior = (t: Trimestre) =>
  t.numero === 1 ? trimestre(t.anio - 1, 4) : trimestre(t.anio, t.numero - 1);

export const siguiente = (t: Trimestre) =>
  t.numero === 4 ? trimestre(t.anio + 1, 1) : trimestre(t.anio, t.numero + 1);

export const meses = (t: Trimestre) =>
  [0, 1, 2].map((i) => ({
    clave: dia(t.anio, (t.numero - 1) * 3 + i).slice(0, 7),
    nombre: MESES[(t.numero - 1) * 3 + i],
  }));
