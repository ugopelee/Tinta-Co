/**
 * Trazos del monograma del estudio (la T dentro de la gota de tinta), en un
 * lienzo de 200 × 240. Viven aparte del SVG porque los lienzos de la portada
 * los reutilizan con Path2D para convertir la marca en partículas.
 */
export const TRAZOS_MONOGRAMA = [
  // Gota
  { d: "M100 34c26 38 44 62 44 88a44 44 0 1 1-88 0c0-26 18-50 44-88Z", grosor: 1.2, opacidad: 1 },
  { d: "M100 58c20 30 34 48 34 68a34 34 0 1 1-68 0c0-20 14-38 34-68Z", grosor: 1.2, opacidad: 0.55 },
  // Serifa de la T, cortada por la gota
  { d: "M46 34h108", grosor: 2.4, opacidad: 1 },
  { d: "M46 34v24M154 34v24", grosor: 1.2, opacidad: 0.7 },
  { d: "M100 34v156", grosor: 2.4, opacidad: 1 },
  // Punta de la aguja
  { d: "M100 150l-7 22h14Z", grosor: 1.2, opacidad: 0.8 },
  { d: "M100 190v16", grosor: 1.2, opacidad: 0.5 },
] as const;

/**
 * El monograma como textura de fondo. Va en SVG y no como imagen para poder
 * teñirlo con la paleta y dejarlo casi invisible sin que se vea un recorte.
 */
export function MarcaDeAgua({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 240"
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
    >
      {TRAZOS_MONOGRAMA.map((trazo) => (
        <path
          key={trazo.d}
          d={trazo.d}
          strokeWidth={trazo.grosor}
          strokeOpacity={trazo.opacidad}
        />
      ))}
    </svg>
  );
}
