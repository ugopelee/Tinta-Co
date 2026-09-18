"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { crearClienteServidor } from "@tinta/compartido/supabase/servidor";
import { estadosCita, tiposActividad, type EstadoCita } from "@tinta/compartido/estudio";
import type { ResultadoFormulario } from "@tinta/compartido/formularios";

/**
 * El proxy no basta para proteger las server actions: se ejecutan como POST
 * sobre la ruta donde viven y un cambio de matcher las dejaría al descubierto.
 * Por eso cada acción comprueba la sesión por su cuenta.
 */
async function conSesion() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;
  return supabase;
}

export async function iniciarSesion(
  _anterior: ResultadoFormulario,
  datos: FormData,
): Promise<ResultadoFormulario> {
  const email = String(datos.get("email") ?? "").trim();
  const password = String(datos.get("password") ?? "");
  const volver = String(datos.get("volver") ?? "/");

  if (!email || !password) {
    return { estado: "error", mensaje: "Introduce tu email y tu contraseña." };
  }

  const supabase = await crearClienteServidor();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { estado: "error", mensaje: "Email o contraseña incorrectos." };
  }

  // Solo permitimos volver a rutas internas del CRM.
  redirect(volver.startsWith("/") ? volver : "/");
}

export async function registrarse(
  _anterior: ResultadoFormulario,
  datos: FormData,
): Promise<ResultadoFormulario> {
  const nombre = String(datos.get("nombre") ?? "").trim();
  const email = String(datos.get("email") ?? "").trim();
  const password = String(datos.get("password") ?? "");
  const repetir = String(datos.get("repetir") ?? "");

  if (!nombre || !email || !password) {
    return { estado: "error", mensaje: "Rellena todos los campos." };
  }

  if (password.length < 8) {
    return {
      estado: "error",
      mensaje: "La contraseña debe tener al menos 8 caracteres.",
    };
  }

  if (password !== repetir) {
    return { estado: "error", mensaje: "Las dos contraseñas no coinciden." };
  }

  const supabase = await crearClienteServidor();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { nombre } },
  });

  if (error) {
    console.error("Error al registrar la cuenta:", error);
    return {
      estado: "error",
      mensaje:
        error.code === "user_already_exists"
          ? "Ya existe una cuenta con ese email."
          : "No hemos podido crear la cuenta. Revisa los datos e inténtalo de nuevo.",
    };
  }

  // La cuenta nace sin acceso: el layout del CRM mostrará el aviso de
  // pendiente de aprobación.
  redirect("/");
}

export async function cambiarRolCuenta(
  id: string,
  rol: "propietario" | "artista",
) {
  const supabase = await conSesion();
  if (!supabase) return { ok: false as const, mensaje: "Sesión caducada." };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Evita que un propietario se quite el acceso a sí mismo y se quede fuera.
  if (user?.id === id && rol !== "propietario") {
    return {
      ok: false as const,
      mensaje: "No puedes quitarte a ti mismo el rol de propietario.",
    };
  }

  // La política RLS "perfiles_gestionar" ya exige ser propietario; esto solo
  // convierte el rechazo en un mensaje legible.
  const { error } = await supabase.from("perfiles").update({ rol }).eq("id", id);

  if (error) {
    console.error("Error al cambiar el rol:", error);
    return {
      ok: false as const,
      mensaje: "No se ha podido cambiar el rol. ¿Eres propietario?",
    };
  }

  revalidatePath("/cuentas");
  return { ok: true as const, mensaje: "" };
}

/**
 * Arranca el flujo de Google. Solo sirve para entrar: si el correo no tiene
 * cuenta, Supabase la crea igualmente, pero nace sin permisos como cualquier
 * otro registro, así que no es un atajo para conseguir acceso.
 */
