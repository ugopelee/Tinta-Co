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
    instagram: "@tintaco.studio",
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
} as const;

/** Estados del tablero Kanban del CRM, en orden de flujo. */
export const estadosCita = [
  { id: "solicitada", nombre: "Solicitada", color: "#8d8d98" },
  { id: "confirmada", nombre: "Confirmada", color: "#c2452f" },
  { id: "realizada", nombre: "Realizada", color: "#4c9a6a" },
  { id: "cancelada", nombre: "Cancelada", color: "#5a5a63" },
] as const;

export type EstadoCita = (typeof estadosCita)[number]["id"];

/** Tipos de entrada del historial de un cliente. */
export const tiposActividad = [
  { id: "tatuaje", nombre: "Tatuaje realizado" },
  { id: "retoque", nombre: "Retoque" },
  { id: "piercing", nombre: "Piercing" },
  { id: "consulta", nombre: "Consulta" },
  { id: "nota", nombre: "Nota interna" },
] as const;

export type TipoActividad = (typeof tiposActividad)[number]["id"];
