import type { NextRequest } from "next/server";
import { crearClienteServidor } from "@tinta/compartido/supabase/servidor";

/**
 * Abre el PDF de una nómina. El bucket es privado: se pide un enlace firmado
 * de un minuto con la sesión de quien pulsa, así que las políticas de
 * Storage deciden. El propietario abre cualquiera y el empleado solo las suyas.
 */
export async function GET(_request: NextRequest, contexto: RouteContext<"/nominas/[id]">) {
  const { id } = await contexto.params;
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Sesión caducada.", { status: 401 });

  // Con RLS, una nómina ajena simplemente no aparece.
  const { data: nomina } = await supabase.from("nominas").select("archivo").eq("id", id).maybeSingle();
  if (!nomina) return new Response("No encontrada.", { status: 404 });

  const { data, error } = await supabase.storage.from("nominas").createSignedUrl(nomina.archivo, 60);
  if (error || !data) {
    console.error("Error al firmar el enlace de la nómina:", error);
    return new Response("No se ha podido abrir la nómina.", { status: 500 });
  }

  return Response.redirect(data.signedUrl, 302);
}
