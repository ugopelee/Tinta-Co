import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const RUTA_LOGIN = "/login";

/** Accesibles sin sesión: entrar, registrarse y volver de Google. */
const RUTAS_ABIERTAS = [RUTA_LOGIN, "/registro"];
const RUTA_RETORNO_OAUTH = "/auth/callback";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          // Impiden que un CDN cachee una respuesta con cookies de sesión.
          Object.entries(headers).forEach(([clave, valor]) =>
            response.headers.set(clave, valor),
          );
        },
      },
    },
  );

  // Debe ejecutarse antes de generar la respuesta para que un refresco de
  // token pueda escribirse en las cookies.
  const { data } = await supabase.auth.getClaims();
  const haySesion = Boolean(data?.claims);

  const { pathname } = request.nextUrl;

  // El retorno de Google llega sin sesión todavía: es quien la crea.
  if (pathname.startsWith(RUTA_RETORNO_OAUTH)) return response;

  const esAbierta = RUTAS_ABIERTAS.includes(pathname);

  if (!haySesion && !esAbierta) {
    return redirigir(request, RUTA_LOGIN, response, pathname);
  }

  if (haySesion && esAbierta) {
    return redirigir(request, "/", response);
  }

  return response;
}

/** Redirige conservando las cookies que el refresco de sesión haya escrito. */
function redirigir(
  request: NextRequest,
  destino: string,
  origen: NextResponse,
  volverA?: string,
) {
  const url = request.nextUrl.clone();
  url.pathname = destino;
  url.search = "";
  if (volverA) url.searchParams.set("volver", volverA);

  const redireccion = NextResponse.redirect(url);
  origen.cookies.getAll().forEach((cookie) => redireccion.cookies.set(cookie));
  return redireccion;
}

export const config = {
  matcher: [
    // Todo salvo estáticos e imágenes: así la sesión se refresca en cada
    // navegación real dentro del panel.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
