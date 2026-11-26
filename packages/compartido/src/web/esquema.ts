/**
 * Modelo de la web editable («el WordPress de Tinta&Co»).
 *
 * El contenido (secciones, textos, fotos) es independiente de la plantilla:
 * cambiar de plantilla no borra nada, solo cambia cómo se pinta. Igual que los
 * temas de WordPress.
 *
 * Se guarda como JSON en `web_sitio.datos` (ver supabase/migrations/20261126150000_editor_web.sql). Este archivo
 * no importa nada de servidor: lo usan el editor (cliente), la vista previa y la
 * web pública.
 */

export type IdPlantilla = "lamina" | "revista" | "cartel";

export type IdFuenteTitulos = "serif" | "grotesca" | "gotica" | "rotulo";
export type IdFuenteTexto = "inter" | "hanken" | "instrument" | "newsreader";
export type Esquinas = "rectas" | "suaves" | "redondas";
export type Modo = "oscuro" | "claro";

export type Tema = {
  /** Color de acento en hex (#RRGGBB). */
  acento: string;
  modo: Modo;
  titulos: IdFuenteTitulos;
  texto: IdFuenteTexto;
  esquinas: Esquinas;
};

export type Imagen = { url: string; alt: string };

/** `destino`: un ancla de la propia página («#reserva»), una ruta («/reservar») o una URL completa. */
export type Boton = { texto: string; destino: string };

type Base = {
  /** Id estable (para arrastrar, enfocar en la vista previa y como ancla). */
  id: string;
  visible: boolean;
};

export type SeccionPortada = Base & {
  tipo: "portada";
  antetitulo: string;
  titulo: string;
  subtitulo: string;
  boton: Boton | null;
  botonSecundario: Boton | null;
  imagen: Imagen | null;
};

export type SeccionTexto = Base & {
  tipo: "texto";
  antetitulo: string;
  titulo: string;
  cuerpo: string;
  imagen: Imagen | null;
  /** Lado de la imagen en escritorio. */
  lado: "izquierda" | "derecha";
  boton: Boton | null;
};

export type SeccionVentajas = Base & {
  tipo: "ventajas";
  antetitulo: string;
  titulo: string;
  elementos: { titulo: string; texto: string }[];
};

/** Cifras escritas a mano por el equipo. Nunca se inventan: si está vacía, no se pinta. */
export type SeccionCifras = Base & {
  tipo: "cifras";
  antetitulo: string;
  titulo: string;
  elementos: { valor: string; etiqueta: string }[];
};

export type SeccionGaleria = Base & {
  tipo: "galeria";
  antetitulo: string;
  titulo: string;
  imagenes: Imagen[];
};

/** Servicios y estudio salen de la config del estudio y los flash de la tabla `disenos`; aquí solo se editan los textos. */
export type SeccionServicios = Base & { tipo: "servicios"; antetitulo: string; titulo: string; texto: string };
export type SeccionEstudio = Base & { tipo: "estudio"; antetitulo: string; titulo: string; texto: string };
export type SeccionFlash = Base & {
  tipo: "flash";
  antetitulo: string;
  titulo: string;
  texto: string;
  /** Cuántos diseños flash mostrar (1-24). */
  limite: number;
};

export type SeccionPreguntas = Base & {
  tipo: "preguntas";
  antetitulo: string;
  titulo: string;
  elementos: { pregunta: string; respuesta: string }[];
};

export type SeccionLlamada = Base & {
  tipo: "llamada";
  titulo: string;
  texto: string;
  boton: Boton | null;
};

/** Formulario real de reserva de la web (el mismo de /reservar). */
export type SeccionReserva = Base & {
  tipo: "reserva";
  antetitulo: string;
  titulo: string;
  texto: string;
};

export type Seccion =
  | SeccionPortada
  | SeccionTexto
  | SeccionVentajas
  | SeccionCifras
  | SeccionGaleria
  | SeccionServicios
  | SeccionEstudio
  | SeccionFlash
  | SeccionPreguntas
  | SeccionLlamada
  | SeccionReserva;

export type TipoSeccion = Seccion["tipo"];
export type SeccionDe<T extends TipoSeccion> = Extract<Seccion, { tipo: T }>;

export type Sitio = {
  version: 1;
  plantilla: IdPlantilla;
  tema: Tema;
  marca: {
    nombre: string;
    eslogan: string;
    /** Si no hay logo, las plantillas componen el nombre con la fuente de titulares. */
    logo: Imagen | null;
  };
  /** Enlaces del menú superior. Si está vacío, las plantillas generan uno con las secciones visibles que tienen título. */
  menu: { texto: string; destino: string }[];
  pie: {
    texto: string;
    email: string;
    telefono: string;
    instagram: string;
  };
  seo: { titulo: string; descripcion: string };
  secciones: Seccion[];
};

/** Lo que la vista previa recibe del editor por postMessage. */
export type MensajeVista =
  | { tipo: "sitio"; sitio: Sitio }
  | { tipo: "enfocar"; id: string | null };

/** Lo que la vista previa responde al editor. */
export type MensajeEditor = { tipo: "lista" } | { tipo: "elegir"; id: string };
