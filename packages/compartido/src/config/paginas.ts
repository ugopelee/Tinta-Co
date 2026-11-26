/**
 * Plantillas de las páginas web que se editan en el CRM y se publican en
 * la web en `/p/<slug>`. Fuente única para las dos apps: el CRM pinta el
 * formulario a partir de `campos` y la web pinta la página según `id`.
 * Añadir una plantilla es añadirla aquí y darle su vista en la web; la
 * base de datos guarda el contenido como un objeto con estas claves.
 */

export type TipoCampo =
  /** Una línea de texto. */
  | "linea"
  /** Texto largo: párrafos separados por una línea en blanco. */
  | "texto"
  /** Ruta de la web (`/fotos/…`) o URL https de una imagen. */
  | "imagen"
  /** Varias imágenes, una por línea. */
  | "imagenes"
  /** Ruta de la web o URL https a la que lleva un botón. */
  | "enlace";

export type CampoPlantilla = {
  clave: string;
  etiqueta: string;
  tipo: TipoCampo;
  obligatorio?: boolean;
  ayuda?: string;
};

export type Plantilla = {
  id: string;
  nombre: string;
  descripcion: string;
  campos: readonly CampoPlantilla[];
};

const AYUDA_TEXTO =
  "Separa los párrafos con una línea en blanco. Una línea que empiece por «## » es un subtítulo.";

export const plantillasPagina = [
  {
    id: "texto",
    nombre: "Texto",
    descripcion: "Una página de lectura: cuidados, condiciones, preguntas frecuentes.",
    campos: [
      { clave: "entradilla", etiqueta: "Entradilla", tipo: "linea" },
      { clave: "cuerpo", etiqueta: "Texto", tipo: "texto", obligatorio: true, ayuda: AYUDA_TEXTO },
    ],
  },
  {
    id: "promocion",
    nombre: "Promoción",
    descripcion: "Una imagen grande, el texto y un botón: jornadas flash, ofertas, eventos.",
    campos: [
      { clave: "entradilla", etiqueta: "Entradilla", tipo: "linea" },
      { clave: "imagen", etiqueta: "Imagen", tipo: "imagen", ayuda: "Ruta de la web (/fotos/…) o URL https." },
      { clave: "cuerpo", etiqueta: "Texto", tipo: "texto", obligatorio: true, ayuda: AYUDA_TEXTO },
      { clave: "boton_texto", etiqueta: "Texto del botón", tipo: "linea" },
      {
        clave: "boton_enlace",
        etiqueta: "Enlace del botón",
        tipo: "enlace",
        ayuda: "Por ejemplo /#reserva para llevar al formulario de cita.",
      },
    ],
  },
  {
    id: "galeria",
    nombre: "Galería",
    descripcion: "Una cuadrícula de fotos con un texto corto: trabajos, el estudio, un artista.",
    campos: [
      { clave: "entradilla", etiqueta: "Entradilla", tipo: "linea" },
      {
        clave: "imagenes",
        etiqueta: "Imágenes",
        tipo: "imagenes",
        obligatorio: true,
        ayuda: "Una por línea: ruta de la web (/fotos/…) o URL https.",
      },
      { clave: "cuerpo", etiqueta: "Texto", tipo: "texto", ayuda: AYUDA_TEXTO },
    ],
  },
  {
    id: "preguntas",
    nombre: "Preguntas frecuentes",
    descripcion: "Preguntas que se abren y se cierran: dudas antes y después de la sesión.",
    campos: [
      { clave: "entradilla", etiqueta: "Entradilla", tipo: "linea" },
      {
        clave: "cuerpo",
        etiqueta: "Preguntas",
        tipo: "texto",
        obligatorio: true,
        ayuda: "Cada pregunta en una línea que empiece por «## » y, debajo, su respuesta.",
      },
      { clave: "boton_texto", etiqueta: "Texto del botón final", tipo: "linea" },
      { clave: "boton_enlace", etiqueta: "Enlace del botón final", tipo: "enlace" },
    ],
  },
] as const satisfies readonly Plantilla[];

