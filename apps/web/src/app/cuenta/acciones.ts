"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { crearClienteServidor } from "@tinta/compartido/supabase/servidor";
import type { ResultadoFormulario } from "@tinta/compartido/formularios";

async function origenPeticion() {
  const cabeceras = await headers();
  const host = cabeceras.get("x-forwarded-host") ?? cabeceras.get("host");
  const protocolo = cabeceras.get("x-forwarded-proto") ?? "http";
  return `${protocolo}://${host}`;
}

export async function iniciarSesion(
  _anterior: ResultadoFormulario,
  datos: FormData,
): Promise<ResultadoFormulario> {
  const email = String(datos.get("email") ?? "").trim();
  const password = String(datos.get("password") ?? "");

  if (!email || !password) {
    return { estado: "error", mensaje: "Introduce tu email y tu contraseña." };
  }

  const supabase = await crearClienteServidor();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { estado: "error", mensaje: "Email o contraseña incorrectos." };
  }

  redirect("/");
}

export async function crearCuenta(
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
    console.error("Error al crear la cuenta:", error);
    return {
      estado: "error",
      mensaje:
        error.code === "user_already_exists"
          ? "Ya existe una cuenta con ese email."
          : "No hemos podido crear la cuenta. Revisa los datos.",
    };
  }

  redirect("/");
}

export async function entrarConGoogle() {
  const supabase = await crearClienteServidor();
  const origen = await origenPeticion();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origen}/auth/callback?next=/` },
  });

  if (error || !data?.url) {
    console.error("Error al iniciar con Google:", error);
    redirect("/acceder?error=google");
  }

  // signInWithOAuth solo construye la URL; no comprueba que el proveedor esté
  // configurado. Preguntamos antes para no soltar un JSON de error en crudo.
  redirect(await comprobarProveedor(data.url));
}

async function comprobarProveedor(url: string) {
  try {
    const respuesta = await fetch(url, { redirect: "manual" });
    if (respuesta.status >= 300 && respuesta.status < 400) return url;

    const cuerpo = await respuesta.text();
    if (cuerpo.includes("provider is not enabled")) {
      return "/acceder?error=google_sin_configurar";
    }

    console.error("Respuesta inesperada de Supabase OAuth:", cuerpo.slice(0, 300));
    return "/acceder?error=google";
  } catch (fallo) {
    console.error("No se ha podido contactar con Supabase OAuth:", fallo);
    return "/acceder?error=google";
  }
}

export async function cerrarSesion() {
  const supabase = await crearClienteServidor();
  await supabase.auth.signOut();
  redirect("/");
}
