import { equipo } from "@tinta/compartido/estudio";
import type { Fichaje, SolicitudVacaciones } from "@tinta/compartido/tipos";

/** Usuario y contraseña recién creados: se enseñan una sola vez. */
export type Credenciales = { usuario: string; clave: string };

export type ResultadoAlta = {
  estado: "inicial" | "ok" | "error";
  mensaje: string;
  empleadoId?: string;
  credenciales?: Credenciales;
};

// Vive fuera del archivo "use server", que solo puede exportar funciones.
export const altaInicial: ResultadoAlta = { estado: "inicial", mensaje: "" };

/** «AAAA-MM-DD» de hoy en Madrid: el día del estudio, no el del servidor. */
export const hoyMadrid = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" }).format(new Date());

export const fechaCorta = (valor: string) =>
  new Date(`${valor.slice(0, 10)}T12:00:00Z`).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

export const hora = (valor: string) =>
  new Date(valor).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Madrid",
  });

export const diaDe = (valor: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" }).format(new Date(valor));

/** Minutos de un fichaje; si sigue abierto, hasta ahora. */
export function minutos(fichaje: Fichaje, ahora = Date.now()) {
  const fin = fichaje.salida ? new Date(fichaje.salida).getTime() : ahora;
  return Math.max(0, Math.round((fin - new Date(fichaje.entrada).getTime()) / 60000));
}

export const duracion = (total: number) => {
  const horas = Math.floor(total / 60);
  const resto = total % 60;
  return horas === 0 ? `${resto} min` : `${horas} h ${String(resto).padStart(2, "0")} min`;
};

/** Lunes de la semana de una fecha «AAAA-MM-DD». */
export function lunesDe(dia: string) {
  const fecha = new Date(`${dia}T12:00:00Z`);
  const desplazamiento = (fecha.getUTCDay() + 6) % 7;
  fecha.setUTCDate(fecha.getUTCDate() - desplazamiento);
  return fecha.toISOString().slice(0, 10);
}

/**
 * Días laborables (lunes a viernes) entre dos fechas incluidas. Es lo que
 * descuenta una solicitud de vacaciones: un fin de semana no gasta días.
 */
export function diasLaborables(desde: string, hasta: string) {
  let cuenta = 0;
  const fecha = new Date(`${desde}T12:00:00Z`);
  const fin = new Date(`${hasta}T12:00:00Z`);
  while (fecha <= fin) {
    const dia = fecha.getUTCDay();
    if (dia !== 0 && dia !== 6) cuenta++;
    fecha.setUTCDate(fecha.getUTCDate() + 1);
  }
  return cuenta;
}

/** Días aprobados o pendientes del año en curso y lo que queda. */
export function saldoVacaciones(solicitudes: SolicitudVacaciones[], anio = Number(hoyMadrid().slice(0, 4))) {
  const delAnio = solicitudes.filter((s) => s.desde.startsWith(String(anio)));
  const suma = (estado: SolicitudVacaciones["estado"]) =>
    delAnio
      .filter((s) => s.estado === estado)
      .reduce((total, s) => total + diasLaborables(s.desde, s.hasta), 0);

  const usados = suma("aprobada");
  const pendientes = suma("pendiente");
  return {
    total: equipo.diasVacaciones,
    usados,
    pendientes,
    quedan: equipo.diasVacaciones - usados,
  };
}

/** «Septiembre de 2026»: solo la primera letra en mayúscula, no el «de». */
export const nombrePeriodo = (periodo: string) => {
  const texto = new Date(`${periodo}-01T12:00:00Z`).toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
};

export const iniciales = (nombre: string) =>
  nombre
    .split(" ")
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? "")
    .join("") || "·";
