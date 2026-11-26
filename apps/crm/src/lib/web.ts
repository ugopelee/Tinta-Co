import "server-only";
import { crearClienteServidor } from "@tinta/compartido/supabase/servidor";
import { normalizarSitio } from "@tinta/compartido/web/catalogo";
import type { Sitio } from "@tinta/compartido/web/esquema";

type Fila = { estado: "borrador" | "publicado"; datos: unknown; actualizado_en: string };

/** Borrador y publicado, para el editor. RLS: el borrador solo lo lee el propietario. */
export async function leerWeb(): Promise<{
  borrador: Sitio | null;
  publicado: Sitio | null;
  borradorEn: string | null;
  publicadoEn: string | null;
}> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("web_sitio")
    .select("estado,datos,actualizado_en")
    .returns<Fila[]>();
  if (error) console.error("[web] no se pudo leer web_sitio", error);
  const fila = (e: Fila["estado"]) => data?.find((f) => f.estado === e) ?? null;
  const b = fila("borrador");
  const p = fila("publicado");
  return {
    borrador: b ? normalizarSitio(b.datos) : null,
    publicado: p ? normalizarSitio(p.datos) : null,
    borradorEn: b?.actualizado_en ?? null,
    publicadoEn: p?.actualizado_en ?? null,
  };
}
