import { estadosCita } from "@/config/estudio";

/**
 * El CRM consulta sesión, perfil y datos antes de poder pintar nada. Sin
 * esto la pantalla se queda en negro mientras tanto y parece colgada.
 */
export default function Cargando() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse px-6 py-10">
      <div className="mb-10">
        <div className="h-8 w-56 rounded bg-superficie-alta" />
        <div className="mt-3 h-4 w-80 rounded bg-superficie" />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {estadosCita.map((columna) => (
          <div
            key={columna.id}
            className="rounded-xl border border-borde bg-superficie p-5"
          >
            <div className="h-3 w-24 rounded bg-superficie-alta" />
            <div className="mt-4 h-9 w-12 rounded bg-superficie-alta" />
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-4">
        {estadosCita.map((columna) => (
          <div
            key={columna.id}
            className="min-h-40 rounded-xl border border-borde bg-superficie/50 p-4"
          >
            <div className="h-4 w-20 rounded bg-superficie-alta" />
            <div className="mt-4 h-28 rounded-lg bg-superficie-alta" />
            <div className="mt-3 h-28 rounded-lg bg-superficie-alta/60" />
          </div>
        ))}
      </div>
    </div>
  );
}
