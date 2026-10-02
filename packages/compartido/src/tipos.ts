import type {
  EstadoCita,
  EstadoEmpleado,
  EstadoVacaciones,
  TipoActividad,
  TipoEvento,
  TipoOportunidad,
} from "./config/estudio";

export type Perfil = {
  id: string;
  email: string;
  nombre: string | null;
  rol: "propietario" | "artista" | "empleado";
  created_at: string;
};

export type Diseno = {
  id: string;
  nombre: string;
  descripcion: string | null;
  imagen_url: string | null;
  precio: number | null;
  estilo: string | null;
  tamano_aprox: string | null;
  disponible: boolean;
  orden: number;
  created_at: string;
};

export type Cliente = {
  id: string;
  nombre: string;
  email: string;
  telefono: string | null;
  notas: string | null;
  created_at: string;
};

/**
 * Una fila de `citas`: cita de estudio, encargo para un evento o propuesta de
 * negocio (proveedor, colaboración…). Ver `tiposOportunidad`.
 */
export type Cita = {
  id: string;
  tipo: TipoOportunidad;
  empresa: string | null;
  tipo_evento: TipoEvento | null;
  lugar: string | null;
  asistentes: number | null;
  cliente_id: string | null;
  nombre: string;
  email: string;
  telefono: string | null;
  diseno_id: string | null;
  estilo_interes: string | null;
  zona_cuerpo: string | null;
  fecha_deseada: string | null;
  mensaje: string | null;
  estado: EstadoCita;
  posicion: number;
  importe: number | null;
  pagado: boolean;
  fecha_cobro: string | null;
  metodo_pago: MetodoPago | null;
  created_at: string;
  updated_at: string;
};

export const metodosPago = [
  { id: "efectivo", nombre: "Efectivo" },
  { id: "tarjeta", nombre: "Tarjeta" },
  { id: "transferencia", nombre: "Transferencia" },
  { id: "bizum", nombre: "Bizum" },
] as const;

export type MetodoPago = (typeof metodosPago)[number]["id"];

export type Actividad = {
  id: string;
  cliente_id: string;
  cita_id: string | null;
  tipo: TipoActividad;
  titulo: string;
  descripcion: string | null;
  fecha: string;
  created_at: string;
};

/**
 * Consentimiento informado y ficha de salud. Uno por firma: el más reciente
 * de cada cliente es el que cuenta. Ver `estadoConsentimiento` en el CRM.
 */
export type Consentimiento = {
  id: string;
  cliente_id: string;
  cita_id: string | null;
  fecha_firma: string;
  firmado: boolean;
  alergias: string | null;
  medicacion: string | null;
  condiciones: string | null;
  embarazo: boolean;
  menor: boolean;
  tutor: string | null;
  notas: string | null;
  created_at: string;
};

/** Ficha de una persona del equipo. `perfil_id` es su cuenta del CRM. */
export type Empleado = {
  id: string;
  perfil_id: string | null;
  nombre: string;
  email: string;
  telefono: string | null;
  puesto: string;
  departamento: string | null;
  foto_url: string | null;
  fecha_alta: string;
  estado: EstadoEmpleado;
  created_at: string;
};

export type TareaIncorporacion = {
  id: string;
  empleado_id: string;
  titulo: string;
  descripcion: string | null;
  orden: number;
  de_empleado: boolean;
  hecha: boolean;
  hecha_at: string | null;
  created_at: string;
};

/** Una entrada y su salida. Sin salida, la persona sigue dentro. */
export type Fichaje = {
  id: string;
  empleado_id: string;
  entrada: string;
  salida: string | null;
};

export type SolicitudVacaciones = {
  id: string;
  empleado_id: string;
  desde: string;
  hasta: string;
  motivo: string | null;
  estado: EstadoVacaciones;
  respuesta: string | null;
  respondida_at: string | null;
  created_at: string;
};

export type Evaluacion = {
  id: string;
  empleado_id: string;
  trimestre: string;
  nota: number;
  comentario: string | null;
  created_at: string;
  updated_at: string;
};

export type Nomina = {
  id: string;
  empleado_id: string;
  periodo: string;
  archivo: string;
  firma: string | null;
  firmada_at: string | null;
  created_at: string;
};
