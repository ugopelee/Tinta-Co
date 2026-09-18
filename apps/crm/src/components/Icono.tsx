export type NombreIcono =
  | "panel"
  | "calendario"
  | "personas"
  | "llave"
  | "enlace"
  | "salir"
  | "flecha"
  | "reloj"
  | "nota"
  | "euro";

const TRAZOS: Record<NombreIcono, string> = {
  panel: "M3 3h7v8H3zM14 3h7v5h-7zM14 11h7v10h-7zM3 14h7v7H3z",
  calendario: "M4 6h16v14H4zM4 10h16M9 3v4M15 3v4",
  personas:
    "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM2.5 20a6.5 6.5 0 0 1 13 0M17 11.5a3 3 0 1 0 0-6M18 20a6 6 0 0 0-2-4.5",
  llave:
    "M14.5 4a5.5 5.5 0 1 1-4.3 8.9L4 19.1V21h3v-2h2v-2h2l1.2-1.2A5.5 5.5 0 0 1 14.5 4ZM16 8.5h.01",
  enlace: "M10 14 20 4M14 4h6v6M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5",
  salir: "M9 21H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h4M16 16l5-4-5-4M21 12H9",
  flecha: "M5 12h14M13 6l6 6-6 6",
  reloj: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3.5 2",
  nota: "M5 3h9l5 5v13H5zM14 3v5h5M8 13h8M8 17h5",
  euro: "M17 5.5A6.5 6.5 0 0 0 7.5 12a6.5 6.5 0 0 0 9.5 6.5M4 10h8M4 14h8",
};

/** Iconos de trazo, dibujados a mano para no arrastrar una librería. */
export function Icono({
  nombre,
  className = "",
}: {
  nombre: NombreIcono;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={TRAZOS[nombre]} />
    </svg>
  );
}
