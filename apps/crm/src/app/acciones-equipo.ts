"use server";

import { randomInt, randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@tinta/compartido/supabase/servidor";
import { equipo } from "@tinta/compartido/estudio";
import type { ResultadoFormulario } from "@tinta/compartido/formularios";
import {
  diasLaborables,
  hoyMadrid,
  saldoVacaciones,
  type Credenciales,
  type ResultadoAlta,
} from "@/lib/equipo";
import type { SolicitudVacaciones } from "@tinta/compartido/tipos";

/**
 * Igual que en `acciones.ts`: cada acción comprueba la sesión y el rol por su
 * cuenta. Las políticas RLS vuelven a comprobarlo en la base de datos; esto
 * solo da un mensaje legible antes de llegar allí.
 */
async function conPropietario() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from("perfiles").select("rol").eq("id", user.id).maybeSingle();
  return data?.rol === "propietario" ? supabase : null;
}

async function conEmpleado() {
  const supabase = await crearClienteServidor();
  const { data: empleadoId } = await supabase.rpc("mi_empleado_id");
  return empleadoId ? { supabase, empleadoId: empleadoId as string } : null;
}

/**
 * Contraseña inicial legible para dictarla o apuntarla: sin 0/O ni 1/l/I.
 * `randomInt` usa el generador criptográfico, no `Math.random`.
 */
function generarClave() {
  const letras = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bloque = () => Array.from({ length: 4 }, () => letras[randomInt(letras.length)]).join("");
  return `${bloque()}-${bloque()}-${bloque()}`;
}

const TIPOS_FOTO: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

function revalidarEquipo(empleadoId?: string) {
  revalidatePath("/equipo");
  revalidatePath("/equipo/ausencias");
  revalidatePath("/equipo/fichajes");
  revalidatePath("/portal");
  if (empleadoId) revalidatePath(`/equipo/${empleadoId}`);
}

async function crearCuentaPara(
  supabase: NonNullable<Awaited<ReturnType<typeof conPropietario>>>,
  empleadoId: string,
): Promise<{ ok: true; credenciales: Credenciales } | { ok: false; mensaje: string }> {
  const { data: ficha } = await supabase.from("empleados").select("email").eq("id", empleadoId).maybeSingle();
  if (!ficha) return { ok: false, mensaje: "Ese empleado no existe." };

  const clave = generarClave();
  const { error } = await supabase.rpc("crear_cuenta_empleado", { p_empleado: empleadoId, p_clave: clave });
  if (error) {
    console.error("Error al crear la cuenta del empleado:", error);
    return { ok: false, mensaje: error.message || "No se ha podido crear la cuenta." };
  }
  return { ok: true, credenciales: { usuario: ficha.email, clave } };
}

// --- Propietario -------------------------------------------------------------

/**
 * Alta completa: ficha, foto, checklist de incorporación y cuenta del CRM con
 * usuario y contraseña. Es lo que en Odoo hacían a mano el plan de
 * incorporación y la regla automatizada.
 */
