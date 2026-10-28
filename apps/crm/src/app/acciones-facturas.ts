"use server";

import { revalidatePath } from "next/cache";
import { conSesion, mensajeDe, SIN_SESION } from "@/lib/sesion";
import { metodosPago, type FacturaProveedor, type MetodoPago } from "@tinta/compartido/tipos";

type Respuesta = { ok: true; aviso?: string } | { ok: false; mensaje: string };

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
    // Solo si la cita sigue sin cobrar: si ya tenía su propio cobro (otro método, otra fecha), no se pisa.
    const { data: citaActualizada, error: errorCita } = await supabase
      .from("citas")
      .update({ pagado: true, fecha_cobro: hoy, metodo_pago: metodo, importe: Number(total) })
      .eq("id", cita_id)
      .eq("pagado", false)
      .select("id");
    if (!errorCita && !citaActualizada?.length) {
      return {
        ok: true,
        aviso: "La factura está cobrada. La cita asociada ya tenía su propio cobro y se ha dejado como estaba.",
      };
    }
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

type DatosFacturaProveedor = Pick<FacturaProveedor, "numero" | "fecha" | "proveedor" | "nif" | "base" | "iva" | "total">;

/** Una fecha ISO (AAAA-MM-DD) que además existe en el calendario. */
function fechaValida(valor: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const fecha = new Date(`${valor}T00:00:00Z`);
  return !Number.isNaN(fecha.getTime()) && fecha.toISOString().slice(0, 10) === valor;
}

/**
 * El agente deja la factura como borrador y la persona la contrasta con el
 * original: aquí se corrige y se valida o se descarta, una sola vez.
 */
export async function revisarFacturaProveedor(
  id: string,
  datos: DatosFacturaProveedor,
  estado: "validada" | "descartada",
): Promise<Respuesta> {
  const supabase = await conSesion();
  if (!supabase) return SIN_SESION;

  if (estado !== "validada" && estado !== "descartada") return { ok: false, mensaje: "Estado no válido." };

  const resolucion = { estado, revisada_at: new Date().toISOString() };
  let cambios: Record<string, unknown> = resolucion;

  // Descartar no exige datos válidos ni los reescribe: la factura se aparta tal como la leyó el agente.
  if (estado === "validada") {
    const numero = String(datos?.numero ?? "").trim();
    const proveedor = String(datos?.proveedor ?? "").trim();
    const fecha = String(datos?.fecha ?? "");
    if (!numero) return { ok: false, mensaje: "Indica el número de factura." };
    if (!proveedor) return { ok: false, mensaje: "Indica el proveedor." };
    if (!fechaValida(fecha)) return { ok: false, mensaje: "La fecha no es válida." };

    const { base, iva, total } = datos;
    if (![base, iva, total].every((valor) => typeof valor === "number" && Number.isFinite(valor))) {
      // Una factura rectificativa o un abono del proveedor traen importes negativos.
      return { ok: false, mensaje: "Los importes deben ser números." };
    }
    // En céntimos enteros, para que 0,02 exacto no falle por coma flotante.
    if (Math.abs(Math.round(base * 100) + Math.round(iva * 100) - Math.round(total * 100)) > 2) {
      return { ok: false, mensaje: "La base más el IVA no coincide con el total." };
    }

    cambios = { ...resolucion, numero, fecha, proveedor, nif: String(datos.nif ?? "").trim() || null, base, iva, total };
  }

  // Con el estado de partida en el filtro, una factura ya resuelta no se pisa.
  const { data, error } = await supabase
    .from("facturas_proveedor")
    .update(cambios)
    .eq("id", id)
    .eq("estado", "por_revisar")
    .select("id");
  if (error) {
    // Índice único por proveedor y número: corregir los datos puede crear un duplicado.
    if (error.code === "23505") {
      return { ok: false, mensaje: "Ya existe otra factura de este proveedor con ese número." };
    }
    return { ok: false, mensaje: mensajeDe(error, "No se ha podido guardar la factura del proveedor.") };
  }
  if (!data?.length) return { ok: false, mensaje: "Esta factura ya no está por revisar. Recarga la página." };

  revalidatePath("/facturacion/proveedores");
  // «Gastos validados» de Facturación y el contador de la barra lateral.
  revalidatePath("/facturacion");
  revalidatePath("/", "layout");
  return { ok: true };
}
