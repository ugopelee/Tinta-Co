/**
 * Fuente única de verdad para la identidad del estudio: nombre, textos,
 * paleta y catálogo de servicios. La paleta se inyecta como variables CSS
 * desde el layout raíz, así que cambiar un color aquí lo cambia en toda la app.
 */

export const estudio = {
  nombre: "Tinta&Co",
  eslogan: "Flash de autor, piezas a medida",
  descripcion:
    "Estudio de tatuaje en Madrid especializado en diseños flash de trazo limpio y proyectos personalizados. Trabajamos con cita previa, sin prisa y con una sola sesión abierta a la vez.",

  contacto: {
    email: "hola@tintaco.studio",
    telefono: "+34 600 123 456",
    direccion: "Calle del Pez 14, bajo — Madrid",
    horario: "Martes a sábado · 11:00 a 20:00",
    /** Días de apertura (0 = domingo), los mismos que dice `horario`. */
    diasAbiertos: [2, 3, 4, 5, 6],
    instagram: "@tintaco.studio",
  },

  /** A quién escribe el equipo cuando el panel falla. No es el email público. */
  soporte: {
    email: "soporte@tintaco.studio",
    horario: "Lunes a viernes · 10:00 a 18:00",
    respuesta: "Respondemos en menos de un día laborable.",
  },

  paleta: {
    fondo: "#08080a",
    superficie: "#101014",
    superficieAlta: "#17171d",
    borde: "#26262e",
    texto: "#eceae4",
    tenue: "#8d8d98",
    acento: "#c2452f",
    acentoSuave: "#e0745e",
  },

  /**
   * Paletas del panel (CRM). No comparten nada con la web: un panel se usa
   * horas seguidas y pide lienzo gris claro, tarjetas blancas sin borde y
   * negro como color de acción. La lima es el único color de acento y va
   * siempre de relleno con texto oscuro encima (como texto no se lee).
   * `acento` queda para lo que quema: errores y avisos.
   */
  panelClaro: {
    fondo: "#efeeeb",
    superficie: "#ffffff",
    superficieAlta: "#f5f4f1",
    borde: "#e6e4df",
    bordeTarjeta: "transparent",
    texto: "#141414",
    tenue: "#6f6e69",
    acento: "#f0362b",
    acentoSuave: "#d42a20",
    verde: "#12b955",
    amarillo: "#ffa814",
    azul: "#2a76ff",
    lima: "#cdf25e",
    sobreLima: "#1c2905",
  },

  panelOscuro: {
    fondo: "#0f0f10",
    superficie: "#18181a",
    superficieAlta: "#212124",
    borde: "#2c2c30",
    bordeTarjeta: "#232326",
    texto: "#f2f1ee",
    tenue: "#95948f",
    acento: "#ff4a3d",
    acentoSuave: "#ff7a6e",
    verde: "#22d468",
    amarillo: "#ffb52e",
    azul: "#4a8dff",
    lima: "#cdf25e",
    sobreLima: "#1c2905",
  },

  hero: {
    titulo: "Tinta que aguanta el paso del tiempo",
    /** El titular se apila en tres líneas; la del medio va en tono apagado. */
    lineas: ["Tinta que", "aguanta", "el tiempo"],
    lineaApagada: 1,
    /** Palabras del titular que se componen en cursiva. */
    enfasis: ["paso", "del", "tiempo"],
    entradilla:
      "Diseños flash listos para tatuar y proyectos personalizados dibujados desde cero. Reserva tu cita y hablamos de tu idea sin compromiso.",
    cta: "Reservar cita",
    ctaSecundario: "Ver catálogo flash",
  },

  servicios: [
    {
      id: "flash",
      nombre: "Tatuaje flash",
      descripcion:
        "Diseños ya dibujados de nuestro catálogo, listos para tatuar el mismo día. Precio cerrado, sin sorpresas.",
      detalle: "Desde 85 €",
    },
    {
      id: "personalizado",
      nombre: "Diseño personalizado",
      descripcion:
        "Partimos de tu idea y la dibujamos desde cero. Incluye una sesión previa de bocetos y todos los ajustes que hagan falta.",
      detalle: "Presupuesto a medida",
    },
    {
      id: "piercing",
      nombre: "Piercing",
      descripcion:
        "Perforaciones con material de titanio implant grade y seguimiento de la cicatrización incluido.",
      detalle: "Desde 35 €",
    },
    {
      id: "retoque",
      nombre: "Retoque",
      descripcion:
        "Repasamos piezas nuestras o de otros estudios: recuperamos línea, saturamos color y cerramos contornos.",
      detalle: "Gratis el primero de piezas propias",
    },
  ],

  /**
   * Opciones del selector de estilo. `destacado` marca los que el estudio
   * trabaja a diario y se muestran primero en el formulario.
   */
  estilos: [
    {
      id: "black-and-grey",
      nombre: "Black & grey",
      descripcion: "Negro y gris con degradados suaves y mucho volumen.",
      destacado: true,
    },
    {
      id: "realismo",
      nombre: "Realismo",
      descripcion: "Retratos y objetos con textura y profundidad reales.",
      destacado: true,
    },
    {
      id: "religioso",
      nombre: "Religioso",
      descripcion: "Cruces, manos en oración, rayos de luz y nubes.",
      destacado: true,
    },
    {
      id: "lettering",
      nombre: "Lettering gótico",
      descripcion: "Frases y nombres en letra gótica o script.",
      destacado: true,
    },
    {
      id: "chicano",
      nombre: "Chicano",
      descripcion: "Relojes, rosas y sombras marcadas en negro y gris.",
      destacado: true,
    },
    {
      id: "fine-line",
      nombre: "Fine line",
      descripcion: "Línea fina y limpia, sin relleno.",
      destacado: true,
    },
    {
      id: "blackwork",
      nombre: "Blackwork",
      descripcion: "Negro sólido y alto contraste.",
      destacado: false,
    },
    {
      id: "neotradicional",
      nombre: "Neotradicional",
      descripcion: "Línea gruesa con paleta reducida.",
      destacado: false,
    },
    {
      id: "old-school",
      nombre: "Old school",
      descripcion: "Tradicional americano, contorno grueso.",
      destacado: false,
    },
    {
      id: "geometrico",
      nombre: "Geométrico",
      descripcion: "Formas, simetría y líneas rectas.",
      destacado: false,
    },
    {
      id: "ilustrativo",
      nombre: "Ilustrativo",
      descripcion: "Como un dibujo a tinta sobre papel.",
      destacado: false,
    },
    {
      id: "puntillismo",
      nombre: "Puntillismo",
      descripcion: "Sombreado a base de puntos.",
      destacado: false,
    },
    {
      id: "sin-decidir",
      nombre: "Aún no lo sé",
      descripcion: "Lo vemos juntos en la consulta.",
      destacado: true,
    },
  ],

  /** Cifras del contador animado de la landing. */
  cifras: [
    { valor: 12, sufijo: "", etiqueta: "Años tatuando" },
    { valor: 4200, sufijo: "+", etiqueta: "Piezas terminadas" },
    { valor: 3, sufijo: "", etiqueta: "Artistas residentes" },
    { valor: 48, sufijo: " h", etiqueta: "Respuesta media" },
  ],

  /** Palabras de la banda en movimiento entre secciones. */
  marquesina: [
    "Black & grey",
    "Realismo",
    "Lettering",
    "Cover up",
    "Religioso",
    "Chicano",
    "Fine line",
    "Retoque",
  ],

  zonasCuerpo: [
    "Antebrazo",
    "Brazo",
    "Hombro",
    "Espalda",
    "Costado",
    "Pierna",
    "Tobillo",
    "Mano o dedos",
    "Cuello",
    "Otra zona",
  ],

  reserva: {
    titulo: "Reserva tu cita",
    entradilla:
      "Cuéntanos qué tienes en mente. Te respondemos en menos de 48 horas con disponibilidad y presupuesto.",
    aviso:
      "Al enviar el formulario guardamos tus datos para gestionar la cita. No los compartimos con nadie.",
    exito: "Solicitud recibida. Te escribimos en menos de 48 horas.",
  },

  /** Textos del formulario cuando lo que se pide es tatuar en un evento. */
  eventos: {
    entradilla:
      "Bodas, fiestas, eventos de empresa o festivales: montamos una estación de tatuaje flash in situ con uno o varios artistas.",
    exito: "Propuesta recibida. Te escribimos en menos de 48 horas con presupuesto.",
  },

  /** Sección de la portada para lo que no es tatuarse: negocio y alianzas. */
  colabora: {
    entradilla:
      "¿Fabricas tinta o material, eres artista y quieres venir de invitado, tienes una marca o un medio? Si crees que podemos hacer algo juntos, escríbenos.",
    exito: "Mensaje recibido. Lo lee una persona del estudio y te responde en unos días.",
  },
} as const;

