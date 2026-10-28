import Link from "next/link";
import type { Metadata } from "next";
import { crearClienteServidor } from "@tinta/compartido/supabase/servidor";
import { estadosVenta, type EstadoVenta } from "@tinta/compartido/estudio";
import { Encabezado } from "@/components/Encabezado";
import { Icono } from "@/components/Icono";
import { PastillaColor } from "@/components/PastillaColor";
import { euros, totales } from "@/lib/importes";

export const metadata: Metadata = { title: "Ventas" };

type FilaVenta = {
  id: string;
  numero: string;
  estado: EstadoVenta;
  fecha: string;
  clientes: { nombre: string } | null;
  lineas_venta: { cantidad: number; precio_unitario: number; descuento: number; iva: number }[];
};

const fecha = (valor: string) =>
  new Date(valor).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });

export default async function Ventas({ searchParams }: PageProps<"/ventas">) {
  const { estado } = await searchParams;
  const filtro = estadosVenta.find((e) => e.id === estado)?.id;

  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("ventas")
    .select("id, numero, estado, fecha, clientes(nombre), lineas_venta(cantidad, precio_unitario, descuento, iva)")
    .order("created_at", { ascending: false });

  // Un estudio pequeño: se trae todo y se filtra aquí, así los contadores de
  // cada pestaña salen de la misma consulta.
  const ventas = ((data ?? []) as unknown as FilaVenta[]).map((venta) => ({
    ...venta,
    total: totales(
      venta.lineas_venta.map((l) => ({
        cantidad: Number(l.cantidad),
        precio_unitario: Number(l.precio_unitario),
        descuento: Number(l.descuento),
        iva: Number(l.iva),
      })),
    ).total,
  }));
  const visibles = filtro ? ventas.filter((venta) => venta.estado === filtro) : ventas;

  const pestanas = [
    { href: "/ventas", texto: "Todas", cuenta: ventas.length, activa: !filtro },
    ...estadosVenta.map((e) => ({
      href: `/ventas?estado=${e.id}`,
      texto: e.nombre,
      cuenta: ventas.filter((venta) => venta.estado === e.id).length,
      activa: filtro === e.id,
    })),
  ];

  return (
    <>
      <Encabezado
        miga="Caja · ventas"
        titulo="Ventas"
        nota="Presupuestos que, al confirmarse, pasan a venta y después se facturan."
      >
        <Link href="/ventas/nueva" className="boton !px-4 !py-2">
          <Icono nombre="mas" className="h-4 w-4" />
          Nuevo presupuesto
        </Link>
      </Encabezado>

      <nav aria-label="Filtrar por estado" className="mb-3 flex flex-wrap gap-2">
        {pestanas.map((pestana) => (
          <Link
            key={pestana.href}
            href={pestana.href}
            aria-current={pestana.activa ? "page" : undefined}
            className={`rounded-full px-3.5 py-1.5 text-sm transition-colors duration-200 ${
              pestana.activa ? "bg-texto font-medium text-fondo" : "bg-superficie-alta text-tenue hover:text-texto"
            }`}
          >
            {pestana.texto} <span className="cifra">{pestana.cuenta}</span>
          </Link>
        ))}
      </nav>

      {visibles.length === 0 ? (
        <p className="tarjeta p-8 text-center text-sm text-tenue">
          {ventas.length === 0
            ? "Todavía no hay presupuestos. Crea el primero con «Nuevo presupuesto»."
            : "No hay ventas en este estado."}
        </p>
      ) : (
        <ul className="grid gap-2">
          {visibles.map((venta) => {
            const datos = estadosVenta.find((e) => e.id === venta.estado)!;
            return (
              <li key={venta.id}>
                <Link
                  href={`/ventas/${venta.id}`}
                  className="tarjeta flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3.5 transition-colors duration-200 hover:bg-superficie-alta"
                >
                  <span className="cifra w-28 shrink-0 text-sm font-semibold">{venta.numero}</span>
                  <span className="min-w-0 flex-1 truncate text-sm">{venta.clientes?.nombre ?? "Cliente eliminado"}</span>
                  <span className="text-xs text-tenue">{fecha(venta.fecha)}</span>
                  <PastillaColor nombre={datos.nombre} color={datos.color} />
                  <span className="cifra w-28 text-right text-sm font-medium">{euros(venta.total)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
