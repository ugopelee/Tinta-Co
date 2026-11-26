import type {
  Boton,
  Esquinas,
  IdFuenteTexto,
  IdFuenteTitulos,
  IdPlantilla,
  Imagen,
  Seccion,
  Sitio,
  Tema,
  TipoSeccion,
} from "./esquema";

/* ------------------------------------------------------------------
   PLANTILLAS
   ------------------------------------------------------------------ */

export type InfoPlantilla = {
  id: IdPlantilla;
  nombre: string;
  descripcion: string;
  /** Tema que se aplica al elegir la plantilla (el usuario puede cambiarlo después). */
  tema: Tema;
};

export const PLANTILLAS: InfoPlantilla[] = [
  {
    id: "lamina",
    nombre: "Lámina",
    descripcion: "Oscura, como una hoja de flash: marcos finos, piezas numeradas, rótulos en mono y letra condensada.",
    tema: { acento: "#C2452F", modo: "oscuro", titulos: "rotulo", texto: "inter", esquinas: "rectas" },
  },
  {
    id: "revista",
    nombre: "Revista",
    descripcion: "Clara y editorial, color hueso. Titulares con serifa y una palabra en cursiva, fotos grandes y columnas asimétricas.",
    tema: { acento: "#A8361F", modo: "claro", titulos: "serif", texto: "newsreader", esquinas: "suaves" },
  },
  {
    id: "cartel",
    nombre: "Cartel",
    descripcion: "Póster de convención: titular gótico gigante, bloques de color planos y aire de sello o pegatina.",
    tema: { acento: "#C6F432", modo: "oscuro", titulos: "gotica", texto: "hanken", esquinas: "rectas" },
  },
];

export const plantilla = (id: IdPlantilla) => PLANTILLAS.find((p) => p.id === id) ?? PLANTILLAS[0];

/* ------------------------------------------------------------------
   ESTILO
   ------------------------------------------------------------------ */

export const FUENTES_TITULOS: { id: IdFuenteTitulos; nombre: string }[] = [
  { id: "serif", nombre: "Serifa editorial (Instrument Serif)" },
  { id: "grotesca", nombre: "Grotesca (Bricolage Grotesque)" },
  { id: "gotica", nombre: "Gótica (UnifrakturCook)" },
  { id: "rotulo", nombre: "Rótulo condensado (Big Shoulders Display)" },
];

export const FUENTES_TEXTO: { id: IdFuenteTexto; nombre: string }[] = [
  { id: "inter", nombre: "Inter" },
  { id: "hanken", nombre: "Hanken Grotesk" },
  { id: "instrument", nombre: "Instrument Sans" },
  { id: "newsreader", nombre: "Newsreader (serifa)" },
];

export const ESQUINAS: { id: Esquinas; nombre: string }[] = [
  { id: "rectas", nombre: "Rectas" },
  { id: "suaves", nombre: "Suaves" },
  { id: "redondas", nombre: "Redondas" },
];

/** Acentos propuestos en el editor; además se puede escribir cualquier hex. */
export const ACENTOS = ["#C2452F", "#A8361F", "#C6F432", "#5EC8E5", "#E0745E", "#F2C14E", "#ECEAE4", "#08080A"];

/* ------------------------------------------------------------------
   SECCIONES · catálogo y campos editables
   ------------------------------------------------------------------ */

/**
 * Descripción de un campo para el editor genérico.
 * - texto / textoLargo: string
 * - imagen: Imagen | null
 * - imagenes: Imagen[]
 * - boton: Boton | null (opcional: se puede quitar)
 * - opcion: string entre `opciones`
 * - numero: entero entre `min` y `max`
 * - lista: array de objetos con `subcampos` (todos texto o textoLargo)
 */
export type Campo =
  | { clave: string; etiqueta: string; tipo: "texto"; ayuda?: string; max?: number; multilinea?: boolean }
  | { clave: string; etiqueta: string; tipo: "textoLargo"; ayuda?: string; max?: number }
  | { clave: string; etiqueta: string; tipo: "imagen"; ayuda?: string }
  | { clave: string; etiqueta: string; tipo: "imagenes"; ayuda?: string; max?: number }
  | { clave: string; etiqueta: string; tipo: "boton"; ayuda?: string }
  | { clave: string; etiqueta: string; tipo: "opcion"; opciones: { valor: string; texto: string }[] }
  | { clave: string; etiqueta: string; tipo: "numero"; min: number; max: number }
  | {
      clave: string;
      etiqueta: string;
      tipo: "lista";
      /** Nombre de un elemento, en singular: «ventaja», «pregunta». */
      elemento: string;
      max?: number;
      subcampos: { clave: string; etiqueta: string; tipo: "texto" | "textoLargo" }[];
    };

