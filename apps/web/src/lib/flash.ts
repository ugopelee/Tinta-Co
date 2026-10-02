/**
 * Piezas del escaparate del catálogo y fotos del estudio. Son fotos reales
 * de dominio público (CC0), optimizadas en `public/fotos`. Los diseños que se
 * reservan de verdad siguen en la tabla `disenos` y salen en el formulario.
 *
 * Créditos (CC0, no exigen atribución, pero se agradecen): pulpo — Matt
 * Moloney · cuello — Clem Onojeghuo · nebulosa — Little Visuals · sesión,
 * calco — Candace McDaniel · artista, boceto, pared — Allef Vinicius
 * (StockSnap) · filacteria, peonías, pierna, guantes, aguja, máquina,
 * plantillas — rawpixel.
 *
 * La espalda de la portada viene de Unsplash (licencia Unsplash, uso libre
 * sin atribución): unsplash.com/photos/FhK6nTHdzJ4, a 2560 px.
 */

/**
 * Punto de cada foto (0–1) que el recorte debe conservar: el tatuaje. Las
 * piezas en sí viven en la tabla `disenos` y se gestionan desde el CRM.
 */
const focos: Record<string, [number, number]> = {
  "/fotos/filacteria.webp": [0.62, 0.5],
  "/fotos/peonias.webp": [0.3, 0.55],
  "/fotos/pierna.webp": [0.55, 0.55],
  "/fotos/cuello.webp": [0.42, 0.55],
  "/fotos/pulpo.webp": [0.44, 0.55],
  "/fotos/nebulosa.webp": [0.5, 0.5],
};

export const focoDe = (foto: string): [number, number] => focos[foto] ?? [0.5, 0.5];

/** Fotos del estudio, en el orden en que aparecen en la sección. */
export const fotosEstudio = {
  artista: "/fotos/artista.webp",
  aguja: "/fotos/aguja.webp",
  calco: "/fotos/calco.webp",
  boceto: "/fotos/boceto.webp",
  guantes: "/fotos/guantes.webp",
  maquina: "/fotos/maquina.webp",
  plantillas: "/fotos/plantillas.webp",
  pared: "/fotos/pared.webp",
  sesion: "/fotos/sesion.webp",
  espalda: "/fotos/espalda.webp",
} as const;