export async function altaEmpleado(_anterior: ResultadoAlta, datos: FormData): Promise<ResultadoAlta> {
  const supabase = await conPropietario();
  if (!supabase) return { estado: "error", mensaje: "Solo el propietario puede dar altas." };

  const texto = (campo: string) => String(datos.get(campo) ?? "").trim();
  const nombre = texto("nombre");
  const email = texto("email").toLowerCase();
  const puesto = texto("puesto");
  const departamento = texto("departamento") || null;
  const telefono = texto("telefono") || null;
  const fechaAlta = texto("fecha_alta") || hoyMadrid();
  const foto = datos.get("foto");

  if (!nombre || !email || !puesto) {
    return { estado: "error", mensaje: "Nombre, email y puesto son obligatorios." };
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { estado: "error", mensaje: "El email no es válido." };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaAlta)) {
    return { estado: "error", mensaje: "La fecha de alta no es válida." };
  }

  const hayFoto = foto instanceof File && foto.size > 0;
  if (hayFoto) {
    if (!TIPOS_FOTO[foto.type]) return { estado: "error", mensaje: "La foto debe ser PNG, JPG o WebP." };
    if (foto.size > 2 * 1024 * 1024) return { estado: "error", mensaje: "La foto no puede pasar de 2 MB." };
  }

  const { data: creado, error } = await supabase
    .from("empleados")
    .insert({ nombre, email, puesto, departamento, telefono, fecha_alta: fechaAlta })
    .select("id")
    .single();

  if (error || !creado) {
    console.error("Error al dar de alta:", error);
    return {
      estado: "error",
      mensaje: error?.code === "23505" ? "Ya hay alguien en el equipo con ese email." : "No se ha podido dar el alta.",
    };
  }

  const id = creado.id as string;

  if (hayFoto) {
    const ruta = `${id}/${randomUUID()}.${TIPOS_FOTO[foto.type]}`;
    const { error: errorFoto } = await supabase.storage
      .from("fotos-equipo")
      .upload(ruta, foto, { contentType: foto.type });
    if (errorFoto) {
      console.error("Error al subir la foto:", errorFoto);
    } else {
      const { data } = supabase.storage.from("fotos-equipo").getPublicUrl(ruta);
      await supabase.from("empleados").update({ foto_url: data.publicUrl }).eq("id", id);
    }
  }

  // La checklist sale sola de la plantilla del estudio.
  const { error: errorTareas } = await supabase.from("tareas_incorporacion").insert(
    equipo.incorporacion.map((tarea, orden) => ({
      empleado_id: id,
      titulo: tarea.titulo,
      descripcion: tarea.descripcion,
      de_empleado: tarea.deEmpleado,
      orden,
    })),
  );
  if (errorTareas) console.error("Error al crear la incorporación:", errorTareas);

  const cuenta = await crearCuentaPara(supabase, id);
  revalidarEquipo(id);

  if (!cuenta.ok) {
    return {
      estado: "ok",
      empleadoId: id,
      mensaje: `Alta hecha, pero la cuenta no se ha creado: ${cuenta.mensaje} Puedes reintentarlo desde su ficha.`,
    };
  }

  return {
    estado: "ok",
    empleadoId: id,
    mensaje: `${nombre} ya está dado de alta y tiene su checklist de incorporación.`,
    credenciales: cuenta.credenciales,
  };
}

export async function cambiarFoto(empleadoId: string, datos: FormData) {
  const supabase = await conPropietario();
  if (!supabase) return { ok: false as const, mensaje: "Solo el propietario puede cambiar la foto." };

  const foto = datos.get("foto");
  if (!(foto instanceof File) || foto.size === 0) return { ok: false as const, mensaje: "Elige una imagen." };
  if (!TIPOS_FOTO[foto.type]) return { ok: false as const, mensaje: "La foto debe ser PNG, JPG o WebP." };
  if (foto.size > 2 * 1024 * 1024) return { ok: false as const, mensaje: "La foto no puede pasar de 2 MB." };

  // Nombre nuevo en cada cambio: la URL pública cambia y ninguna caché
  // sigue enseñando la foto anterior.
  const ruta = `${empleadoId}/${randomUUID()}.${TIPOS_FOTO[foto.type]}`;
  const { error } = await supabase.storage.from("fotos-equipo").upload(ruta, foto, { contentType: foto.type });
  if (error) {
    console.error("Error al subir la foto:", error);
    return { ok: false as const, mensaje: "No se ha podido subir la foto." };
  }

  const { data } = supabase.storage.from("fotos-equipo").getPublicUrl(ruta);
  const { data: anterior } = await supabase.from("empleados").select("foto_url").eq("id", empleadoId).single();
  await supabase.from("empleados").update({ foto_url: data.publicUrl }).eq("id", empleadoId);

  const rutaAnterior = anterior?.foto_url?.split("/fotos-equipo/")[1];
  if (rutaAnterior) await supabase.storage.from("fotos-equipo").remove([rutaAnterior]);

  revalidarEquipo(empleadoId);
  return { ok: true as const, mensaje: "" };
}

