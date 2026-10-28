"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@tinta/compartido/supabase/servidor";
import { tiposIva, type EstadoVenta } from "@tinta/compartido/estudio";
import type { LineaVenta } from "@tinta/compartido/tipos";
import { totales } from "@/lib/importes";

type Respuesta<T = object> = ({ ok: true } & T) | { ok: false; mensaje: string };
type LineaNueva = Omit<LineaVenta, "id" | "venta_id">;

/** Igual que en `acciones.ts`: cada acción comprueba la sesión por su cuenta. */
async function conSesion() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? supabase : null;
}

const SIN_SESION = { ok: false as const, mensaje: "Tu sesión ha terminado. Vuelve a entrar para seguir." };

/**
 * Los triggers y la función de facturar hacen `raise exception` con un texto
 * ya pensado para la persona (código P0001); se muestra tal cual. Cualquier
 * otro error es técnico y se queda en el log.
 */
function mensajeDe(error: { code?: string; message: string }, generico: string) {
  if (error.code === "P0001") return error.message;
  console.error(generico, error);
  return generico;
}

function revalidarVentas(id?: string) {
  revalidatePath("/ventas");
  if (id) revalidatePath(`/ventas/${id}`);
}

function validarLineas(lineas: LineaNueva[]): string | null {
  for (const linea of lineas) {
    if (!linea.descripcion.trim()) return "Todas las líneas necesitan una descripción.";
    if (!(linea.cantidad > 0)) return "La cantidad de cada línea debe ser mayor que cero.";
    if (!(linea.precio_unitario >= 0)) return "El precio de una línea no puede ser negativo.";
    if (!(linea.descuento >= 0 && linea.descuento <= 100)) return "El descuento debe estar entre 0 y 100.";
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
  const fallo = validarLineas(datos.lineas);
  if (fallo) return { ok: false, mensaje: fallo };

  const campos = {
    cliente_id: datos.cliente_id,
    cita_id: datos.cita_id,
    valida_hasta: datos.valida_hasta || null,
    notas: datos.notas?.trim() || null,
  };

  let id = datos.id;
  if (id) {
    const { data: actual } = await supabase.from("ventas").select("estado").eq("id", id).maybeSingle();
    if (!actual) return { ok: false, mensaje: "Esa venta no existe." };
    if (actual.estado !== "presupuesto") {
      return { ok: false, mensaje: "Solo se puede editar un presupuesto. Vuelve a presupuesto para cambiarlo." };
    }
    const { error } = await supabase.from("ventas").update(campos).eq("id", id);
    if (error) return { ok: false, mensaje: mensajeDe(error, "No se ha podido guardar el presupuesto.") };
  } else {
    const { data, error } = await supabase.from("ventas").insert(campos).select("id").single();
    if (error || !data) {
      return { ok: false, mensaje: error ? mensajeDe(error, "No se ha podido crear el presupuesto.") : "No se ha podido crear el presupuesto." };
    }
    id = data.id as string;
  }

  // Primero se insertan las nuevas y después se borran las viejas: si algo
  // falla a medias, el presupuesto no se queda sin líneas.
  const { data: viejas } = await supabase.from("lineas_venta").select("id").eq("venta_id", id);

  if (datos.lineas.length > 0) {
    const { error } = await supabase.from("lineas_venta").insert(
      datos.lineas.map((linea, orden) => ({
        venta_id: id,
        orden,
        descripcion: linea.descripcion.trim(),
        diseno_id: linea.diseno_id,
        cantidad: linea.cantidad,
        precio_unitario: linea.precio_unitario,
        descuento: linea.descuento,
        iva: linea.iva,
      })),
    );
    if (error) return { ok: false, mensaje: mensajeDe(error, "No se han podido guardar las líneas.") };
  }

  const idsViejos = (viejas ?? []).map((fila) => fila.id as string);
  if (idsViejos.length > 0) {
    const { error } = await supabase.from("lineas_venta").delete().in("id", idsViejos);
    if (error) return { ok: false, mensaje: mensajeDe(error, "No se han podido reemplazar las líneas.") };
  }

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
    return { ok: false, mensaje: `Una venta ${actual} no puede pasar a ${estado}.` };
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
