import type { Consentimiento } from "@tinta/compartido/tipos";

/**
 * Regla del estudio: la ficha de salud se renueva cada año. La salud cambia
 * (medicación, embarazo, alergias nuevas) y una firma vieja no protege a
 * nadie. A falta de 30 días se avisa para pedirla en la próxima visita.
 */
export const VIGENCIA_MESES = 12;
const AVISO_DIAS = 30;

export type EstadoConsentimiento = "vigente" | "caduca" | "caducado" | "sin-firmar" | "sin-ficha";

export const nombresEstado: Record<EstadoConsentimiento, string> = {
  vigente: "Vigente",
  caduca: "Caduca pronto",
  caducado: "Caducado",
  "sin-firmar": "Sin firmar",
  "sin-ficha": "Sin ficha",
};

/** Colores de los tokens del panel: verde bien, ámbar aviso, rojo falta. */
export const colorEstado: Record<EstadoConsentimiento, string> = {
  vigente: "var(--verde)",
  caduca: "var(--amarillo)",
  caducado: "var(--acento)",
  "sin-firmar": "var(--acento)",
  "sin-ficha": "var(--acento)",
};

export function caducidad(fechaFirma: string) {
  const fecha = new Date(`${fechaFirma}T12:00:00Z`);
  fecha.setUTCMonth(fecha.getUTCMonth() + VIGENCIA_MESES);
  return fecha.toISOString().slice(0, 10);
}

/** Estado del último consentimiento de un cliente en una fecha dada. */
export function estadoConsentimiento(
  ultimo: Consentimiento | undefined,
  hoy = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" }).format(new Date()),
): EstadoConsentimiento {
  if (!ultimo) return "sin-ficha";
  if (!ultimo.firmado) return "sin-firmar";

  const vence = caducidad(ultimo.fecha_firma);
  if (vence <= hoy) return "caducado";

  const margen = new Date(`${hoy}T12:00:00Z`);
  margen.setUTCDate(margen.getUTCDate() + AVISO_DIAS);
  return vence <= margen.toISOString().slice(0, 10) ? "caduca" : "vigente";
}

/** El más reciente de cada cliente, a partir de una lista cualquiera. */
export function ultimosPorCliente(consentimientos: Consentimiento[]) {
  const mapa = new Map<string, Consentimiento>();
  for (const consentimiento of consentimientos) {
    const actual = mapa.get(consentimiento.cliente_id);
    if (
      !actual ||
      consentimiento.fecha_firma > actual.fecha_firma ||
      (consentimiento.fecha_firma === actual.fecha_firma && consentimiento.created_at > actual.created_at)
    ) {
      mapa.set(consentimiento.cliente_id, consentimiento);
    }
  }
  return mapa;
}

export const estaAlDia = (estado: EstadoConsentimiento) => estado === "vigente" || estado === "caduca";