/**
 * Todo lo que entra por la web es una oportunidad. Hay dos familias:
 * - `encargo`: alguien quiere tatuarse (cita en el estudio o evento). Tiene
 *   ficha de cliente, fecha y cobro.
 * - `propuesta`: alguien quiere hacer negocio con el estudio (proveedor,
 *   colaboración…). No es cliente ni se cobra: se conversa.
 */
export const tiposOportunidad = [
  { id: "cita", nombre: "Cita", plural: "Citas", familia: "encargo", ejemplo: "" },
  { id: "evento", nombre: "Evento", plural: "Eventos", familia: "encargo", ejemplo: "" },
  {
    id: "proveedor",
    nombre: "Proveedor",
    plural: "Proveedores",
    familia: "propuesta",
    ejemplo: "Tinta, agujas, higiene, mobiliario…",
  },
  {
    id: "colaboracion",
    nombre: "Colaboración",
    plural: "Colaboraciones",
    familia: "propuesta",
    ejemplo: "Artista invitado, marca, colección conjunta…",
  },
  {
    id: "otro",
    nombre: "Otra propuesta",
    plural: "Otras propuestas",
    familia: "propuesta",
    ejemplo: "Prensa, rodajes, patrocinios o lo que se te ocurra.",
  },
] as const;

