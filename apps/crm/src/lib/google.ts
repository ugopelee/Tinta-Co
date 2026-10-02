/**
 * Supabase publica en `/auth/v1/settings` qué proveedores tiene encendidos.
 * Lo preguntamos antes de pintar el botón: el acceso con Google se activa en
 * el panel de Supabase (con las credenciales de Google Cloud), no desde el
 * código, y ofrecer un botón que no lleva a ninguna parte se lee como que la
 * aplicación está rota.
 */
export async function googleDisponible() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const clave = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !clave) return false;

  try {
    const respuesta = await fetch(`${url}/auth/v1/settings`, {
      headers: { apikey: clave },
      // Esta configuración cambia una vez cada mucho: no hace falta
      // preguntarla en cada carga de la pantalla de acceso.
      next: { revalidate: 300 },
    });

    if (!respuesta.ok) return false;

    const ajustes = (await respuesta.json()) as {
      external?: Record<string, boolean>;
    };

    return ajustes.external?.google === true;
  } catch {
    // Sin respuesta de Supabase no hay forma de entrar con Google igualmente.
    return false;
  }
}