export type IdPlantilla = (typeof plantillasPagina)[number]["id"];

export function plantillaPorId(id: string): Plantilla | undefined {
  return plantillasPagina.find((plantilla) => plantilla.id === id);
}

/** Dirección pública de una página dentro de la web. */
export const rutaPagina = (slug: string) => `/p/${slug}`;

/** «Cuidados después del tatuaje» → «cuidados-despues-del-tatuaje». */
export function slugDe(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/, "");
}

export const SLUG_VALIDO = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * Solo rutas de la propia web o direcciones https: nada de `javascript:`
 * en un `src` o un `href`, ni `//otro-sitio` disfrazado de ruta.
 */
export function urlSegura(url: string) {
  return (url.startsWith("/") && !url.startsWith("//")) || url.startsWith("https://");
}

export type BloqueTexto = { tipo: "subtitulo" | "parrafo"; texto: string };

/** Texto plano a bloques: la web nunca pinta HTML escrito en el CRM. */
export function bloquesDeTexto(texto: string): BloqueTexto[] {
  return texto
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((trozo) => trozo.trim())
    .filter(Boolean)
    .map((trozo): BloqueTexto =>
      trozo.startsWith("## ")
        ? { tipo: "subtitulo", texto: trozo.slice(3).trim() }
        : { tipo: "parrafo", texto: trozo },
    );
}

/**
 * Preguntas frecuentes: cada subtítulo es una pregunta y los párrafos que
 * le siguen, su respuesta. El texto anterior a la primera pregunta se pierde
 * a propósito: para eso está la entradilla.
 */
export function preguntasDeTexto(texto: string) {
  const preguntas: { pregunta: string; respuesta: string[] }[] = [];
  for (const bloque of bloquesDeTexto(texto)) {
    if (bloque.tipo === "subtitulo") preguntas.push({ pregunta: bloque.texto, respuesta: [] });
    else preguntas.at(-1)?.respuesta.push(bloque.texto);
  }
  return preguntas;
}

/* --- Tema: paleta, colores y tipografía ------------------------------- */

export type ColoresTema = { fondo: string; texto: string; acento: string };

/**
 * Paletas de partida. Cada una es un ambiente completo del estudio; los
 * colores se pueden retocar a mano después. Comprobadas a 4,5:1 entre texto
 * y fondo; el texto sobre el acento se elige solo (`textoSobre`).
 */
export const paletasPagina = {
  tinta: { nombre: "Tinta", fondo: "#08080a", texto: "#eceae4", acento: "#c2452f", letra: "editorial" },
  hueso: { nombre: "Hueso", fondo: "#f3eee5", texto: "#1b1815", acento: "#a8361f", letra: "editorial" },
  neon: { nombre: "Neón", fondo: "#0b0b12", texto: "#eef0ff", acento: "#c6f432", letra: "grotesca" },
  bosque: { nombre: "Bosque", fondo: "#11201a", texto: "#e7eee4", acento: "#d9a441", letra: "moderna" },
  oceano: { nombre: "Océano", fondo: "#0e1b2a", texto: "#e6eef6", acento: "#5ec8e5", letra: "moderna" },
  peonia: { nombre: "Peonía", fondo: "#fbedef", texto: "#2a1a1f", acento: "#c2335d", letra: "editorial" },
} as const satisfies Record<string, ColoresTema & { nombre: string; letra: IdLetra }>;

export type IdPaleta = keyof typeof paletasPagina;

/**
 * Tipografías de los titulares. `variable` es la variable CSS de la fuente
 * que cada app carga con next/font: las dos deben declarar las tres.
 */
export const letrasPagina = {
  editorial: { nombre: "Editorial", variable: "--font-serif" },
  moderna: { nombre: "Moderna", variable: "--font-cuerpo" },
  grotesca: { nombre: "Grotesca", variable: "--font-menu-ui" },
} as const;

export type IdLetra = keyof typeof letrasPagina;

