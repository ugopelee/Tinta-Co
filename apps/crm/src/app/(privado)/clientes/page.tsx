import Link from "next/link";
import type { Metadata } from "next";
import { crearClienteServidor } from "@tinta/compartido/supabase/servidor";
import type { Cliente } from "@tinta/compartido/tipos";
import { Icono } from "@/components/Icono";
import { Encabezado } from "@/components/Encabezado";

export const metadata: Metadata = { title: "Clientes" };

type ClienteConCitas = Cliente & { citas: { id: string }[] };

/**
 * El texto entra en un filtro `or` de PostgREST, que se parsea como lista:
 * una coma o un paréntesis sueltos romperían la consulta, así que se van.
 */
const limpiar = (texto: string) => texto.replace(/[,()%\\*]/g, " ").trim();

const iniciales = (nombre: string) =>
  nombre
    .split(" ")
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? "")
    .join("") || "·";

export default async function Clientes({
  searchParams,
}: PageProps<"/clientes">) {
  const { q } = await searchParams;
  const busqueda = limpiar(typeof q === "string" ? q : "");

  const supabase = await crearClienteServidor();

  let consulta = supabase
    .from("clientes")
    .select("*, citas(id)")
    .order("created_at", { ascending: false });

  if (busqueda) {
    consulta = consulta.or(
      `nombre.ilike.%${busqueda}%,email.ilike.%${busqueda}%,telefono.ilike.%${busqueda}%`,
    );
  }

  const { data } = await consulta;
  const clientes = (data ?? []) as ClienteConCitas[];

  return (
    <>
      <Encabezado
        miga={busqueda ? "Clientes · búsqueda" : "Estudio · fichas"}
        titulo="Clientes"
        nota={
          busqueda
            ? `${clientes.length} ${clientes.length === 1 ? "resultado" : "resultados"} para «${busqueda}»`
            : `${clientes.length} ${clientes.length === 1 ? "ficha" : "fichas"} en el estudio`
        }
      >
        <form action="/clientes" role="search" className="relative">
          <Icono
            nombre="buscar"
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-tenue"
          />
          <input
            type="search"
            name="q"
            defaultValue={busqueda}
            placeholder="Nombre, email o teléfono"
            aria-label="Buscar cliente"
            className="h-10 w-64 rounded-full bg-superficie pl-10 pr-4 text-sm outline-none placeholder:text-tenue focus:ring-2 focus:ring-texto/10"
          />
        </form>
        {busqueda && (
          <Link href="/clientes" className="segmento bg-superficie">
            Quitar el filtro
          </Link>
        )}
      </Encabezado>

      {clientes.length === 0 ? (
        <p className="tarjeta p-8 text-center text-sm text-tenue">
          {busqueda
            ? "Ningún cliente coincide con esa búsqueda."
            : "Todavía no hay clientes registrados."}
        </p>
      ) : (
        <ul className="tarjeta space-y-2 p-3">
          {clientes.map((cliente) => (
            <li key={cliente.id}>
              <Link
                href={`/clientes/${cliente.id}`}
                className="fila group flex items-center gap-4 px-4 py-3"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-texto text-xs font-semibold text-fondo">
                  {iniciales(cliente.nombre)}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{cliente.nombre}</p>
                  <p className="mt-0.5 truncate text-xs text-tenue">
                    {cliente.email}
                    {cliente.telefono && ` · ${cliente.telefono}`}
                  </p>
                </div>

                <span className="insignia cifra shrink-0">
                  {cliente.citas.length}{" "}
                  {cliente.citas.length === 1 ? "oportunidad" : "oportunidades"}
                </span>

                <Icono
                  nombre="flecha"
                  className="h-4 w-4 shrink-0 text-tenue transition-transform duration-300 group-hover:translate-x-0.5"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