export async function entrarConGoogle() {
  const supabase = await crearClienteServidor();
  const cabeceras = await headers();

  const host = cabeceras.get("x-forwarded-host") ?? cabeceras.get("host");
  const protocolo = cabeceras.get("x-forwarded-proto") ?? "http";
  const origen = `${protocolo}://${host}`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origen}/auth/callback?next=/` },
  });

  if (error || !data?.url) {
    console.error("Error al iniciar con Google:", error);
    redirect("/login?error=google");
  }

  // signInWithOAuth solo construye la URL; no comprueba que el proveedor esté
  // configurado. Sin esto, al redirigir, Supabase devuelve un JSON de error en
  // crudo al navegador. Preguntamos primero y damos un mensaje entendible.
  const destino = await comprobarProveedor(data.url);
  redirect(destino);
}

async function comprobarProveedor(url: string) {
  try {
    const respuesta = await fetch(url, { redirect: "manual" });

    // Un proveedor activo responde con una redirección a Google.
    if (respuesta.status >= 300 && respuesta.status < 400) return url;

    const cuerpo = await respuesta.text();
    if (cuerpo.includes("provider is not enabled")) {
      return "/login?error=google_sin_configurar";
    }

    console.error("Respuesta inesperada de Supabase OAuth:", cuerpo.slice(0, 300));
    return "/login?error=google";
  } catch (fallo) {
    console.error("No se ha podido contactar con Supabase OAuth:", fallo);
    return "/login?error=google";
  }
}

export async function cerrarSesion() {
  const supabase = await crearClienteServidor();
  await supabase.auth.signOut();
  redirect("/login");
}

/** Cierra sesión desde la web pública, volviendo a donde diga el formulario. */
export async function salirDeLaCuenta(datos: FormData) {
  const destino = String(datos.get("destino") ?? "/");
  const supabase = await crearClienteServidor();
  await supabase.auth.signOut();
  redirect(destino.startsWith("/") ? destino : "/");
}

export async function moverCita(id: string, estado: EstadoCita, posicion: number) {
  const supabase = await conSesion();
  if (!supabase) return { ok: false as const, mensaje: "Sesión caducada." };

  if (!estadosCita.some((columna) => columna.id === estado)) {
    return { ok: false as const, mensaje: "Estado no válido." };
  }

  const { error } = await supabase
    .from("citas")
    .update({ estado, posicion })
    .eq("id", id);

  if (error) {
    console.error("Error al mover la cita:", error);
    return { ok: false as const, mensaje: "No se ha podido mover la cita." };
  }

  revalidatePath("/");
  return { ok: true as const, mensaje: "" };
}

export async function anadirActividad(
  _anterior: ResultadoFormulario,
  datos: FormData,
): Promise<ResultadoFormulario> {
  const supabase = await conSesion();
  if (!supabase) return { estado: "error", mensaje: "Tu sesión ha caducado." };

  const clienteId = String(datos.get("cliente_id") ?? "");
  const titulo = String(datos.get("titulo") ?? "").trim();
  const tipo = String(datos.get("tipo") ?? "nota");
  const descripcion = String(datos.get("descripcion") ?? "").trim();
  const fecha = String(datos.get("fecha") ?? "").trim();

  if (!clienteId || !titulo) {
    return { estado: "error", mensaje: "El título es obligatorio." };
  }

  if (!tiposActividad.some((opcion) => opcion.id === tipo)) {
    return { estado: "error", mensaje: "Tipo de actividad no válido." };
  }

  const { error } = await supabase.from("actividades").insert({
    cliente_id: clienteId,
    titulo,
    tipo,
    descripcion: descripcion || null,
    fecha: fecha || new Date().toISOString().slice(0, 10),
  });

  if (error) {
    console.error("Error al añadir la actividad:", error);
    return { estado: "error", mensaje: "No se ha podido guardar la actividad." };
  }

  revalidatePath(`/clientes/${clienteId}`);
  return { estado: "ok", mensaje: "Actividad añadida." };
}
