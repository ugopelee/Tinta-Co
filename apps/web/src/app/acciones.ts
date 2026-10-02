"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { crearClienteServidor } from "@tinta/compartido/supabase/servidor";
import { esPropuesta, estudio, tiposEvento } from "@tinta/compartido/estudio";
import type { ResultadoFormulario } from "@tinta/compartido/formularios";

/** Código que lanza el trigger de la base de datos al cortar por exceso. */
const CODIGO_LIMITE = "TC429";

/**
 * Huella anónima de la conexión. La calcula el servidor a partir de las
 * cabeceras, así que el navegador no puede falsearla, y se guarda hasheada
 * con un secreto para no almacenar IPs en claro.
 */
async function huellaConexion() {
  const cabeceras = await headers();
  const ip =
    cabeceras.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    cabeceras.get("x-real-ip") ||
    "desconocida";

  return createHash("sha256")
    .update(`${ip}:${process.env.SECRETO_HUELLA ?? "tinta-co"}`)
    .digest("hex");
}

/** Lee un campo de texto del formulario, recortado; vacío cuenta como null. */
function lector(datos: FormData) {
  return (clave: string) => {
    const valor = datos.get(clave);
    if (typeof valor !== "string") return null;
    const limpio = valor.trim();
    return limpio === "" ? null : limpio;
  };
}

async function reservarCita(
  _anterior: ResultadoFormulario,
  datos: FormData,
): Promise<ResultadoFormulario> {
  const texto = lector(datos);

  const esEvento = texto("tipo") === "evento";
  const exito = esEvento ? estudio.eventos.exito : estudio.reserva.exito;

  // Campo señuelo: invisible para una persona, irresistible para un bot.
  // Si viene relleno fingimos éxito y no escribimos nada.
  if (texto("apodo")) {
    return { estado: "ok", mensaje: exito };
  }

  const nombre = texto("nombre");
  const email = texto("email");

  if (!nombre || !email) {
    return { estado: "error", mensaje: "El nombre y el email son obligatorios." };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { estado: "error", mensaje: "Ese email no parece válido, revísalo." };
  }

  const tipoEvento = texto("tipo_evento");
  if (esEvento && !tiposEvento.some((opcion) => opcion.id === tipoEvento)) {
    return { estado: "error", mensaje: "Elige qué tipo de evento es." };
  }

  const asistentes = Number(texto("asistentes"));
  if (esEvento && texto("asistentes") && !(asistentes >= 1 && asistentes <= 5000)) {
    return { estado: "error", mensaje: "El número de invitados no es válido." };
  }

  const supabase = await crearClienteServidor();
  const telefono = texto("telefono");

  // Ojo: ningún insert lleva .select(). El rol anónimo tiene permiso de
  // INSERT sobre clientes y citas, pero no de SELECT, así que pedir la fila
  // de vuelta haría fallar la petición entera.
  const { error: errorCliente } = await supabase
    .from("clientes")
    .insert({ nombre, email, telefono });

  // 23505 = el email ya está registrado. Es el caso normal de un cliente que
  // repite, así que seguimos adelante sin tocar su ficha. No usamos upsert
  // porque ON CONFLICT exige además política de UPDATE para el rol anónimo.
  if (errorCliente && errorCliente.code !== "23505") {
    console.error("Error al registrar el cliente:", errorCliente);
    return {
      estado: "error",
      mensaje: "No hemos podido guardar tus datos. Inténtalo de nuevo en un momento.",
    };
  }

  // Un trigger en la base de datos rellena cliente_id buscando por email,
  // y otro corta si se superan las solicitudes permitidas por hora.
  // Los campos que no son de su tipo se descartan aunque lleguen: un evento
  // no tiene zona del cuerpo y una cita no tiene lugar.
  const { error: errorCita } = await supabase.from("citas").insert({
    tipo: esEvento ? "evento" : "cita",
    nombre,
    email,
    telefono,
    ip_hash: await huellaConexion(),
    fecha_deseada: texto("fecha_deseada"),
    mensaje: texto("mensaje"),
    ...(esEvento
      ? {
          tipo_evento: tipoEvento,
          lugar: texto("lugar"),
          asistentes: texto("asistentes") ? Math.round(asistentes) : null,
        }
      : {
          diseno_id: texto("diseno_id"),
          estilo_interes: texto("estilo_interes"),
          zona_cuerpo: texto("zona_cuerpo"),
        }),
  });

  if (errorCita?.code === CODIGO_LIMITE) {
    return {
      estado: "error",
      mensaje:
        "Ya hemos recibido varias solicitudes tuyas en la última hora. Espera un rato o escríbenos directamente por email.",
    };
  }

  if (errorCita) {
    console.error("Error al crear la cita:", errorCita);
    return {
      estado: "error",
      mensaje: "No hemos podido registrar la solicitud. Inténtalo de nuevo en un momento.",
    };
  }

  return { estado: "ok", mensaje: exito };
}

/**
 * Propuestas de negocio: proveedores, colaboraciones y lo demás. Caen en el
 * mismo tablero de oportunidades, pero no crean ficha de cliente: quien vende
 * tinta al estudio no es alguien que se vaya a tatuar.
 */
async function proponerColaboracion(
  _anterior: ResultadoFormulario,
  datos: FormData,
): Promise<ResultadoFormulario> {
  const texto = lector(datos);
  const exito = estudio.colabora.exito;

  if (texto("apodo")) {
    return { estado: "ok", mensaje: exito };
  }

  const tipo = texto("tipo");
  const nombre = texto("nombre");
  const email = texto("email");
  const mensaje = texto("mensaje");

  if (!tipo || !esPropuesta(tipo)) {
    return { estado: "error", mensaje: "Elige de qué va tu propuesta." };
  }

  if (!nombre || !email || !mensaje) {
    return {
      estado: "error",
      mensaje: "El nombre, el email y el mensaje son obligatorios.",
    };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { estado: "error", mensaje: "Ese email no parece válido, revísalo." };
  }

  const supabase = await crearClienteServidor();

  const { error } = await supabase.from("citas").insert({
    tipo,
    nombre,
    email,
    empresa: texto("empresa")?.slice(0, 120) ?? null,
    telefono: texto("telefono"),
    mensaje: mensaje.slice(0, 2000),
    ip_hash: await huellaConexion(),
  });

  if (error?.code === CODIGO_LIMITE) {
    return {
      estado: "error",
      mensaje:
        "Ya hemos recibido varios mensajes tuyos en la última hora. Espera un rato o escríbenos directamente por email.",
    };
  }

  if (error) {
    console.error("Error al registrar la propuesta:", error);
    return {
      estado: "error",
      mensaje: "No hemos podido enviar tu mensaje. Inténtalo de nuevo en un momento.",
    };
  }

  return { estado: "ok", mensaje: exito };
}

/**
 * Único punto de entrada del formulario de la web: tatuarse (cita o evento)
 * va por reservarCita, que crea ficha de cliente; todo lo demás es una
 * propuesta de negocio.
 */
export async function enviarSolicitud(
  anterior: ResultadoFormulario,
  datos: FormData,
): Promise<ResultadoFormulario> {
  const tipo = datos.get("tipo");
  return tipo === "cita" || tipo === "evento"
    ? reservarCita(anterior, datos)
    : proponerColaboracion(anterior, datos);
}