/** Lo que se guarda: la paleta y, si se han tocado, los retoques. */
export type TemaPagina = Partial<ColoresTema> & { paleta?: string; letra?: string };

export type TemaResuelto = ColoresTema & { paleta: IdPaleta; letra: IdLetra };

export const COLOR_VALIDO = /^#[0-9a-f]{6}$/i;

const esPaleta = (id: unknown): id is IdPaleta => typeof id === "string" && id in paletasPagina;
const esLetra = (id: unknown): id is IdLetra => typeof id === "string" && id in letrasPagina;
const color = (valor: unknown, porDefecto: string) =>
  typeof valor === "string" && COLOR_VALIDO.test(valor) ? valor.toLowerCase() : porDefecto;

/** Lo guardado (que puede venir vacío o viejo) a un tema completo. Nunca falla. */
export function resolverTema(tema: TemaPagina | null | undefined): TemaResuelto {
  const paleta = esPaleta(tema?.paleta) ? tema.paleta : "tinta";
  const base = paletasPagina[paleta];
  return {
    paleta,
    fondo: color(tema?.fondo, base.fondo),
    texto: color(tema?.texto, base.texto),
    acento: color(tema?.acento, base.acento),
    letra: esLetra(tema?.letra) ? tema.letra : base.letra,
  };
}