export async function crearCuentaEmpleado(empleadoId: string) {
  const supabase = await conPropietario();
  if (!supabase) return { ok: false as const, mensaje: "Solo el propietario puede crear cuentas." };

  const resultado = await crearCuentaPara(supabase, empleadoId);
  revalidarEquipo(empleadoId);
  return resultado;
}

export async function restablecerClave(empleadoId: string) {
  const supabase = await conPropietario();
  if (!supabase) return { ok: false as const, mensaje: "Solo el propietario puede cambiar contraseñas." };

  const { data: ficha } = await supabase.from("empleados").select("email").eq("id", empleadoId).maybeSingle();
  if (!ficha) return { ok: false as const, mensaje: "Ese empleado no existe." };

  const clave = generarClave();
  const { error } = await supabase.rpc("restablecer_clave_empleado", { p_empleado: empleadoId, p_clave: clave });
  if (error) {
    console.error("Error al restablecer la contraseña:", error);
    return { ok: false as const, mensaje: error.message || "No se ha podido cambiar la contraseña." };
  }
  return { ok: true as const, credenciales: { usuario: ficha.email as string, clave } };
}

export async function alternarTarea(tareaId: string, hecha: boolean) {
  const supabase = await conPropietario();
  if (!supabase) return { ok: false as const, mensaje: "Sesión caducada." };

  // El paso a «Activo» lo hace un trigger al cerrarse la última tarea.
  const { data, error } = await supabase
    .from("tareas_incorporacion")
    .update({ hecha, hecha_at: hecha ? new Date().toISOString() : null })
    .eq("id", tareaId)
    .select("empleado_id")
    .single();

  if (error) {
    console.error("Error al marcar la tarea:", error);
    return { ok: false as const, mensaje: "No se ha podido guardar." };
  }

  revalidarEquipo(data.empleado_id as string);
  return { ok: true as const, mensaje: "" };
}

export async function cambiarBaja(empleadoId: string, baja: boolean) {
  const supabase = await conPropietario();
  if (!supabase) return { ok: false as const, mensaje: "Sesión caducada." };

  let estado: "baja" | "activo" | "incorporacion" = "baja";
  if (!baja) {
    const { count } = await supabase
      .from("tareas_incorporacion")
      .select("id", { count: "exact", head: true })
      .eq("empleado_id", empleadoId)
      .eq("hecha", false);
    estado = (count ?? 0) > 0 ? "incorporacion" : "activo";
  }

  const { error } = await supabase.from("empleados").update({ estado }).eq("id", empleadoId);
  if (error) {
    console.error("Error al cambiar la baja:", error);
    return { ok: false as const, mensaje: "No se ha podido guardar." };
  }

  // Al dar de baja se cierra un fichaje que se hubiera quedado abierto.
  if (baja) {
    await supabase
      .from("fichajes")
      .update({ salida: new Date().toISOString() })
      .eq("empleado_id", empleadoId)
      .is("salida", null);
  }

  revalidarEquipo(empleadoId);
  return { ok: true as const, mensaje: "" };
}

