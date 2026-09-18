import Link from "next/link";
import type { Metadata } from "next";
import { crearClienteServidor } from "@tinta/compartido/supabase/servidor";
import type { Cliente } from "@tinta/compartido/tipos";

export const metadata: Metadata = { title: "Clientes" };

type ClienteConCitas = Cliente & { citas: { id: string }[] };

export default async function Clientes() {
  const supabase = await crearClienteServidor();

  const { data } = await supabase
    .from("clientes")
    .select("*, citas(id)")
    .order("created_at", { ascending: false });

  const clientes = (data ?? []) as ClienteConCitas[];

  return (
    <div className="px-6 py-8 lg:px-10">
      <div className="mb-8">
        <h1 className="titular text-3xl">Clientes</h1>
        <p className="mt-2 text-sm text-tenue">
          {clientes.length} {clientes.length === 1 ? "ficha" : "fichas"} en el
          estudio.
        </p>
      </div>

      {clientes.length === 0 ? (
        <p className="rounded-xl border border-borde bg-superficie p-8 text-tenue">
          Todavía no hay clientes registrados.
        </p>
      ) : (
        <ul className="overflow-hidden rounded-xl border border-borde">
          {clientes.map((cliente) => (
            <li key={cliente.id} className="border-b border-borde last:border-b-0">
              <Link
                href={`/clientes/${cliente.id}`}
                className="flex flex-wrap items-center justify-between gap-4 bg-superficie px-5 py-4 transition-colors duration-300 hover:bg-superficie-alta"
              >
                <div className="min-w-0">
                  <p className="font-medium">{cliente.nombre}</p>
                  <p className="mt-1 truncate text-sm text-tenue">
                    {cliente.email}
                    {cliente.telefono && ` · ${cliente.telefono}`}
                  </p>
                </div>

                <div className="flex items-center gap-6">
                  <span className="etiqueta text-tenue">
                    {cliente.citas.length}{" "}
                    {cliente.citas.length === 1 ? "cita" : "citas"}
                  </span>
                  <span aria-hidden className="text-tenue">
                    →
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
