import Link from "next/link";
import type { Metadata } from "next";
import { crearClienteServidor } from "@tinta/compartido/supabase/servidor";
import { estadosFacturaProveedor, type EstadoFacturaProveedor } from "@tinta/compartido/estudio";
import type { FacturaEntrante, FacturaProveedor } from "@tinta/compartido/tipos";
import { Bloque } from "@/components/Bloque";
import { ColaFacturasEntrantes } from "@/components/ColaFacturasEntrantes";
import { Encabezado } from "@/components/Encabezado";
import { PastillaColor } from "@/components/PastillaColor";
import { RevisionFacturaProveedor } from "@/components/RevisionFacturaProveedor";
import { SubirFacturasProveedor } from "@/components/SubirFacturasProveedor";
import { euros } from "@/lib/importes";
import { fecha } from "@/lib/fechas";

export const metadata: Metadata = { title: "Facturas de proveedores" };

/** Las que se listan por pestaña; las ya resueltas se acumulan sin fin. */
const FACTURAS_VISIBLES = 50;

export default async function FacturasProveedor({ searchParams }: PageProps<"/facturacion/proveedores">) {
  const { estado: parametro } = await searchParams;
  const estado: EstadoFacturaProveedor =
    estadosFacturaProveedor.find((e) => e.id === parametro)?.id ?? "por_revisar";

  const supabase = await crearClienteServidor();
  const [{ data }, { data: cola }, ...cuentas] = await Promise.all([
    supabase
      .from("facturas_proveedor")
      .select("*")
      .eq("estado", estado)
      .order("fecha", { ascending: false })
      .limit(FACTURAS_VISIBLES),
    supabase.from("facturas_entrantes").select("*").order("created_at"),
    ...estadosFacturaProveedor.map((e) =>
      supabase.from("facturas_proveedor").select("id", { count: "exact", head: true }).eq("estado", e.id),
    ),
  ]);
  const facturas = (data ?? []) as FacturaProveedor[];
  const entrantes = (cola ?? []) as FacturaEntrante[];
  const actual = estadosFacturaProveedor.find((e) => e.id === estado)!;

  return (
    <>
      <Encabezado
        miga="Caja · proveedores"
        titulo="Facturas de proveedores"
        nota="Sube aquí las facturas y el agente de IA las lee. Puede equivocarse: contrasta cada dato con el original antes de validar."
      />

      <SubirFacturasProveedor />
      <ColaFacturasEntrantes entrantes={entrantes} />

      <nav aria-label="Estado de las facturas" className="mb-3 flex flex-wrap gap-2">
        {estadosFacturaProveedor.map((e, indice) => (
          <Link
            key={e.id}
            href={`/facturacion/proveedores?estado=${e.id}`}
            aria-current={e.id === estado ? "page" : undefined}
            className={`rounded-full px-4 py-1.5 text-sm transition-colors duration-200 ${
              e.id === estado
                ? "bg-texto font-medium text-fondo"
                : "bg-superficie text-texto/80 hover:bg-superficie-alta hover:text-texto"
            }`}
          >
            {e.nombre} <span className="cifra opacity-70">{cuentas[indice].count ?? 0}</span>
          </Link>
        ))}
      </nav>

      {facturas.length === 0 ? (
        <Bloque icono="tarjeta" titulo={actual.nombre}>
          <p className="text-sm text-tenue">
            {estado === "por_revisar"
              ? "No hay facturas por revisar. Sube los PDF o las fotos de las facturas con el botón de arriba y el agente las leerá."
              : `No hay facturas ${actual.nombre.toLowerCase()}.`}
          </p>
        </Bloque>
      ) : (
        <ul className="grid gap-3">
          {facturas.map((factura) => (
            <li key={factura.id}>
              <section className="tarjeta overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4">
                  <div className="min-w-0">
                    <p className="font-semibold">{factura.proveedor}</p>
                    <p className="text-[0.8125rem] text-tenue">
                      {factura.nif ?? "Sin NIF"} · <span className="cifra">{factura.numero}</span> · {fecha(factura.fecha)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="cifra font-medium">{euros(Number(factura.total))}</span>
                    <PastillaColor nombre={actual.nombre} color={actual.color} />
                    <a
                      href={`/facturas-proveedor/${factura.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium underline-offset-4 hover:underline"
                    >
                      Ver original
                      <span className="sr-only"> de la factura {factura.numero} (se abre en una pestaña nueva)</span>
                    </a>
                  </div>
                </div>
                {estado === "por_revisar" ? <RevisionFacturaProveedor factura={factura} /> : <div className="pb-4" />}
              </section>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