export async function responderVacaciones(id: string, estado: "aprobada" | "rechazada", respuesta?: string) {
  const supabase = await conPropietario();
  if (!supabase) return { ok: false as const, mensaje: "Sesión caducada." };

  if (estado !== "aprobada" && estado !== "rechazada") {
    return { ok: false as const, mensaje: "Respuesta no válida." };
  }

  const { data, error } = await supabase
    .from("vacaciones")
    .update({
      estado,
      respuesta: respuesta?.trim() || null,
      respondida_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("empleado_id")
    .single();

  if (error) {
    console.error("Error al responder las vacaciones:", error);
    return { ok: false as const, mensaje: "No se ha podido guardar la respuesta." };
  }

  revalidarEquipo(data.empleado_id as string);
  revalidatePath("/");
  return { ok: true as const, mensaje: "" };
}

export async function guardarEvaluacion(
  _anterior: ResultadoFormulario,
  datos: FormData,
): Promise<ResultadoFormulario> {
  const supabase = await conPropietario();
  if (!supabase) return { estado: "error", mensaje: "Solo el propietario puede evaluar." };

  const empleadoId = String(datos.get("empleado_id") ?? "");
  const trimestre = String(datos.get("trimestre") ?? "");
  const nota = Number(datos.get("nota"));
  const comentario = String(datos.get("comentario") ?? "").trim() || null;

  if (!empleadoId) return { estado: "error", mensaje: "Falta el empleado." };
  if (!/^\d{4}-T[1-4]$/.test(trimestre)) return { estado: "error", mensaje: "Trimestre no válido." };
  if (!Number.isInteger(nota) || nota < 1 || nota > 5) {
    return { estado: "error", mensaje: "Elige una nota del 1 al 5." };
  }

  // Una evaluación por trimestre: volver a evaluar corrige la anterior.
  const { error } = await supabase
    .from("evaluaciones")
    .upsert(
      { empleado_id: empleadoId, trimestre, nota, comentario, updated_at: new Date().toISOString() },
      { onConflict: "empleado_id,trimestre" },
    );

  if (error) {
    console.error("Error al guardar la evaluación:", error);
    return { estado: "error", mensaje: "No se ha podido guardar la evaluación." };
  }

  revalidarEquipo(empleadoId);
  return { estado: "ok", mensaje: `Evaluación de ${trimestre.replace("-T", " · T")} guardada.` };
}

export async function subirNomina(
  _anterior: ResultadoFormulario,
  datos: FormData,
): Promise<ResultadoFormulario> {
  const supabase = await conPropietario();
  if (!supabase) return { estado: "error", mensaje: "Solo el propietario puede subir nóminas." };

  const empleadoId = String(datos.get("empleado_id") ?? "");
  const periodo = String(datos.get("periodo") ?? "");
  const archivo = datos.get("archivo");

  if (!empleadoId) return { estado: "error", mensaje: "Falta el empleado." };
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(periodo)) return { estado: "error", mensaje: "Elige el mes de la nómina." };
  if (!(archivo instanceof File) || archivo.size === 0) {
    return { estado: "error", mensaje: "Adjunta el PDF de la nómina." };
  }
  if (archivo.size > 5 * 1024 * 1024) return { estado: "error", mensaje: "El PDF no puede pasar de 5 MB." };

  // El tipo lo declara el navegador; la cabecera del archivo no miente.
  const cabecera = new TextDecoder().decode(new Uint8Array(await archivo.slice(0, 5).arrayBuffer()));
  if (cabecera !== "%PDF-") return { estado: "error", mensaje: "El archivo no es un PDF." };

  const ruta = `${empleadoId}/${periodo}-${randomUUID()}.pdf`;
  const { error: errorSubida } = await supabase.storage
    .from("nominas")
    .upload(ruta, archivo, { contentType: "application/pdf" });

  if (errorSubida) {
    console.error("Error al subir la nómina:", errorSubida);
    return { estado: "error", mensaje: "No se ha podido subir el PDF." };
  }

  const { error } = await supabase.from("nominas").insert({ empleado_id: empleadoId, periodo, archivo: ruta });

  if (error) {
    // Sin fila que lo apunte, el PDF se quedaría huérfano en el bucket.
    await supabase.storage.from("nominas").remove([ruta]);
    console.error("Error al registrar la nómina:", error);
    return {
      estado: "error",
      mensaje: error.code === "23505" ? "Ya hay una nómina de ese mes para esta persona." : "No se ha podido guardar la nómina.",
    };
  }

  revalidarEquipo(empleadoId);
  return { estado: "ok", mensaje: "Nómina subida. El empleado ya puede verla y firmarla en su portal." };
}

// --- Empleado ---------------------------------------------------------------

export async function fichar() {
  const sesion = await conEmpleado();
  if (!sesion) return { ok: false as const, mensaje: "Tu cuenta no está activa en el equipo." };

  const { data, error } = await sesion.supabase.rpc("fichar");
  if (error) {
    console.error("Error al fichar:", error);
    return { ok: false as const, mensaje: "No se ha podido fichar. Inténtalo de nuevo." };
  }

  revalidarEquipo(sesion.empleadoId);
  return { ok: true as const, mensaje: data?.salida ? "Salida registrada." : "Entrada registrada." };
}

export async function pedirVacaciones(
  _anterior: ResultadoFormulario,
  datos: FormData,
): Promise<ResultadoFormulario> {
  const sesion = await conEmpleado();
  if (!sesion) return { estado: "error", mensaje: "Tu cuenta no está activa en el equipo." };

  const desde = String(datos.get("desde") ?? "");
  const hasta = String(datos.get("hasta") ?? "");
  const motivo = String(datos.get("motivo") ?? "").trim() || null;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(desde) || !/^\d{4}-\d{2}-\d{2}$/.test(hasta)) {
    return { estado: "error", mensaje: "Elige las dos fechas." };
  }
  if (desde < hoyMadrid()) return { estado: "error", mensaje: "No se pueden pedir días ya pasados." };
  if (hasta < desde) return { estado: "error", mensaje: "La fecha final va después de la inicial." };

  const dias = diasLaborables(desde, hasta);
  if (dias === 0) return { estado: "error", mensaje: "Ese periodo no tiene ningún día laborable." };

  const { data } = await sesion.supabase.from("vacaciones").select("*").eq("empleado_id", sesion.empleadoId);
  const saldo = saldoVacaciones((data ?? []) as SolicitudVacaciones[], Number(desde.slice(0, 4)));
  if (dias > saldo.quedan - saldo.pendientes) {
    return {
      estado: "error",
      mensaje: `Pides ${dias} días y te quedan ${saldo.quedan - saldo.pendientes} sin comprometer.`,
    };
  }

  const { error } = await sesion.supabase
    .from("vacaciones")
    .insert({ empleado_id: sesion.empleadoId, desde, hasta, motivo });

  if (error) {
    console.error("Error al pedir vacaciones:", error);
    return { estado: "error", mensaje: "No se ha podido enviar la solicitud." };
  }

  revalidarEquipo(sesion.empleadoId);
  return { estado: "ok", mensaje: `Solicitud de ${dias} ${dias === 1 ? "día" : "días"} enviada. Te avisamos cuando se responda.` };
}

