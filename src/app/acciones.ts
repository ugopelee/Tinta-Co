"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { crearClienteServidor } from "@/lib/supabase/server";
import { estudio } from "@/config/estudio";
import type { ResultadoFormulario } from "@/lib/formularios";

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

export async function reservarCita(
  _anterior: ResultadoFormulario,
  datos: FormData,
): Promise<ResultadoFormulario> {
  const texto = (clave: string) => {
    const valor = datos.get(clave);
    if (typeof valor !== "string") return null;
    const limpio = valor.trim();
    return limpio === "" ? null : limpio;
  };

  // Campo señuelo: invisible para una persona, irresistible para un bot.
  // Si viene relleno fingimos éxito y no escribimos nada.
  if (texto("apodo")) {
    return { estado: "ok", mensaje: estudio.reserva.exito };
  }

  const nombre = texto("nombre");
  const email = texto("email");

  if (!nombre || !email) {
    return { estado: "error", mensaje: "El nombre y el email son obligatorios." };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { estado: "error", mensaje: "Ese email no parece válido, revísalo." };
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
  const { error: errorCita } = await supabase.from("citas").insert({
    nombre,
    email,
    telefono,
    ip_hash: await huellaConexion(),
    diseno_id: texto("diseno_id"),
    estilo_interes: texto("estilo_interes"),
    zona_cuerpo: texto("zona_cuerpo"),
    fecha_deseada: texto("fecha_deseada"),
    mensaje: texto("mensaje"),
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

  return { estado: "ok", mensaje: estudio.reserva.exito };
}
