import type { NextRequest } from "next/server";
import { crearClienteServidor } from "@tinta/compartido/supabase/servidor";

/**
 * Abre el original de una factura de proveedor. El bucket es privado: se pide
 * un enlace firmado de un minuto con la sesión de quien pulsa, así que las
 * políticas de Storage deciden y solo el propietario llega al archivo.
 */
export async function GET(_request: NextRequest, contexto: RouteContext<"/facturas-proveedor/[id]">) {
  const { id } = await contexto.params;
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Tu sesión ha terminado. Vuelve a entrar para seguir.", { status: 401 });

  const { data: factura } = await supabase.from("facturas_proveedor").select("archivo").eq("id", id).maybeSingle();
  if (!factura) return new Response("No encontrada.", { status: 404 });

  const { data, error } = await supabase.storage.from("facturas-proveedor").createSignedUrl(factura.archivo, 60);
  if (error || !data) {
    console.error("Error al firmar el enlace de la factura de proveedor:", error);
    return new Response("No se ha podido abrir la factura.", { status: 500 });
  }

  return Response.redirect(data.signedUrl, 302);
}