export async function firmarNomina(nominaId: string, firma: string) {
  const sesion = await conEmpleado();
  if (!sesion) return { ok: false as const, mensaje: "Tu cuenta no está activa en el equipo." };

  if (!firma.startsWith("data:image/png;base64,") || firma.length > 400_000) {
    return { ok: false as const, mensaje: "La firma no es válida. Vuelve a dibujarla." };
  }

  const { error } = await sesion.supabase.rpc("firmar_nomina", { p_nomina: nominaId, p_firma: firma });
  if (error) {
    console.error("Error al firmar la nómina:", error);
    return { ok: false as const, mensaje: "No se ha podido firmar. ¿Ya estaba firmada?" };
  }

  revalidarEquipo(sesion.empleadoId);
  return { ok: true as const, mensaje: "" };
}

export async function completarMiTarea(tareaId: string) {
  const sesion = await conEmpleado();
  if (!sesion) return { ok: false as const, mensaje: "Tu cuenta no está activa en el equipo." };

  const { error } = await sesion.supabase.rpc("completar_mi_tarea", { p_tarea: tareaId });
  if (error) {
    console.error("Error al completar la tarea:", error);
    return { ok: false as const, mensaje: "No se ha podido marcar la tarea." };
  }

  revalidarEquipo(sesion.empleadoId);
  return { ok: true as const, mensaje: "" };
}
