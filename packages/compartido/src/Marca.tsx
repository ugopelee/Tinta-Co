/**
 * El símbolo del estudio: una chispa de tinta sobre una aguja en cruz. Es el
 * mismo dibujo que el favicon (`app/icon.svg`), así que pestaña, web y panel
 * se reconocen como la misma casa.
 *
 * - `sello`: baldosa oscura fija, como el favicon. Se lee igual en tema claro
 *   y oscuro.
 * - `trazo`: sin baldosa; la cruz toma el color del texto que la rodea.
 */
export function Marca({
  variante = "sello",
  className,
}: {
  variante?: "sello" | "trazo";
  className?: string;
}) {
  const sello = variante === "sello";

  return (
    <svg viewBox="0 0 64 64" aria-hidden className={className}>
      {sello && <rect width="64" height="64" rx="14" fill="#08080a" />}
      <path
        d="M32 12c-1.6 3.2-4 5.6-7.2 7.2 3.2 1.6 5.6 4 7.2 7.2 1.6-3.2 4-5.6 7.2-7.2C36 17.6 33.6 15.2 32 12Z"
        fill="#c2452f"
      />
      <path
        d="M32 26v26M24 34h16"
        stroke={sello ? "#eceae4" : "currentColor"}
        strokeWidth="3.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
