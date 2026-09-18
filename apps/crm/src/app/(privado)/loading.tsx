/**
 * El panel consulta sesión, perfil y datos antes de poder pintar nada. Sin
 * esto la pantalla se queda vacía mientras tanto y parece colgada.
 */
export default function Cargando() {
  return (
    <div className="animate-pulse px-6 py-8 lg:px-10">
      <div className="mb-8">
        <div className="h-8 w-48 rounded bg-superficie-alta" />
        <div className="mt-3 h-4 w-72 rounded bg-superficie" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((casilla) => (
          <div
            key={casilla}
            className="rounded-xl border border-borde bg-superficie p-5"
          >
            <div className="h-3 w-24 rounded bg-superficie-alta" />
            <div className="mt-4 h-9 w-16 rounded bg-superficie-alta" />
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="h-72 rounded-xl border border-borde bg-superficie" />
        <div className="h-72 rounded-xl border border-borde bg-superficie" />
      </div>
    </div>
  );
}
