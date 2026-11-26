"use server";

import { conSesion, mensajeDe, SIN_SESION } from "@/lib/sesion";
import { normalizarSitio } from "@tinta/compartido/web/catalogo";
import type { Sitio } from "@tinta/compartido/web/esquema";

/**
 * Acciones del editor de la web (/web). La web pública es otra app y lee en
 * cada petición, así que aquí no hay `revalidatePath`.
 */

type Resultado = { ok: boolean; mensaje?: string; en?: string };

/** Tope generoso para no guardar JSON desbocados (las fotos van al bucket, no aquí). */
const MAX_BYTES = 400_000;

const SIN_PERMISO = "Solo la propiedad puede editar la web.";

type Cliente = NonNullable<Awaited<ReturnType<typeof conSesion>>>;

/** Sesión y rol: la RLS ya lo exige, pero así el aviso es claro y no un fallo técnico. */
async function propietario(): Promise<{ supabase: Cliente } | { error: string }> {
  const supabase = await conSesion();
  if (!supabase) return { error: SIN_SESION.mensaje };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data } = await supabase.from("perfiles").select("rol").eq("id", user?.id ?? "").maybeSingle();
  if (data?.rol !== "propietario") return { error: SIN_PERMISO };
  return { supabase };
}

async function escribir(supabase: Cliente, estado: "borrador" | "publicado", sitio: Sitio) {
  const datos = normalizarSitio(sitio);
  if (JSON.stringify(datos).length > MAX_BYTES) {
    return { error: "La web es demasiado grande para guardarla. Quita alguna sección." };
  }

  const en = new Date().toISOString();
  const { error } = await supabase
    .from("web_sitio")
    .upsert({ estado, datos, actualizado_en: en }, { onConflict: "estado" });
  if (error) return { error: mensajeDe(error, "No se ha podido guardar. Inténtalo de nuevo.") };
  return { en, datos };
}

export async function guardarBorrador(sitio: Sitio): Promise<Resultado> {
  const p = await propietario();
  if ("error" in p) return { ok: false, mensaje: p.error };
  const r = await escribir(p.supabase, "borrador", sitio);
  if ("error" in r) return { ok: false, mensaje: r.error };
  return { ok: true, en: r.en };
}

export async function publicarWeb(sitio: Sitio): Promise<Resultado> {
  const p = await propietario();
  if ("error" in p) return { ok: false, mensaje: p.error };
  const borrador = await escribir(p.supabase, "borrador", sitio);
  if ("error" in borrador) return { ok: false, mensaje: borrador.error };
  const publicado = await escribir(p.supabase, "publicado", sitio);
  if ("error" in publicado) return { ok: false, mensaje: publicado.error };

  // El historial es un extra: si falla, la web ya está publicada.
  const { error } = await p.supabase.from("web_publicaciones").insert({ datos: publicado.datos });
  if (error) console.error("[web] no se pudo guardar el historial", error);

  return { ok: true, en: publicado.en };
}

/** Vuelve el borrador a lo publicado. Si nunca se ha publicado, borra el borrador. */
export async function descartarBorrador(): Promise<{ ok: boolean; mensaje?: string; sitio?: Sitio }> {
  const p = await propietario();
  if ("error" in p) return { ok: false, mensaje: p.error };
  const { supabase } = p;

  const { data, error } = await supabase
    .from("web_sitio")
    .select("datos")
    .eq("estado", "publicado")
    .maybeSingle<{ datos: unknown }>();
  if (error) return { ok: false, mensaje: mensajeDe(error, "No se ha podido leer la web publicada.") };

  if (!data) {
    const { error: e } = await supabase.from("web_sitio").delete().eq("estado", "borrador");
    if (e) return { ok: false, mensaje: mensajeDe(e, "No se han podido descartar los cambios.") };
    return { ok: true };
  }
  const sitio = normalizarSitio(data.datos);
  const r = await escribir(supabase, "borrador", sitio);
  if ("error" in r) return { ok: false, mensaje: r.error };
  return { ok: true, sitio };
}
