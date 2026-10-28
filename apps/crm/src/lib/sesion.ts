import { crearClienteServidor } from "@tinta/compartido/supabase/servidor";

/**
 * El proxy no basta para proteger las server actions: se ejecutan como POST
 * sobre la ruta donde viven y un cambio de matcher las dejaría al descubierto.
 * Por eso cada acción comprueba la sesión por su cuenta. Vive fuera de los
 * archivos `"use server"` porque estos solo pueden exportar acciones.
 */
export async function conSesion() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? supabase : null;
}

export const SIN_SESION = { ok: false as const, mensaje: "Tu sesión ha terminado. Vuelve a entrar para seguir." };

/**
 * Los triggers y las funciones SQL hacen `raise exception` con un texto ya
 * pensado para la persona (código P0001); se muestra tal cual. Cualquier otro
 * error es técnico y se queda en el log.
 */
export function mensajeDe(error: { code?: string; message: string }, generico: string) {
  if (error.code === "P0001") return error.message;
  console.error(generico, error);
  return generico;
}
