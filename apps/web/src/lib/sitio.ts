import { estudio } from "@tinta/compartido/estudio";
import { crearClienteServidor } from "@tinta/compartido/supabase/servidor";
import type { Diseno } from "@tinta/compartido/tipos";
import { normalizarSitio } from "@tinta/compartido/web/catalogo";
import type { Sitio } from "@tinta/compartido/web/esquema";
import type { DatosWeb } from "@/components/sitio/contrato";

/**
 * Lo publicado (para la web pública). `null` si nunca se ha publicado o la
 * tabla aún no existe: en ese caso `/` enseña la landing original.
 */
export async function webPublicada(): Promise<Sitio | null> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("web_sitio")
    .select("datos")
    .eq("estado", "publicado")
    .maybeSingle<{ datos: unknown }>();
  if (error) {
    console.error("[web] no se pudo leer la web publicada", error);
    return null;
  }
  return data ? normalizarSitio(data.datos) : null;
}

/** Datos reales que las plantillas pintan dentro de sus secciones. */
export async function datosWeb(): Promise<DatosWeb> {
  const supabase = await crearClienteServidor();
  // Filtro explícito: un propietario con sesión vería también los retirados
  // y la web pública enseña lo mismo a todo el mundo.
  const { data } = await supabase
    .from("disenos")
    .select("*")
    .eq("disponible", true)
    .order("orden", { ascending: true });

  return {
    disenos: (data ?? []) as Diseno[],
    servicios: estudio.servicios,
    contacto: estudio.contacto,
  };
}
