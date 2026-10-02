/**
 * Pastilla de estado para lo que no es una cita (empleados, vacaciones,
 * nóminas). Mismo aro hueco que `Pastilla`: el color nunca va solo.
 */
export function PastillaColor({ nombre, color }: { nombre: string; color: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-superficie-alta px-2.5 py-1 text-xs font-medium">
      <span aria-hidden className="h-2.5 w-2.5 rounded-full border-2" style={{ borderColor: color }} />
      {nombre}
    </span>
  );
}
