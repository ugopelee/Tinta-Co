/**
 * El monograma del estudio (la T dentro de la gota de tinta) como textura de
 * fondo. Va en SVG y no como imagen para poder teñirlo con la paleta y
 * dejarlo casi invisible sin que se vea un recorte pegado encima.
 */
export function MarcaDeAgua({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 240"
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
    >
      {/* Gota */}
      <path d="M100 34c26 38 44 62 44 88a44 44 0 1 1-88 0c0-26 18-50 44-88Z" />
      <path
        d="M100 58c20 30 34 48 34 68a34 34 0 1 1-68 0c0-20 14-38 34-68Z"
        strokeOpacity=".55"
      />

      {/* Serifa de la T, cortada por la gota */}
      <path d="M46 34h108" strokeWidth="2.4" />
      <path d="M46 34v24M154 34v24" strokeOpacity=".7" />
      <path d="M100 34v156" strokeWidth="2.4" />

      {/* Punta de la aguja */}
      <path d="M100 150l-7 22h14Z" strokeOpacity=".8" />
      <path d="M100 190v16" strokeOpacity=".5" />
    </svg>
  );
}
