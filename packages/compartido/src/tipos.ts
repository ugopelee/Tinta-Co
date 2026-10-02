import type {
  EstadoCita,
  TipoActividad,
  TipoEvento,
  TipoOportunidad,
} from "./config/estudio";

export type Perfil = {
  id: string;
  email: string;
  nombre: string | null;
  rol: "propietario" | "artista";
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
