import type { Metadata } from "next";
import { crearClienteServidor } from "@tinta/compartido/supabase/servidor";
import { Kanban, type CitaTablero } from "@/components/Kanban";

export const metadata: Metadata = { title: "Citas" };

export default async function Citas() {
  const supabase = await crearClienteServidor();

  const { data, error } = await supabase
    .from("citas")
    .select("*, disenos(nombre)")
    .order("posicion", { ascending: false });

  const citas = (data ?? []) as CitaTablero[];

  return (
    <div className="px-6 py-8 lg:px-10">
      <div className="mb-8">
        <h1 className="titular text-3xl">Citas</h1>
        <p className="mt-2 text-sm text-tenue">
          Arrastra una cita para cambiar su estado, o usa el desplegable de cada
          tarjeta.
        </p>
      </div>

      {error ? (
        <p className="rounded-xl border border-borde bg-superficie p-8 text-tenue">
          No se han podido cargar las citas.
        </p>
      ) : (
        <Kanban citas={citas} />
      )}
    </div>
  );
}