/** Luminancia relativa de un color #rrggbb, como la define WCAG. */
function luminancia(hex: string) {
  const canal = (desde: number) => {
    const valor = parseInt(hex.slice(desde, desde + 2), 16) / 255;
    return valor <= 0.03928 ? valor / 12.92 : ((valor + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * canal(1) + 0.7152 * canal(3) + 0.0722 * canal(5);
}

/** Contraste WCAG entre dos colores: de 1 (igual) a 21 (negro y blanco). */
export function contraste(a: string, b: string) {
  const [clara, oscura] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (clara + 0.05) / (oscura + 0.05);
}

/** Negro o blanco, el que más se lea sobre `fondo`. */
export function textoSobre(fondo: string) {
  return contraste(fondo, "#000000") >= contraste(fondo, "#ffffff") ? "#000000" : "#ffffff";
}

/**
 * Variables CSS de una página. Los tonos intermedios salen de mezclar texto
 * y fondo, así cualquier pareja de colores da una página coherente.
 */
export function variablesTema(tema: TemaResuelto): Record<string, string> {
  return {
    "--pw-fondo": tema.fondo,
    "--pw-texto": tema.texto,
    "--pw-acento": tema.acento,
    "--pw-sobre-acento": textoSobre(tema.acento),
    "--pw-tenue": `color-mix(in srgb, ${tema.texto} 68%, ${tema.fondo})`,
    "--pw-superficie": `color-mix(in srgb, ${tema.texto} 6%, ${tema.fondo})`,
    "--pw-borde": `color-mix(in srgb, ${tema.texto} 18%, ${tema.fondo})`,
    "--pw-letra": `var(${letrasPagina[tema.letra].variable})`,
  };
}

/* --- Modelos: páginas ya hechas para empezar ---------------------------- */

export type ModeloPagina = {
  id: string;
  nombre: string;
  titulo: string;
  plantilla: IdPlantilla;
  tema: TemaPagina;
  contenido: Record<string, string>;
};

/**
 * Páginas completas listas para publicar o retocar. Las fotos son las de la
 * propia web (`apps/web/public/fotos`), con su licencia ya revisada.
 */
export const modelosPagina: ModeloPagina[] = [
  {
    id: "cuidados",
    nombre: "Cuidados del tatuaje",
    titulo: "Cuidados después del tatuaje",
    plantilla: "texto",
    tema: { paleta: "hueso" },
    contenido: {
      entradilla: "Las primeras dos semanas deciden cómo se verá tu tatuaje dentro de diez años.",
      cuerpo: [
        "## Las primeras horas",
        "Deja el film puesto entre 2 y 4 horas. Después, lávate las manos, retíralo y limpia la zona con agua tibia y jabón neutro, sin frotar.",
        "## Los primeros quince días",
        "Aplica una capa fina de crema reparadora dos o tres veces al día. Si brilla, es demasiada.\nNo rasques las costras: se caen solas.",
        "## Qué evitar",
        "Sol directo, piscina, mar y sauna hasta que cicatrice del todo. Ropa que roce o apriete la zona.",
        "## Cuándo escribirnos",
        "Si notas calor, hinchazón que crece después del tercer día o cualquier cosa que te preocupe, escríbenos. Preferimos una consulta de más.",
      ].join("\n\n"),
    },
  },
  {
    id: "jornada-flash",
    nombre: "Jornada flash",
    titulo: "Jornada flash: un sábado, diseños cerrados",
    plantilla: "promocion",
    tema: { paleta: "neon", letra: "grotesca" },
    contenido: {
      entradilla: "Elige un diseño de la pared, siéntate y sal tatuado. Sin cita previa, por orden de llegada.",
      imagen: "/fotos/pared.webp",
      cuerpo: [
        "Un día al año abrimos el estudio de par en par: veinte diseños flash dibujados para la ocasión, a precio cerrado y en tamaño pequeño.",
        "## Cómo funciona",
        "Llega, elige en la pared y te damos número. Cada diseño se tatúa una sola vez: cuando se va, se va.",
      ].join("\n\n"),
      boton_texto: "Ver los diseños flash",
      boton_enlace: "/#catalogo",
    },
  },
  {
    id: "trabajos",
    nombre: "Trabajos recientes",
    titulo: "Trabajos recientes",
    plantilla: "galeria",
    tema: { paleta: "tinta" },
    contenido: {
      entradilla: "Una selección de piezas que han salido del estudio esta temporada.",
      imagenes: [
        "/fotos/espalda.webp",
        "/fotos/pierna.webp",
        "/fotos/cuello.webp",
        "/fotos/pulpo.webp",
        "/fotos/peonias.webp",
        "/fotos/filacteria.webp",
      ].join("\n"),
      cuerpo: "¿Te gusta alguna? Cuéntanos tu idea y la dibujamos para ti.",
    },
  },
  {
    id: "preguntas",
    nombre: "Preguntas frecuentes",
    titulo: "Preguntas frecuentes",
    plantilla: "preguntas",
    tema: { paleta: "bosque" },
    contenido: {
      entradilla: "Lo que más nos preguntáis antes de la primera sesión.",
      cuerpo: [
        "## ¿Duele?",
        "Depende de la zona y de cada persona. Las zonas con hueso cerca molestan más. Paramos siempre que lo necesites.",
        "## ¿Cuánto cuesta un tatuaje?",
        "Los flash tienen precio cerrado. Las piezas a medida se presupuestan según tamaño y horas, después de hablar contigo.",
        "## ¿Necesito dejar señal?",
        "Sí, para reservar una cita a medida. Se descuenta del precio final.",
        "## ¿Puedo tatuarme si estoy tomando medicación?",
        "Algunos medicamentos afectan a la cicatrización. Cuéntanoslo en la ficha de salud y lo vemos juntos.",
      ].join("\n\n"),
      boton_texto: "Pedir cita",
      boton_enlace: "/#reserva",
    },
  },
  {
    id: "bono-regalo",
    nombre: "Bono regalo",
    titulo: "Regala un tatuaje",
    plantilla: "promocion",
    tema: { paleta: "peonia" },
    contenido: {
      entradilla: "Bonos de 50, 100 o 150 € para canjear en cualquier trabajo del estudio durante un año.",
      imagen: "/fotos/sesion.webp",
      cuerpo: "Pásate por el estudio o escríbenos y te lo preparamos en una tarjeta impresa, lista para regalar.",
      boton_texto: "Escríbenos",
      boton_enlace: "/#reserva",
    },
  },
];

/** Las imágenes de un campo `imagenes`: una por línea, solo las seguras. */
export function listaImagenes(texto: string) {
  return texto
    .split("\n")
    .map((linea) => linea.trim())
    .filter((linea) => linea && urlSegura(linea));
}
