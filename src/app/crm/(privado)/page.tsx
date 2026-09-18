import { crearClienteServidor } from "@/lib/supabase/server";
import { Kanban, type CitaTablero } from "@/components/crm/Kanban";

export default async function Tablero() {
  const supabase = await crearClienteServidor();

  const { data, error } = await supabase
    .from("citas")
    .select("*, disenos(nombre)")
    .order("posicion", { ascending: false });

  const citas = (data ?? []) as CitaTablero[];

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-10">
        <h1 className="titular text-3xl">Tablero de citas</h1>
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
