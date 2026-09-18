import { NextResponse } from "next/server";
import { crearClienteServidor } from "@tinta/compartido/supabase/servidor";

/** Punto de retorno de Google: cambia el código temporal por una sesión. */
export async function GET(peticion: Request) {
  const { searchParams, origin } = new URL(peticion.url);
  const codigo = searchParams.get("code");
  const siguiente = searchParams.get("next") ?? "/";

  // Google avisa aquí mismo si el usuario cancela o deniega permisos.
  if (searchParams.get("error")) {
    return NextResponse.redirect(`${origin}/login?error=google`);
  }

  if (codigo) {
    const supabase = await crearClienteServidor();
    const { error } = await supabase.auth.exchangeCodeForSession(codigo);

    if (!error) {
      const destino = siguiente.startsWith("/") ? siguiente : "/";
      return NextResponse.redirect(`${origin}${destino}`);
    }

    console.error("Error al canjear el código de Google:", error);
  }

  return NextResponse.redirect(`${origin}/login?error=google`);
}
