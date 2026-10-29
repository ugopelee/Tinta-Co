import type { NextRequest } from "next/server";
import { crearClienteServidor } from "@tinta/compartido/supabase/servidor";

/**
 * Abre el CV de un candidato. Como las nóminas: bucket privado y enlace
 * firmado de un minuto con la sesión de quien pulsa. Solo el propietario
 * ve candidatos, así que a cualquier otro la fila no le aparece.
 */
export async function GET(_request: NextRequest, contexto: RouteContext<"/cvs/[id]">) {
  const { id } = await contexto.params;
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Sesión caducada.", { status: 401 });

  const { data: candidato } = await supabase.from("candidatos").select("cv").eq("id", id).maybeSingle();
  if (!candidato) return new Response("No encontrado.", { status: 404 });

  const { data, error } = await supabase.storage.from("cvs").createSignedUrl(candidato.cv, 60);
  if (error || !data) {
    console.error("Error al firmar el enlace del CV:", error);
    return new Response("No se ha podido abrir el CV.", { status: 500 });
  }

  return Response.redirect(data.signedUrl, 302);
}