export type FamiliaOportunidad = (typeof tiposOportunidad)[number]["familia"];

export const tiposPropuesta = tiposOportunidad.filter(
  (tipo) => tipo.familia === "propuesta",
);

/** Para filtrar en las consultas lo que tiene cliente, fecha y cobro. */
export const tiposEncargo = tiposOportunidad
  .filter((tipo) => tipo.familia === "encargo")
  .map((tipo) => tipo.id);

export const esPropuesta = (tipo: string) =>
  tiposPropuesta.some((opcion) => opcion.id === tipo);

export type TipoOportunidad = (typeof tiposOportunidad)[number]["id"];

export const tiposEvento = [
  { id: "boda", nombre: "Boda" },
  { id: "fiesta", nombre: "Fiesta privada" },
  { id: "empresa", nombre: "Evento de empresa" },
  { id: "festival", nombre: "Festival o feria" },
  { id: "otro", nombre: "Otro" },
] as const;

export type TipoEvento = (typeof tiposEvento)[number]["id"];

/**
 * Estados del tablero, en orden de flujo. Colores saturados (ámbar, azul,
 * verde, rojo): van de relleno o de aro, nunca como color de texto, así que
 * pueden ir vivos sin perder lectura. Separables también con daltonismo
 * porque varían de tono y de luminosidad a la vez.
 */
export const estadosCita = [
  { id: "solicitada", nombre: "Solicitada", color: "#ffa814" },
  { id: "confirmada", nombre: "Confirmada", color: "#2a76ff" },
  { id: "realizada", nombre: "Realizada", color: "#12b955" },
  { id: "cancelada", nombre: "Cancelada", color: "#f0362b" },
] as const;

export type EstadoCita = (typeof estadosCita)[number]["id"];

/**
 * Una propuesta recorre los mismos estados de la tabla, pero «realizada» no
 * significa nada para un proveedor. Mismo id y color, otras palabras.
 */
export const nombresEstadoPropuesta: Record<EstadoCita, string> = {
  solicitada: "Nueva",
  confirmada: "En conversación",
  realizada: "Acordada",
  cancelada: "Descartada",
};

/** Tipos de entrada del historial de un cliente. */
export const tiposActividad = [
  { id: "tatuaje", nombre: "Tatuaje realizado" },
  { id: "retoque", nombre: "Retoque" },
  { id: "piercing", nombre: "Piercing" },
  { id: "consulta", nombre: "Consulta" },
  { id: "nota", nombre: "Nota interna" },
] as const;

export type TipoActividad = (typeof tiposActividad)[number]["id"];
