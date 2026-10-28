import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { crearClienteServidor } from "@tinta/compartido/supabase/servidor";
import { estadosFactura, estudio } from "@tinta/compartido/estudio";
import { metodosPago, type Factura, type LineaFactura } from "@tinta/compartido/tipos";
import { BotonesFactura } from "@/components/BotonesFactura";
import { BotonImprimir } from "@/components/BotonImprimir";
import { Encabezado } from "@/components/Encabezado";
import { PastillaColor } from "@/components/PastillaColor";
import { euros, totales } from "@/lib/importes";

export const metadata: Metadata = { title: "Factura" };

const fecha = (valor: string) =>
  new Date(valor).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });

export default async function DetalleFactura({ params }: PageProps<"/facturacion/[id]">) {
  const { id } = await params;
  const supabase = await crearClienteServidor();

  const [{ data: facturaDatos }, { data: lineasDatos }] = await Promise.all([
    supabase.from("facturas").select("*, clientes(nombre, email, telefono)").eq("id", id).maybeSingle(),
    supabase.from("lineas_factura").select("*").eq("factura_id", id).order("orden"),
  ]);
  if (!facturaDatos) notFound();

  const { clientes: cliente, ...resto } = facturaDatos as Factura & {
    clientes: { nombre: string; email: string | null; telefono: string | null } | null;
  };
  const factura = resto as Factura;
  const lineas = ((lineasDatos ?? []) as LineaFactura[]).map((linea) => ({
    ...linea,
    cantidad: Number(linea.cantidad),
    precio_unitario: Number(linea.precio_unitario),
    descuento: Number(linea.descuento),
    iva: Number(linea.iva),
    importe: Number(linea.importe),
  }));
  const estado = estadosFactura.find((e) => e.id === factura.estado)!;
  const metodo = metodosPago.find((m) => m.id === factura.metodo_pago)?.nombre;
  // El desglose sale de las líneas guardadas con los mismos helpers que la función SQL.
  const resumen = totales(lineas);
  const fiscal = estudio.datosFiscales;

  return (
    <div className="max-w-4xl">
      <div className="print:hidden">
        <Encabezado miga="Facturación · factura" titulo={factura.numero} nota={`${cliente?.nombre ?? "Cliente eliminado"} · ${fecha(factura.fecha_emision)}`}>
          <PastillaColor nombre={estado.nombre} color={estado.color} />
          <BotonImprimir />
        </Encabezado>

        <div className="mb-3">
          <Link
            href={`/ventas/${factura.venta_id}`}
            className="text-sm font-medium underline-offset-4 hover:underline"
          >
            Ver la venta de origen
          </Link>
        </div>

        {factura.estado === "emitida" && <BotonesFactura id={factura.id} />}
      </div>

      <article className="factura tarjeta grid gap-6 p-6 sm:p-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="text-sm">
            <p className="titular text-lg">{fiscal.razonSocial}</p>
            <p className="text-tenue">NIF {fiscal.nif}</p>
            <p className="text-tenue">{fiscal.direccion}</p>
            <p className="text-tenue">{fiscal.email}</p>
          </div>
          <div className="text-right text-sm">
            <p className="etiqueta text-tenue">Factura</p>
            <p className="titular cifra text-2xl">{factura.numero}</p>
            <div className="mt-1">
              <PastillaColor nombre={estado.nombre} color={estado.color} />
            </div>
          </div>
        </header>

        {factura.estado === "anulada" && (
          <div role="note" className="rounded-xl border-2 border-acento p-4 text-sm">
            <p className="font-semibold text-acento">Factura anulada</p>
            <p className="mt-1">{factura.motivo_anulacion}</p>
          </div>
        )}

        <div className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <p className="etiqueta text-tenue">Cliente</p>
            <p className="mt-1 font-medium">{cliente?.nombre ?? "Cliente eliminado"}</p>
            {cliente?.email && <p className="text-tenue">{cliente.email}</p>}
            {cliente?.telefono && <p className="text-tenue">{cliente.telefono}</p>}
          </div>
          <dl className="grid gap-1 sm:justify-items-end">
            <div className="flex gap-2">
              <dt className="text-tenue">Emisión</dt>
              <dd>{fecha(factura.fecha_emision)}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-tenue">Vencimiento</dt>
              <dd>{fecha(factura.fecha_vencimiento)}</dd>
            </div>
            {factura.fecha_cobro && (
              <div className="flex gap-2">
                <dt className="text-tenue">Cobro</dt>
                <dd>
                  {fecha(factura.fecha_cobro)}
                  {metodo && ` · ${metodo}`}
                </dd>
              </div>
            )}
          </dl>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] text-sm">
            <thead>
              <tr className="etiqueta border-b border-borde text-left text-tenue">
                <th className="py-2 font-medium">Descripción</th>
                <th className="py-2 text-right font-medium">Cant.</th>
                <th className="py-2 text-right font-medium">Precio</th>
                <th className="py-2 text-right font-medium">Dto.</th>
                <th className="py-2 text-right font-medium">IVA</th>
                <th className="py-2 text-right font-medium">Importe</th>
              </tr>
            </thead>
            <tbody>
              {lineas.map((linea) => (
                <tr key={linea.id} className="border-b border-borde align-top">
                  <td className="py-2.5 pr-3">{linea.descripcion}</td>
                  <td className="cifra py-2.5 text-right">{linea.cantidad}</td>
                  <td className="cifra py-2.5 text-right">{euros(linea.precio_unitario)}</td>
                  <td className="cifra py-2.5 text-right">{linea.descuento > 0 ? `${linea.descuento} %` : "—"}</td>
                  <td className="cifra py-2.5 text-right">{linea.iva} %</td>
                  <td className="cifra py-2.5 text-right font-medium">{euros(linea.importe)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <dl className="ml-auto grid w-full max-w-xs gap-1 text-sm">
          <div className="flex justify-between">
            <dt className="text-tenue">Base imponible</dt>
            <dd className="cifra">{euros(resumen.base)}</dd>
          </div>
          {resumen.porIva.map((grupo) => (
            <div key={grupo.iva} className="flex justify-between">
              <dt className="text-tenue">
                IVA {grupo.iva} % sobre {euros(grupo.base)}
              </dt>
              <dd className="cifra">{euros(grupo.cuota)}</dd>
            </div>
          ))}
          <div className="flex justify-between border-t border-borde pt-1 text-base font-semibold">
            <dt>Total</dt>
            <dd className="cifra">{euros(factura.total)}</dd>
          </div>
        </dl>
      </article>
    </div>
  );
}
