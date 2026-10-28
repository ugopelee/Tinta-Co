"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@tinta/compartido/supabase/servidor";
import { metodosPago, type MetodoPago } from "@tinta/compartido/tipos";

type Respuesta = { ok: true; aviso?: string } | { ok: false; mensaje: string };

/** Igual que en `acciones-ventas.ts`: cada acción comprueba la sesión por su cuenta. */
async function conSesion() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? supabase : null;
}

const SIN_SESION = { ok: false as const, mensaje: "Tu sesión ha terminado. Vuelve a entrar para seguir." };

/** Los `raise exception` del trigger (P0001) ya traen un texto para la persona. */
function mensajeDe(error: { code?: string; message: string }, generico: string) {
  if (error.code === "P0001") return error.message;
  console.error(generico, error);
  return generico;
}

function revalidarFacturas(id: string, ventaId: string | null) {
  revalidatePath("/facturacion");
  revalidatePath(`/facturacion/${id}`);
  if (ventaId) revalidatePath(`/ventas/${ventaId}`);
  // El contador de cobros de la barra lateral vive en el layout.
  revalidatePath("/", "layout");
}

export async function marcarFacturaCobrada(id: string, metodo: MetodoPago): Promise<Respuesta> {
  const supabase = await conSesion();
  if (!supabase) return SIN_SESION;

  if (!metodosPago.some((m) => m.id === metodo)) return { ok: false, mensaje: "Método de pago no válido." };

  // La fecha la pone el servidor, en hora de Madrid, no el navegador.
  const hoy = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" }).format(new Date());

  // Con el estado de partida en el filtro, dos cobros a la vez no se pisan.
  const { data, error } = await supabase
    .from("facturas")
    .update({ estado: "cobrada", fecha_cobro: hoy, metodo_pago: metodo })
    .eq("id", id)
    .eq("estado", "emitida")
    .select("cita_id, venta_id, total");
  if (error) return { ok: false, mensaje: mensajeDe(error, "No se ha podido marcar la factura como cobrada.") };
  if (!data?.length) return { ok: false, mensaje: "Solo se puede cobrar una factura emitida. Recarga la página." };

  revalidarFacturas(id, data[0].venta_id);

  // Mantiene coherente el gráfico y el contador de cobros, que leen de las citas.
  // Si falla, la factura ya está cobrada y no se deshace: se avisa.
  const { cita_id, total } = data[0];
  if (cita_id) {
    const { error: errorCita } = await supabase
      .from("citas")
      .update({ pagado: true, fecha_cobro: hoy, metodo_pago: metodo, importe: Number(total) })
      .eq("id", cita_id);
    if (errorCita) {
      console.error("Factura cobrada, pero no se ha podido actualizar la cita:", errorCita);
      return {
        ok: true,
        aviso: "La factura está cobrada, pero no se ha podido actualizar la cita asociada. Revísala en Cobros.",
      };
    }
  }

  return { ok: true };
}

export async function anularFactura(id: string, motivo: string): Promise<Respuesta> {
  const supabase = await conSesion();
  if (!supabase) return SIN_SESION;

  const texto = motivo.trim();
  if (!texto) return { ok: false, mensaje: "Indica el motivo de la anulación." };

  const { data, error } = await supabase
    .from("facturas")
    .update({ estado: "anulada", motivo_anulacion: texto })
    .eq("id", id)
    .eq("estado", "emitida")
    .select("venta_id");
  if (error) return { ok: false, mensaje: mensajeDe(error, "No se ha podido anular la factura.") };
  if (!data?.length) return { ok: false, mensaje: "Solo se puede anular una factura emitida. Recarga la página." };

  revalidarFacturas(id, data[0].venta_id);
  return { ok: true };
}
