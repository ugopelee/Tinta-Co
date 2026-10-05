/**
 * El panel consulta sesión, perfil y datos antes de poder pintar nada. Sin
 * esto la pantalla se queda vacía mientras tanto y parece colgada.
 */
export default function Cargando() {
  return (
    <div className="animate-pulse">
      <div className="mb-5">
        <div className="h-4 w-28 rounded-full bg-superficie" />
        <div className="mt-2 h-9 w-72 rounded-full bg-superficie" />
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.15fr_1fr]">
        <div className="space-y-3">
          <div className="tarjeta h-64" />
          <div className="tarjeta h-80" />
        </div>
        <div className="space-y-3">
          <div className="tarjeta h-72" />
          <div className="tarjeta h-48" />
        </div>
      </div>
    </div>
  );
}
