import Link from "next/link";
import type { Metadata } from "next";
import { crearClienteServidor } from "@tinta/compartido/supabase/servidor";
import type { Cliente } from "@tinta/compartido/tipos";
import { Icono } from "@/components/Icono";

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
    <div className="px-4 py-6 lg:px-6 lg:py-7">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="titular text-xl lg:text-[1.375rem]">Clientes</h1>
          <p className="mt-1 text-sm text-tenue">
            {busqueda
              ? `${clientes.length} ${clientes.length === 1 ? "resultado" : "resultados"} para «${busqueda}»`
              : `${clientes.length} ${clientes.length === 1 ? "ficha" : "fichas"} en el estudio`}
          </p>
        </div>

        {busqueda && (
          <Link href="/clientes" className="boton-fantasma">
            Quitar el filtro
          </Link>
        )}
      </header>

      {clientes.length === 0 ? (
        <p className="tarjeta p-8 text-sm text-tenue">
          {busqueda
            ? "Ningún cliente coincide con esa búsqueda."
            : "Todavía no hay clientes registrados."}
        </p>
      ) : (
        <ul className="tarjeta overflow-hidden">
          {clientes.map((cliente) => (
            <li key={cliente.id} className="border-b border-borde last:border-b-0">
              <Link
                href={`/clientes/${cliente.id}`}
                className="group flex items-center gap-4 px-4 py-3 transition-colors duration-200 hover:bg-superficie-alta"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-superficie-alta text-xs text-tenue">
                  {iniciales(cliente.nombre)}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{cliente.nombre}</p>
                  <p className="mt-0.5 truncate text-xs text-tenue">
                    {cliente.email}
                    {cliente.telefono && ` · ${cliente.telefono}`}
                  </p>
                </div>

                <span className="cifra shrink-0 rounded-full border border-borde px-2.5 py-1 text-xs text-tenue">
                  {cliente.citas.length}{" "}
                  {cliente.citas.length === 1 ? "cita" : "citas"}
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
    </div>
  );
}
