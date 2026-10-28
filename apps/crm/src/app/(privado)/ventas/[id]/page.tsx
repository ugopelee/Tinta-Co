import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { crearClienteServidor } from "@tinta/compartido/supabase/servidor";
import { estadosVenta } from "@tinta/compartido/estudio";
import type { LineaVenta, Venta } from "@tinta/compartido/tipos";
import { BotonesVenta } from "@/components/BotonesVenta";
import { EditorVenta, lineaEditable } from "@/components/EditorVenta";
import { Encabezado } from "@/components/Encabezado";
import { PastillaColor } from "@/components/PastillaColor";
import { euros, importeLinea, totales } from "@/lib/importes";

export const metadata: Metadata = { title: "Venta" };

const fecha = (valor: string) =>
  new Date(valor).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });

export default async function DetalleVenta({ params }: PageProps<"/ventas/[id]">) {
  const { id } = await params;
  const supabase = await crearClienteServidor();

  const [{ data: ventaDatos }, { data: lineasDatos }, { data: factura }] = await Promise.all([
    supabase.from("ventas").select("*").eq("id", id).maybeSingle(),
    supabase.from("lineas_venta").select("*").eq("venta_id", id).order("orden"),
    supabase.from("facturas").select("id, numero").eq("venta_id", id).maybeSingle(),
  ]);

  if (!ventaDatos) notFound();

  const venta = ventaDatos as Venta;
  const lineas = ((lineasDatos ?? []) as LineaVenta[]).map((linea) => ({
    ...linea,
    cantidad: Number(linea.cantidad),
    precio_unitario: Number(linea.precio_unitario),
    descuento: Number(linea.descuento),
    iva: Number(linea.iva),
  }));
  const estado = estadosVenta.find((e) => e.id === venta.estado)!;
  const editable = venta.estado === "presupuesto";

  const [{ data: clientes }, { data: disenos }] = await Promise.all([
    editable
      ? supabase.from("clientes").select("id, nombre").order("nombre")
      : supabase.from("clientes").select("id, nombre").eq("id", venta.cliente_id),
    editable
      ? supabase.from("disenos").select("id, nombre, precio").eq("disponible", true).order("nombre")
      : Promise.resolve({ data: [] }),
  ]);
  const cliente = (clientes ?? []).find((c) => c.id === venta.cliente_id);
  const resumen = totales(lineas);

  return (
    <div className="max-w-4xl">
      <Encabezado
        miga="Ventas · detalle"
        titulo={venta.numero}
        nota={`${cliente?.nombre ?? "Cliente eliminado"} · ${fecha(venta.fecha)}`}
      >
        <PastillaColor nombre={estado.nombre} color={estado.color} />
      </Encabezado>

      <div className="mb-3 flex flex-wrap items-center gap-3">
        {venta.estado !== "presupuesto" && <BotonesVenta id={venta.id} estado={venta.estado} />}
        {factura && (
          <Link href={`/facturacion/${factura.id}`} className="text-sm font-medium underline-offset-4 hover:underline">
            Ver la factura {factura.numero}
          </Link>
        )}
      </div>

      {editable ? (
        <EditorVenta
          id={venta.id}
          clienteId={venta.cliente_id}
          citaId={venta.cita_id}
          validaHasta={venta.valida_hasta}
          notas={venta.notas}
          lineasIniciales={lineas.map((linea) => lineaEditable(linea))}
          clientes={(clientes ?? []) as { id: string; nombre: string }[]}
          disenos={(disenos ?? []).map((d) => ({ id: d.id as string, nombre: d.nombre as string, precio: d.precio as number | null }))}
        />
      ) : (
        <section className="tarjeta grid gap-4 p-5">
          {venta.valida_hasta && <p className="text-sm text-tenue">Válido hasta el {fecha(venta.valida_hasta)}</p>}

          <ul className="grid gap-2">
            {lineas.map((linea) => (
              <li key={linea.id} className="fila flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3 text-sm">
                <span className="min-w-0 flex-1">{linea.descripcion}</span>
                <span className="cifra text-xs text-tenue">
                  {linea.cantidad} × {euros(linea.precio_unitario)}
                  {linea.descuento > 0 && ` · −${linea.descuento} %`} · IVA {linea.iva} %
                </span>
                <span className="cifra w-24 text-right font-medium">{euros(importeLinea(linea))}</span>
              </li>
            ))}
          </ul>

          {venta.notas && <p className="text-sm leading-relaxed text-tenue">{venta.notas}</p>}

          <dl className="ml-auto grid w-full max-w-xs gap-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-tenue">Base imponible</dt>
              <dd className="cifra">{euros(resumen.base)}</dd>
            </div>
            {resumen.porIva.map((grupo) => (
              <div key={grupo.iva} className="flex justify-between">
                <dt className="text-tenue">IVA {grupo.iva} %</dt>
                <dd className="cifra">{euros(grupo.cuota)}</dd>
              </div>
            ))}
            <div className="flex justify-between border-t border-borde pt-1 font-semibold">
              <dt>Total</dt>
              <dd className="cifra">{euros(resumen.total)}</dd>
            </div>
          </dl>
        </section>
      )}
    </div>
  );
}
