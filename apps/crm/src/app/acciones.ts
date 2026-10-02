"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { crearClienteServidor } from "@tinta/compartido/supabase/servidor";
import { estadosCita, tiposActividad, type EstadoCita } from "@tinta/compartido/estudio";
import { metodosPago, type MetodoPago } from "@tinta/compartido/tipos";
import type { ResultadoFormulario } from "@tinta/compartido/formularios";
import { googleDisponible } from "@/lib/google";

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

  // Solo rutas internas. Ojo con "//otro-dominio.com": empieza por "/" pero
  // el navegador lo trata como absoluto, y sería un redirect abierto.
  const esInterna = volver.startsWith("/") && !volver.startsWith("//");
  redirect(esInterna ? volver : "/");
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
  // El botón solo se pinta si el proveedor está activo, pero lo volvemos a
  // comprobar: entre pintar la pantalla y pulsar pueden pasar horas.
  if (!(await googleDisponible())) {
    redirect("/login?error=google");
  }

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

  redirect(data.url);
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
  revalidatePath("/oportunidades");
  return { ok: true as const, mensaje: "" };
}

export async function guardarCobro(
  id: string,
  cambios: {
    importe: number | null;
    pagado: boolean;
    metodo: MetodoPago | null;
  },
) {
  const supabase = await conSesion();
  if (!supabase) return { ok: false as const, mensaje: "Sesión caducada." };

  if (cambios.importe !== null && (cambios.importe < 0 || cambios.importe > 100000)) {
    return { ok: false as const, mensaje: "El importe no es válido." };
  }

  if (cambios.metodo && !metodosPago.some((m) => m.id === cambios.metodo)) {
    return { ok: false as const, mensaje: "Método de pago no válido." };
  }

  const { error } = await supabase
    .from("citas")
    .update({
      importe: cambios.importe,
      pagado: cambios.pagado,
      // La fecha de cobro la pone el servidor, no el navegador.
      fecha_cobro: cambios.pagado ? new Date().toISOString().slice(0, 10) : null,
      metodo_pago: cambios.pagado ? cambios.metodo : null,
    })
    .eq("id", id);

  if (error) {
    console.error("Error al guardar el cobro:", error);
    return { ok: false as const, mensaje: "No se ha podido guardar el cobro." };
  }

  revalidatePath("/facturacion");
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

/* --- Catálogo flash ---------------------------------------------------- */

/**
 * Crea o edita un diseño. RLS (`es_propietario()`) ya impide que alguien sin
 * rol toque la tabla; aquí se valida la forma de los datos.
 */
export async function guardarDiseno(
  _anterior: ResultadoFormulario,
  datos: FormData,
): Promise<ResultadoFormulario> {
  const supabase = await conSesion();
  if (!supabase) return { estado: "error", mensaje: "Tu sesión ha caducado." };

  const id = String(datos.get("id") ?? "");
  const nombre = String(datos.get("nombre") ?? "").trim();
  const textoPrecio = String(datos.get("precio") ?? "").trim().replace(",", ".");
  const precio = textoPrecio ? Number(textoPrecio) : null;
  const imagen = String(datos.get("imagen_url") ?? "").trim();

  if (!nombre) return { estado: "error", mensaje: "El nombre es obligatorio." };
  if (precio !== null && (!Number.isFinite(precio) || precio < 0 || precio > 100000)) {
    return { estado: "error", mensaje: "El precio no es válido." };
  }
  // Solo rutas de la web o direcciones https: nada de `javascript:` en un src.
  if (imagen && !imagen.startsWith("/") && !imagen.startsWith("https://")) {
    return { estado: "error", mensaje: "La imagen debe ser una ruta de la web (/fotos/…) o una URL https." };
  }

  const fila = {
    nombre,
    precio,
    estilo: String(datos.get("estilo") ?? "").trim() || null,
    tamano_aprox: String(datos.get("tamano_aprox") ?? "").trim() || null,
    descripcion: String(datos.get("descripcion") ?? "").trim() || null,
    imagen_url: imagen || null,
  };

  let error;
  if (id) {
    ({ error } = await supabase.from("disenos").update(fila).eq("id", id));
  } else {
    // Los nuevos van al final del catálogo y empiezan retirados: así no salen
    // en la web hasta que alguien los revisa y los publica.
    const { data: ultimo } = await supabase
      .from("disenos")
      .select("orden")
      .order("orden", { ascending: false })
      .limit(1)
      .maybeSingle();
    ({ error } = await supabase
      .from("disenos")
      .insert({ ...fila, disponible: false, orden: (ultimo?.orden ?? 0) + 1 }));
  }

  if (error) {
    console.error("Error al guardar el diseño:", error);
    return { estado: "error", mensaje: "No se ha podido guardar el diseño." };
  }

  revalidatePath("/catalogo");
  return { estado: "ok", mensaje: id ? "Cambios guardados." : "Diseño creado (sin publicar)." };
}

export async function cambiarDisponible(id: string, disponible: boolean) {
  const supabase = await conSesion();
  if (!supabase) return { ok: false as const, mensaje: "Sesión caducada." };

  const { error } = await supabase.from("disenos").update({ disponible }).eq("id", id);

  if (error) {
    console.error("Error al cambiar la disponibilidad:", error);
    return { ok: false as const, mensaje: "No se ha podido cambiar." };
  }

  revalidatePath("/catalogo");
  return { ok: true as const, mensaje: "" };
}

export async function eliminarDiseno(id: string) {
  const supabase = await conSesion();
  if (!supabase) return { ok: false as const, mensaje: "Sesión caducada." };

  // Un diseño con reservas es historia de clientes: se retira, no se borra.
  const { count } = await supabase
    .from("citas")
    .select("id", { count: "exact", head: true })
    .eq("diseno_id", id);

  if (count) {
    return { ok: false as const, mensaje: "Tiene reservas: retíralo en vez de borrarlo." };
  }

  const { error } = await supabase.from("disenos").delete().eq("id", id);

  if (error) {
    console.error("Error al eliminar el diseño:", error);
    return { ok: false as const, mensaje: "No se ha podido eliminar." };
  }

  revalidatePath("/catalogo");
  return { ok: true as const, mensaje: "" };
}

/* --- Consentimientos --------------------------------------------------- */

/**
 * Registra una ficha de salud y su consentimiento. No se editan ni se borran
 * desde el panel: una firma es un documento, así que una corrección es una
 * firma nueva y la anterior queda en el historial.
 */
export async function registrarConsentimiento(
  _anterior: ResultadoFormulario,
  datos: FormData,
): Promise<ResultadoFormulario> {
  const supabase = await conSesion();
  if (!supabase) return { estado: "error", mensaje: "Tu sesión ha caducado." };

  const clienteId = String(datos.get("cliente_id") ?? "");
  const citaId = String(datos.get("cita_id") ?? "") || null;
  const fecha = String(datos.get("fecha_firma") ?? "").trim();
  const menor = datos.get("menor") === "on";
  const tutor = String(datos.get("tutor") ?? "").trim();
  const texto = (campo: string) => String(datos.get(campo) ?? "").trim() || null;

  if (!clienteId) return { estado: "error", mensaje: "Falta el cliente." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return { estado: "error", mensaje: "La fecha de firma no es válida." };
  }
  const hoy = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" }).format(new Date());
  if (fecha > hoy) return { estado: "error", mensaje: "La fecha de firma no puede ser futura." };
  if (menor && !tutor) {
    return { estado: "error", mensaje: "Si es menor, indica quién firma como tutor legal." };
  }

  const { error } = await supabase.from("consentimientos").insert({
    cliente_id: clienteId,
    cita_id: citaId,
    fecha_firma: fecha,
    firmado: datos.get("firmado") === "on",
    alergias: texto("alergias"),
    medicacion: texto("medicacion"),
    condiciones: texto("condiciones"),
    embarazo: datos.get("embarazo") === "on",
    menor,
    tutor: menor ? tutor : null,
    notas: texto("notas"),
  });

  if (error) {
    console.error("Error al registrar el consentimiento:", error);
    return { estado: "error", mensaje: "No se ha podido guardar el consentimiento." };
  }

  revalidatePath(`/clientes/${clienteId}`);
  revalidatePath("/consentimientos");
  revalidatePath("/agenda");
  revalidatePath("/");
  return { estado: "ok", mensaje: "Consentimiento registrado." };
}
