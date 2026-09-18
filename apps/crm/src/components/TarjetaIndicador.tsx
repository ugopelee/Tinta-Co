/** Barras diminutas: dan la tendencia de un vistazo sin ejes ni etiquetas. */
function Chispa({ serie, color }: { serie: number[]; color: string }) {
  const maximo = Math.max(1, ...serie);
  const ancho = 64;
  const alto = 28;
  const paso = ancho / serie.length;

  return (
    <svg
      viewBox={`0 0 ${ancho} ${alto}`}
      aria-hidden
      className="h-7 w-16 shrink-0"
    >
      {serie.map((valor, indice) => {
        const altura = Math.max(2, (valor / maximo) * alto);
        return (
          <rect
            key={indice}
            x={indice * paso + 1}
            y={alto - altura}
            width={paso - 2}
            height={altura}
            rx={1.5}
            fill={color}
            opacity={indice === serie.length - 1 ? 1 : 0.45}
          />
        );
      })}
    </svg>
  );
}

export function TarjetaIndicador({
  etiqueta,
  valor,
  sufijo = "",
  serie,
  color,
  variacion,
  nota,
}: {
  etiqueta: string;
  valor: number;
  sufijo?: string;
  serie: number[];
  color: string;
  variacion: number | null;
  nota: string;
}) {
  const sube = (variacion ?? 0) >= 0;

  return (
    <article className="group rounded-xl border border-borde bg-superficie p-5 transition-colors duration-300 hover:border-white/15">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm text-tenue">{etiqueta}</p>
        <Chispa serie={serie} color={color} />
      </div>

      <p className="titular cifra mt-3 text-3xl">
        {valor.toLocaleString("es-ES")}
        <span className="ml-1 text-lg text-tenue">{sufijo}</span>
      </p>

      <div className="mt-3 flex items-center gap-2 text-xs">
        {variacion !== null && (
          <span
            className="flex items-center gap-1"
            style={{ color: sube ? "#57a86f" : "#c2452f" }}
          >
            <span aria-hidden>{sube ? "▲" : "▼"}</span>
            {sube ? "+" : ""}
            {variacion}%
          </span>
        )}
        <span className="text-tenue">{nota}</span>
      </div>
    </article>
  );
}
