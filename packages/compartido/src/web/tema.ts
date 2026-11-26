import type { CSSProperties } from "react";
import type { IdFuenteTexto, IdFuenteTitulos, IdPlantilla, Modo, Sitio } from "./esquema";

/**
 * Convierte el tema elegido en el editor en variables CSS (--w-*).
 * Las plantillas SOLO pintan con estas variables (vía clases arbitrarias de
 * Tailwind: bg-[var(--w-fondo)], text-[var(--w-tinta)]…), así cualquier ajuste
 * del editor llega a las tres plantillas.
 *
 * Variables:
 *  --w-fondo, --w-placa, --w-tinta, --w-tinta-2, --w-linea  · neutros de la plantilla en ese modo
 *  --w-acento        · el color elegido, tal cual (rellenos, bloques)
 *  --w-sobre-acento  · texto legible encima del acento (negro o blanco)
 *  --w-acento-tinta  · el acento ajustado para leerse como texto sobre el fondo (≥ 4,5:1)
 *  --w-radio         · esquinas de tarjetas e imágenes
 *  --w-radio-boton   · esquinas de botones y campos
 *  --w-titulos, --w-texto · familias tipográficas
 */

type Neutros = { fondo: string; placa: string; tinta: string; tinta2: string; linea: string };

const NEUTROS: Record<IdPlantilla, Record<Modo, Neutros>> = {
  lamina: {
    oscuro: { fondo: "#08080A", placa: "#101014", tinta: "#ECEAE4", tinta2: "#9A9AA5", linea: "#2A2A33" },
    claro: { fondo: "#F1EFEA", placa: "#FFFFFF", tinta: "#0E0E10", tinta2: "#55555C", linea: "#CFCCC3" },
  },
  revista: {
    claro: { fondo: "#F3EFE6", placa: "#FAF7F0", tinta: "#1B1916", tinta2: "#5E5A51", linea: "#D8D1C1" },
    oscuro: { fondo: "#15130F", placa: "#1F1C17", tinta: "#EFEADF", tinta2: "#A8A293", linea: "#37332B" },
  },
  cartel: {
    oscuro: { fondo: "#0D0D0D", placa: "#1A1A1A", tinta: "#F6F4EC", tinta2: "#B5B3A8", linea: "#3A3A3A" },
    claro: { fondo: "#F6F4EC", placa: "#E8E5D8", tinta: "#0D0D0D", tinta2: "#4B4A44", linea: "#C4C0B0" },
  },
};

export const FAMILIA_TITULOS: Record<IdFuenteTitulos, string> = {
  serif: "var(--fw-serif)",
  grotesca: "var(--fw-grotesca)",
  gotica: "var(--fw-gotica)",
  rotulo: "var(--fw-rotulo)",
};

export const FAMILIA_TEXTO: Record<IdFuenteTexto, string> = {
  inter: "var(--fw-inter)",
  hanken: "var(--fw-hanken)",
  instrument: "var(--fw-instrument)",
  newsreader: "var(--fw-newsreader)",
};

/* ---- contraste (WCAG) ---- */

function rgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}
function aHex([r, g, b]: [number, number, number]) {
  return `#${[r, g, b].map((c) => Math.round(c).toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}
function luminancia(hex: string) {
  const [r, g, b] = rgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contraste(a: string, b: string) {
  const [x, y] = [luminancia(a), luminancia(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}
function mezclar(a: string, b: string, t: number) {
  const [x, y] = [rgb(a), rgb(b)];
  return aHex([0, 1, 2].map((i) => x[i] + (y[i] - x[i]) * t) as [number, number, number]);
}

/** El acento acercado a la tinta hasta que se lea sobre el fondo. */
export function acentoLegible(acento: string, fondo: string, tinta: string, minimo = 4.5) {
  for (let t = 0; t <= 1; t += 0.05) {
    const c = mezclar(acento, tinta, t);
    if (contraste(c, fondo) >= minimo) return c;
  }
  return tinta;
}

export const sobre = (color: string) => (contraste(color, "#0E0E10") >= contraste(color, "#FFFFFF") ? "#0E0E10" : "#FFFFFF");

const RADIO = { rectas: ["0px", "0px"], suaves: ["6px", "4px"], redondas: ["20px", "999px"] } as const;

export function neutros(sitio: Pick<Sitio, "plantilla" | "tema">) {
  return NEUTROS[sitio.plantilla][sitio.tema.modo];
}

export function variablesTema(sitio: Pick<Sitio, "plantilla" | "tema">): CSSProperties {
  const n = neutros(sitio);
  const { acento, esquinas, titulos, texto } = sitio.tema;
  return {
    "--w-fondo": n.fondo,
    "--w-placa": n.placa,
    "--w-tinta": n.tinta,
    "--w-tinta-2": n.tinta2,
    "--w-linea": n.linea,
    "--w-acento": acento,
    "--w-sobre-acento": sobre(acento),
    "--w-acento-tinta": acentoLegible(acento, n.fondo, n.tinta),
    "--w-radio": RADIO[esquinas][0],
    "--w-radio-boton": RADIO[esquinas][1],
    "--w-titulos": FAMILIA_TITULOS[titulos],
    "--w-texto": FAMILIA_TEXTO[texto],
    colorScheme: sitio.tema.modo === "oscuro" ? "dark" : "light",
  } as CSSProperties;
}
