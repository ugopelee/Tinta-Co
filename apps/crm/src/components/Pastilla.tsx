import { estadosCita, type EstadoCita } from "@tinta/compartido/estudio";

/**
 * El estado nunca va solo por color: el punto acompaña al nombre, para que
 * se distinga también sin percibir el matiz.
 */
export function Pastilla({ estado }: { estado: EstadoCita }) {
  const definicion = estadosCita.find((opcion) => opcion.id === estado);
  if (!definicion) return null;

  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-superficie-alta px-2.5 py-1 text-xs font-medium">
      {/* Aro hueco del color del estado, como la leyenda de un plano. */}
      <span
        aria-hidden
        className="h-2.5 w-2.5 rounded-full border-2"
        style={{ borderColor: definicion.color }}
      />
      {definicion.nombre}
    </span>
  );
}