export type InfoSeccion = {
  tipo: TipoSeccion;
  nombre: string;
  descripcion: string;
  /** Nombre de un icono de lucide-react (PascalCase, p. ej. «Flag»); el CRM lo traduce. */
  icono: string;
  /** Los datos salen de la config del estudio, de los diseños flash o del formulario de reserva. */
  conDatos: boolean;
  campos: Campo[];
  crear: () => Seccion;
};

const ANTETITULO: Campo = { clave: "antetitulo", etiqueta: "Antetítulo", tipo: "texto", max: 40, ayuda: "Rótulo corto encima del título." };
const TITULO: Campo = { clave: "titulo", etiqueta: "Título", tipo: "texto", max: 90 };
const TEXTO: Campo = { clave: "texto", etiqueta: "Texto", tipo: "textoLargo", max: 400 };

export function nuevoId(tipo: string) {
  const azar =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${tipo}-${azar}`;
}

const FOTO = (archivo: string, alt: string): Imagen => ({ url: `/fotos/${archivo}`, alt });
const RESERVA: Boton = { texto: "Reservar cita", destino: "#reserva" };

export const SECCIONES: InfoSeccion[] = [
  {
    tipo: "portada",
    nombre: "Portada",
    descripcion: "Lo primero que se ve: titular, frase y botones.",
    icono: "Flag",
    conDatos: false,
    campos: [
      ANTETITULO,
      { clave: "titulo", etiqueta: "Titular", tipo: "texto", max: 70, multilinea: true, ayuda: "Corto y directo. Intro para partir la línea." },
      { clave: "subtitulo", etiqueta: "Subtítulo", tipo: "textoLargo", max: 240 },
      { clave: "boton", etiqueta: "Botón principal", tipo: "boton" },
      { clave: "botonSecundario", etiqueta: "Botón secundario", tipo: "boton" },
      { clave: "imagen", etiqueta: "Imagen de fondo", tipo: "imagen" },
    ],
    crear: () => ({
      id: nuevoId("portada"),
      tipo: "portada",
      visible: true,
      antetitulo: "Flash de autor, piezas a medida",
      titulo: "Tinta que\naguanta\nel tiempo",
      subtitulo:
        "Diseños flash listos para tatuar y proyectos personalizados dibujados desde cero. Reserva tu cita y hablamos de tu idea sin compromiso.",
      boton: RESERVA,
      botonSecundario: { texto: "Ver catálogo flash", destino: "#flash" },
      imagen: FOTO("sesion.webp", "Sesión de tatuaje en Tinta&Co"),
    }),
  },
  {
    tipo: "texto",
    nombre: "Texto con imagen",
    descripcion: "Un bloque de texto con foto al lado.",
    icono: "FileText",
    conDatos: false,
    campos: [
      ANTETITULO,
      TITULO,
      { clave: "cuerpo", etiqueta: "Texto", tipo: "textoLargo", max: 1200, ayuda: "Deja una línea en blanco para separar párrafos." },
      { clave: "imagen", etiqueta: "Imagen", tipo: "imagen" },
      {
        clave: "lado",
        etiqueta: "Imagen a la",
        tipo: "opcion",
        opciones: [
          { valor: "derecha", texto: "Derecha" },
          { valor: "izquierda", texto: "Izquierda" },
        ],
      },
      { clave: "boton", etiqueta: "Botón", tipo: "boton" },
    ],
    crear: () => ({
      id: nuevoId("texto"),
      tipo: "texto",
      visible: true,
      antetitulo: "El estudio",
      titulo: "Sin prisa y con una sola sesión abierta",
      cuerpo:
        "Estudio de tatuaje en Madrid especializado en diseños flash de trazo limpio y proyectos personalizados.\n\nTrabajamos con cita previa, sin prisa y con una sola sesión abierta a la vez.",
      imagen: FOTO("pared.webp", "Pared de diseños del estudio"),
      lado: "derecha",
      boton: null,
    }),
  },
  {
    tipo: "ventajas",
    nombre: "Ventajas",
    descripcion: "Lista de puntos fuertes, con título y texto corto.",
    icono: "ListChecks",
    conDatos: false,
    campos: [
      ANTETITULO,
      TITULO,
      {
        clave: "elementos",
        etiqueta: "Ventajas",
        tipo: "lista",
        elemento: "ventaja",
        max: 8,
        subcampos: [
          { clave: "titulo", etiqueta: "Título", tipo: "texto" },
          { clave: "texto", etiqueta: "Texto", tipo: "textoLargo" },
        ],
      },
    ],
    crear: () => ({
      id: nuevoId("ventajas"),
      tipo: "ventajas",
      visible: true,
      antetitulo: "Cómo trabajamos",
      titulo: "Sin sorpresas",
      elementos: [
        { titulo: "Cita previa", texto: "Una sola sesión abierta a la vez: tu tatuaje no compite con otro." },
        { titulo: "Precio cerrado", texto: "En los diseños flash sabes lo que pagas antes de empezar." },
        { titulo: "Diseño a medida", texto: "Partimos de tu idea y la dibujamos desde cero, con los ajustes que hagan falta." },
      ],
    }),
  },
  {
    tipo: "cifras",
    nombre: "Cifras",
    descripcion: "Números grandes con su etiqueta. Escribe solo datos reales.",
    icono: "Hash",
    conDatos: false,
    campos: [
      ANTETITULO,
      TITULO,
      {
        clave: "elementos",
        etiqueta: "Cifras",
        tipo: "lista",
        elemento: "cifra",
        max: 6,
        subcampos: [
          { clave: "valor", etiqueta: "Valor", tipo: "texto" },
          { clave: "etiqueta", etiqueta: "Etiqueta", tipo: "texto" },
        ],
      },
    ],
    crear: () => ({
      id: nuevoId("cifras"),
      tipo: "cifras",
      visible: true,
      antetitulo: "En números",
      titulo: "",
      // Vacía a propósito: las cifras las escribe el equipo, nunca se inventan.
      elementos: [],
    }),
  },
  {
    tipo: "galeria",
    nombre: "Galería",
    descripcion: "Fotos del estudio y del trabajo.",
    icono: "Images",
    conDatos: false,
    campos: [ANTETITULO, TITULO, { clave: "imagenes", etiqueta: "Fotos", tipo: "imagenes", max: 12 }],
    crear: () => ({
      id: nuevoId("galeria"),
      tipo: "galeria",
      visible: true,
      antetitulo: "Galería",
      titulo: "El estudio por dentro",
      imagenes: [
        FOTO("espalda.webp", "Tatuaje de espalda"),
        FOTO("aguja.webp", "Aguja de tatuar"),
        FOTO("artista.webp", "Artista tatuando"),
        FOTO("boceto.webp", "Boceto de un diseño"),
      ],
    }),
  },
  {
    tipo: "servicios",
    nombre: "Servicios",
    descripcion: "Los servicios del estudio, con su descripción y precio orientativo.",
    icono: "Layers",
    conDatos: true,
    campos: [ANTETITULO, TITULO, TEXTO],
    crear: () => ({
      id: nuevoId("servicios"),
      tipo: "servicios",
      visible: true,
      antetitulo: "Servicios",
      titulo: "Qué hacemos",
      texto: "",
    }),
  },
  {
    tipo: "flash",
    nombre: "Catálogo flash",
    descripcion: "Los diseños flash publicados, listos para tatuar.",
    icono: "Sparkles",
    conDatos: true,
    campos: [ANTETITULO, TITULO, TEXTO, { clave: "limite", etiqueta: "Diseños que se muestran", tipo: "numero", min: 1, max: 24 }],
    crear: () => ({
      id: nuevoId("flash"),
      tipo: "flash",
      visible: true,
      antetitulo: "Flash",
      titulo: "Listos para tatuar",
      texto: "Diseños ya dibujados, con precio cerrado.",
      limite: 8,
    }),
  },
  {
    tipo: "estudio",
    nombre: "El estudio",
    descripcion: "Dirección, horario y contacto del estudio.",
    icono: "MapPin",
    conDatos: true,
    campos: [ANTETITULO, TITULO, TEXTO],
    crear: () => ({
      id: nuevoId("estudio"),
      tipo: "estudio",
      visible: true,
      antetitulo: "Dónde estamos",
      titulo: "Pásate por el estudio",
      texto: "",
    }),
  },
  {
    tipo: "preguntas",
    nombre: "Preguntas frecuentes",
    descripcion: "Preguntas y respuestas desplegables.",
    icono: "CircleHelp",
    conDatos: false,
    campos: [
      ANTETITULO,
      TITULO,
      {
        clave: "elementos",
        etiqueta: "Preguntas",
        tipo: "lista",
        elemento: "pregunta",
        max: 12,
        subcampos: [
          { clave: "pregunta", etiqueta: "Pregunta", tipo: "texto" },
          { clave: "respuesta", etiqueta: "Respuesta", tipo: "textoLargo" },
        ],
      },
    ],
    crear: () => ({
      id: nuevoId("preguntas"),
      tipo: "preguntas",
      visible: true,
      antetitulo: "Dudas",
      titulo: "Preguntas frecuentes",
      elementos: [
        { pregunta: "¿Hace falta cita previa?", respuesta: "Sí. Trabajamos con cita previa para dedicarte todo el tiempo que necesite la pieza." },
        { pregunta: "¿Cuánto tardáis en responder?", respuesta: "Te respondemos en menos de 48 horas con disponibilidad y presupuesto." },
        { pregunta: "¿Retocáis piezas de otros estudios?", respuesta: "Sí: recuperamos línea, saturamos color y cerramos contornos. El primer retoque de piezas propias es gratis." },
      ],
    }),
  },
  {
    tipo: "llamada",
    nombre: "Llamada a la acción",
    descripcion: "Una franja con un mensaje corto y un botón.",
    icono: "Megaphone",
    conDatos: false,
    campos: [TITULO, TEXTO, { clave: "boton", etiqueta: "Botón", tipo: "boton" }],
    crear: () => ({
      id: nuevoId("llamada"),
      tipo: "llamada",
      visible: true,
      titulo: "Cuéntanos tu idea",
      texto: "Hablamos de tu tatuaje sin compromiso.",
      boton: RESERVA,
    }),
  },
  {
    tipo: "reserva",
    nombre: "Reserva de cita",
    descripcion: "El formulario real de reserva de la web: cada envío llega al CRM como cita.",
    icono: "CalendarCheck",
    conDatos: true,
    campos: [ANTETITULO, TITULO, TEXTO],
    crear: () => ({
      id: "reserva",
      tipo: "reserva",
      visible: true,
      antetitulo: "Reserva",
      titulo: "Reserva tu cita",
      texto: "Cuéntanos qué tienes en mente. Te respondemos en menos de 48 horas.",
    }),
  },
];

export const infoSeccion = (tipo: TipoSeccion) => SECCIONES.find((s) => s.tipo === tipo)!;

/* ------------------------------------------------------------------
   SITIO POR DEFECTO
   ------------------------------------------------------------------ */

export function sitioPorDefecto(id: IdPlantilla = "lamina"): Sitio {
  const crear = (t: TipoSeccion) => infoSeccion(t).crear();
  return {
    version: 1,
    plantilla: id,
    tema: { ...plantilla(id).tema },
    marca: { nombre: "Tinta&Co", eslogan: "Flash de autor, piezas a medida", logo: null },
    menu: [],
    pie: {
      texto: "Estudio de tatuaje en Madrid. Cita previa, sin prisa.",
      email: "hola@tintaco.studio",
      telefono: "+34 600 123 456",
      instagram: "@tintaco.studio",
    },
    seo: {
      titulo: "Tinta&Co · Estudio de tatuaje en Madrid",
      descripcion:
        "Diseños flash de trazo limpio y proyectos personalizados. Trabajamos con cita previa y una sola sesión abierta a la vez.",
    },
    secciones: (
      ["portada", "servicios", "flash", "texto", "galeria", "ventajas", "estudio", "preguntas", "reserva"] as TipoSeccion[]
    ).map(crear),
  };
}

/* ------------------------------------------------------------------
   NORMALIZAR · lo que llega de la base de datos puede ser antiguo o estar roto
   ------------------------------------------------------------------ */

const esTexto = (v: unknown): v is string => typeof v === "string";
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
const txt = (v: unknown, def = "") => (esTexto(v) ? v : def);
const HEX = /^#[0-9a-f]{6}$/i;

function imagen(v: unknown): Imagen | null {
  const o = obj(v);
  return esTexto(o.url) && o.url ? { url: o.url, alt: txt(o.alt) } : null;
}

function boton(v: unknown): Boton | null {
  const o = obj(v);
  return esTexto(o.texto) && o.texto.trim() ? { texto: o.texto, destino: txt(o.destino, "#") } : null;
}

function de<T extends string>(v: unknown, validos: readonly T[], def: T): T {
  return validos.includes(v as T) ? (v as T) : def;
}

/** Rellena con los valores por defecto del tipo cualquier campo que falte o tenga un tipo incorrecto. */
function normalizarSeccion(v: unknown): Seccion | null {
  const o = obj(v);
  const info = SECCIONES.find((s) => s.tipo === o.tipo);
  if (!info) return null;
  const base = info.crear() as Record<string, unknown>;
  const r: Record<string, unknown> = { ...base, id: txt(o.id) || base.id, visible: o.visible !== false };
  for (const campo of info.campos) {
    const valor = o[campo.clave];
    switch (campo.tipo) {
      case "texto":
      case "textoLargo":
        r[campo.clave] = txt(valor, base[campo.clave] as string);
        break;
      case "imagen":
        r[campo.clave] = valor === null ? null : imagen(valor) ?? base[campo.clave];
        break;
      case "imagenes":
        r[campo.clave] = Array.isArray(valor) ? valor.map(imagen).filter(Boolean) : base[campo.clave];
        break;
      case "boton":
        r[campo.clave] = valor === null ? null : boton(valor) ?? base[campo.clave];
        break;
      case "opcion":
        r[campo.clave] = de(valor as string, campo.opciones.map((x) => x.valor), base[campo.clave] as string);
        break;
      case "numero": {
        const n = Number(valor);
        r[campo.clave] = Number.isFinite(n) ? Math.min(campo.max, Math.max(campo.min, Math.round(n))) : base[campo.clave];
        break;
      }
      case "lista":
        r[campo.clave] = Array.isArray(valor)
          ? valor.map((e) => Object.fromEntries(campo.subcampos.map((s) => [s.clave, txt(obj(e)[s.clave])])))
          : base[campo.clave];
        break;
    }
  }
  return r as Seccion;
}

/** Dos secciones con el mismo id romperían las anclas y el arrastre: la repetida recibe uno nuevo. */
function idsUnicos(secciones: Seccion[]) {
  const vistos = new Set<string>();
  return secciones.map((s) => {
    const id = vistos.has(s.id) ? nuevoId(s.tipo) : s.id;
    vistos.add(id);
    return id === s.id ? s : { ...s, id };
  });
}

export function normalizarSitio(v: unknown): Sitio {
  const o = obj(v);
  const id = de(o.plantilla as IdPlantilla, PLANTILLAS.map((p) => p.id), "lamina");
  const def = sitioPorDefecto(id);
  const t = obj(o.tema);
  const m = obj(o.marca);
  const p = obj(o.pie);
  const s = obj(o.seo);
  return {
    version: 1,
    plantilla: id,
    tema: {
      acento: esTexto(t.acento) && HEX.test(t.acento) ? t.acento.toUpperCase() : def.tema.acento,
      modo: de(t.modo as Tema["modo"], ["oscuro", "claro"], def.tema.modo),
      titulos: de(t.titulos as IdFuenteTitulos, FUENTES_TITULOS.map((f) => f.id), def.tema.titulos),
      texto: de(t.texto as IdFuenteTexto, FUENTES_TEXTO.map((f) => f.id), def.tema.texto),
      esquinas: de(t.esquinas as Esquinas, ESQUINAS.map((e) => e.id), def.tema.esquinas),
    },
    marca: { nombre: txt(m.nombre, def.marca.nombre), eslogan: txt(m.eslogan, def.marca.eslogan), logo: imagen(m.logo) },
    menu: Array.isArray(o.menu)
      ? o.menu.map((e) => ({ texto: txt(obj(e).texto), destino: txt(obj(e).destino, "#") })).filter((e) => e.texto.trim())
      : [],
    pie: {
      texto: txt(p.texto, def.pie.texto),
      email: txt(p.email),
      telefono: txt(p.telefono),
      instagram: txt(p.instagram),
    },
    seo: { titulo: txt(s.titulo, def.seo.titulo), descripcion: txt(s.descripcion, def.seo.descripcion) },
    secciones: Array.isArray(o.secciones) ? idsUnicos(o.secciones.map(normalizarSeccion).filter(Boolean) as Seccion[]) : def.secciones,
  };
}

/** Menú efectivo: el escrito a mano o, si no hay, uno con las secciones visibles que tienen título. */
export function menuDe(sitio: Sitio) {
  if (sitio.menu.length) return sitio.menu;
  return sitio.secciones
    .filter((s) => s.visible && s.tipo !== "portada" && s.tipo !== "llamada")
    .slice(0, 5)
    .map((s) => ({ texto: ("antetitulo" in s && s.antetitulo) || infoSeccion(s.tipo).nombre, destino: `#${s.id}` }));
}
