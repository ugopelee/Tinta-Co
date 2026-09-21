/**
 * El panel consulta sesión, perfil y datos antes de poder pintar nada. Sin
 * esto la pantalla se queda vacía mientras tanto y parece colgada.
 */
export default function Cargando() {
  return (
    <div className="animate-pulse px-4 py-6 lg:px-6 lg:py-7">
      <div className="mb-6">
        <div className="h-6 w-56 rounded bg-superficie-alta" />
        <div className="mt-2 h-4 w-72 rounded bg-superficie" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((casilla) => (
          <div
            key={casilla}
            className="tarjeta p-5"
          >
            <div className="h-3 w-24 rounded bg-superficie-alta" />
            <div className="mt-4 h-8 w-16 rounded bg-superficie-alta" />
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.7fr_1fr]">
        <div className="tarjeta h-72" />
        <div className="tarjeta h-72" />
      </div>
    </div>
  );
}
