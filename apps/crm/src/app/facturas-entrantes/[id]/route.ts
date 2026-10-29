import type { NextRequest } from "next/server";
import { crearClienteServidor } from "@tinta/compartido/supabase/servidor";

/**
 * Abre el original de una factura subida que aún no ha leído el agente (o
 * que no pudo leer). Igual que `/facturas-proveedor/[id]`: enlace firmado de
 * un minuto con la sesión de quien pulsa.
 */
export async function GET(_request: NextRequest, contexto: RouteContext<"/facturas-entrantes/[id]">) {
  const { id } = await contexto.params;
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Tu sesión ha terminado. Vuelve a entrar para seguir.", { status: 401 });

  const { data: entrante } = await supabase.from("facturas_entrantes").select("archivo").eq("id", id).maybeSingle();
  if (!entrante) return new Response("No encontrada. Puede que el agente ya la haya leído.", { status: 404 });

  const { data, error } = await supabase.storage.from("facturas-proveedor").createSignedUrl(entrante.archivo, 60);
  if (error || !data) {
    console.error("Error al firmar el enlace de la factura subida:", error);
    return new Response("No se ha podido abrir la factura.", { status: 500 });
  }

  return Response.redirect(data.signedUrl, 302);
}
