"use client";

import { crearClienteNavegador } from "@tinta/compartido/supabase/navegador";

const TIPOS: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" };
const MAX = 5 * 1024 * 1024;

/**
 * Sube una foto al bucket público «web» con la sesión del usuario (RLS: solo
 * el propietario escribe) y devuelve su URL pública. Se sube desde el
 * navegador para no pasar el archivo por una server action.
 */
export async function subirImagen(archivo: File): Promise<{ url: string } | { error: string }> {
  const ext = TIPOS[archivo.type];
  if (!ext) return { error: "Formato no admitido. Usa JPG, PNG, WebP o AVIF." };
  if (archivo.size > MAX) return { error: `La foto pesa ${(archivo.size / 1024 / 1024).toFixed(1)} MB y el máximo es 5 MB.` };

  const supabase = crearClienteNavegador();
  const ruta = `subidas/${new Date().toISOString().slice(0, 7)}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("web").upload(ruta, archivo, { contentType: archivo.type, cacheControl: "31536000" });
  if (error) {
    console.error("[web] subida fallida", error);
    return {
      error: /bucket/i.test(error.message)
        ? "Falta el almacén de fotos: aplica la migración del editor web en Supabase."
        : "No se ha podido subir la foto. Inténtalo de nuevo.",
    };
  }
  return { url: supabase.storage.from("web").getPublicUrl(ruta).data.publicUrl };
}
