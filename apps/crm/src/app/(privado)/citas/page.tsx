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
    <div className="px-4 py-6 lg:px-6 lg:py-7">
      <header className="mb-6">
        <h1 className="titular text-xl lg:text-[1.375rem]">Citas</h1>
        <p className="mt-1 text-sm text-tenue">
          Arrastra una cita para cambiar su estado, o usa el desplegable de cada
          tarjeta.
        </p>
      </header>

      {error ? (
        <p className="tarjeta p-8 text-sm text-tenue">
          No se han podido cargar las citas.
        </p>
      ) : (
        <Kanban citas={citas} />
      )}
    </div>
  );
}
