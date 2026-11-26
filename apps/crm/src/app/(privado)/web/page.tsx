import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { crearClienteServidor } from "@tinta/compartido/supabase/servidor";
import { leerWeb } from "@/lib/web";
import { normalizarSitio, sitioPorDefecto } from "@tinta/compartido/web/catalogo";
import { EditorWeb } from "@/components/web/Editor";

export const metadata: Metadata = { title: "Web" };
export const dynamic = "force-dynamic";

export default async function PaginaWeb() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: perfil } = await supabase
    .from("perfiles")
    .select("rol")
    .eq("id", user?.id ?? "")
    .maybeSingle();
  if (perfil?.rol !== "propietario") notFound();

  const web = await leerWeb();

  // Se edita el borrador; si no hay, lo publicado; si nunca se ha publicado, la plantilla de serie.
  // Todo pasa por normalizarSitio para que el editor compare JSON con el mismo orden de claves.
  // Sin `key`: el editor no se vuelve a montar si algo revalida la ruta (conserva historial y foco).
  const inicial = normalizarSitio(web.borrador ?? web.publicado ?? sitioPorDefecto("lamina"));
  const publicado = web.publicado ? normalizarSitio(web.publicado) : null;

  return (
    <EditorWeb
      inicial={inicial}
      publicado={publicado}
      borradorEn={web.borrador ? web.borradorEn : null}
      publicadoEn={web.publicadoEn}
    />
  );
}
