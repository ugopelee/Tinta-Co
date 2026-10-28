"use server";

import { revalidatePath } from "next/cache";
import { conSesion, mensajeDe, SIN_SESION } from "@/lib/sesion";
import { estadosVenta, tiposIva, type EstadoVenta } from "@tinta/compartido/estudio";
import type { LineaVenta } from "@tinta/compartido/tipos";
import { redondear, totales } from "@/lib/importes";

type Respuesta<T = object> = ({ ok: true } & T) | { ok: false; mensaje: string };
type LineaNueva = Omit<LineaVenta, "id" | "venta_id">;

function revalidarVentas(id?: string) {
  revalidatePath("/ventas");
  if (id) revalidatePath(`/ventas/${id}`);
}

function validarLineas(lineas: LineaNueva[]): string | null {
  for (const linea of lineas) {
    if (!linea.descripcion.trim()) return "Todas las líneas necesitan una descripción.";
    if (!Number.isFinite(linea.cantidad) || !(linea.cantidad > 0)) return "La cantidad de cada línea debe ser mayor que cero.";
    if (!Number.isFinite(linea.precio_unitario) || !(linea.precio_unitario >= 0)) return "El precio de una línea no puede ser negativo.";
    if (!Number.isFinite(linea.descuento) || !(linea.descuento >= 0 && linea.descuento <= 100)) return "El descuento debe estar entre 0 y 100.";
    if (!(tiposIva as readonly number[]).includes(linea.iva)) return "El IVA de una línea no es válido.";
  }
  return null;
}

export async function guardarVenta(datos: {
  id?: string;
  cliente_id: string;
  cita_id: string | null;
  valida_hasta: string | null;
  notas: string | null;
  lineas: LineaNueva[];
}): Promise<Respuesta<{ id: string }>> {
  const supabase = await conSesion();
  if (!supabase) return SIN_SESION;

  if (!datos.cliente_id) return { ok: false, mensaje: "Elige un cliente." };
  // Cantidad, precio y descuento a dos decimales, como los redondea la base y el editor: lo guardado es lo que se vio.
  const lineas = datos.lineas.map((linea) => ({
    ...linea,
    cantidad: redondear(linea.cantidad),
    precio_unitario: redondear(linea.precio_unitario),
    descuento: redondear(linea.descuento),
  }));
  const fallo = validarLineas(lineas);
  if (fallo) return { ok: false, mensaje: fallo };

  const { data: existe } = await supabase.from("clientes").select("id").eq("id", datos.cliente_id).maybeSingle();
  if (!existe) return { ok: false, mensaje: "Ese cliente no existe." };

  if (datos.cita_id) {
    const { data: cita } = await supabase.from("citas").select("cliente_id").eq("id", datos.cita_id).maybeSingle();
    if (cita?.cliente_id !== datos.cliente_id) return { ok: false, mensaje: "La cita elegida no pertenece a ese cliente." };
  }

  // Una sola llamada: la venta y sus líneas se guardan juntas o no se guarda nada.
  const { data, error } = await supabase.rpc("guardar_venta", {
    p_venta: datos.id ?? null,
    p_cliente: datos.cliente_id,
    p_cita: datos.cita_id,
    p_valida_hasta: datos.valida_hasta || null,
    p_notas: datos.notas?.trim() || null,
    p_lineas: lineas.map((linea, orden) => ({
      orden,
      descripcion: linea.descripcion.trim(),
      diseno_id: linea.diseno_id,
      cantidad: linea.cantidad,
      precio_unitario: linea.precio_unitario,
      descuento: linea.descuento,
      iva: linea.iva,
    })),
  });
  if (error || !data) {
    return { ok: false, mensaje: error ? mensajeDe(error, "No se ha podido guardar el presupuesto.") : "No se ha podido guardar el presupuesto." };
  }

  const id = data as string;
  revalidarVentas(id);
  return { ok: true, id };
}

/** Transiciones que admite el trigger de la base; «facturada» solo por la función. */
const TRANSICIONES: Record<EstadoVenta, EstadoVenta[]> = {
  presupuesto: ["confirmada", "cancelada"],
  confirmada: ["presupuesto", "cancelada"],
  cancelada: ["presupuesto"],
  facturada: [],
};

export async function cambiarEstadoVenta(
  id: string,
  estado: "confirmada" | "cancelada" | "presupuesto",
): Promise<Respuesta> {
  const supabase = await conSesion();
  if (!supabase) return SIN_SESION;

  const { data: venta } = await supabase.from("ventas").select("estado").eq("id", id).maybeSingle();
  if (!venta) return { ok: false, mensaje: "Esa venta no existe." };

  const actual = venta.estado as EstadoVenta;
  if (!TRANSICIONES[actual].includes(estado)) {
    const nombre = (id: EstadoVenta) => estadosVenta.find((e) => e.id === id)!.nombre.toLowerCase();
    return { ok: false, mensaje: `Una venta en estado ${nombre(actual)} no puede pasar a ${nombre(estado)}.` };
  }

  if (estado === "confirmada") {
    const { data: lineas } = await supabase.from("lineas_venta").select("*").eq("venta_id", id);
    const filas = (lineas ?? []).map((linea) => ({
      cantidad: Number(linea.cantidad),
      precio_unitario: Number(linea.precio_unitario),
      descuento: Number(linea.descuento),
      iva: Number(linea.iva),
    }));
    if (filas.length === 0) return { ok: false, mensaje: "Añade al menos una línea antes de confirmar." };
    if (totales(filas).total <= 0) return { ok: false, mensaje: "El total debe ser mayor que cero para confirmar." };
  }

  // Con el estado de partida en el filtro, dos cambios a la vez no se pisan.
  const { data, error } = await supabase.from("ventas").update({ estado }).eq("id", id).eq("estado", actual).select("id");
  if (error) return { ok: false, mensaje: mensajeDe(error, "No se ha podido cambiar el estado.") };
  if (!data?.length) return { ok: false, mensaje: "La venta ha cambiado mientras tanto. Recarga la página." };

  revalidarVentas(id);
  return { ok: true };
}

export async function facturarVenta(id: string): Promise<Respuesta<{ facturaId: string }>> {
  const supabase = await conSesion();
  if (!supabase) return SIN_SESION;

  const { data, error } = await supabase.rpc("facturar_venta", { p_venta: id });
  if (error || !data) {
    return { ok: false, mensaje: error ? mensajeDe(error, "No se ha podido crear la factura.") : "No se ha podido crear la factura." };
  }

  revalidarVentas(id);
  revalidatePath("/facturacion");
  return { ok: true, facturaId: data as string };
}
