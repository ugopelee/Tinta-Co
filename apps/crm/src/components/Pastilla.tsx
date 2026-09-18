import { estadosCita, type EstadoCita } from "@tinta/compartido/estudio";

/**
 * El estado nunca va solo por color: el punto acompaña al nombre, para que
 * se distinga también sin percibir el matiz.
 */
export function Pastilla({ estado }: { estado: EstadoCita }) {
  const definicion = estadosCita.find((opcion) => opcion.id === estado);
  if (!definicion) return null;

  return (
    <span
      className="inline-flex items-center gap-2 whitespace-nowrap rounded-full px-2.5 py-1 text-xs"
      style={{
        color: definicion.color,
        background: `color-mix(in srgb, ${definicion.color} 12%, transparent)`,
        border: `1px solid color-mix(in srgb, ${definicion.color} 28%, transparent)`,
      }}
    >
      <span
        aria-hidden
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: definicion.color }}
      />
      {definicion.nombre}
    </span>
  );
}
