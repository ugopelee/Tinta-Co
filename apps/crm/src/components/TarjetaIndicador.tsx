import { Icono, type NombreIcono } from "@/components/Icono";

/**
 * Indicador de cabecera: rótulo con icono, cifra y variación. Sin gráfico
 * en miniatura a propósito — cuatro sparklines seguidas compiten con el
 * gráfico grande de abajo y no aportan ninguna lectura nueva.
 */
export function TarjetaIndicador({
  icono,
  etiqueta,
  valor,
  sufijo = "",
  variacion,
  nota,
  subirEsMalo = false,
}: {
  icono: NombreIcono;
  etiqueta: string;
  valor: number;
  sufijo?: string;
  variacion: number | null;
  nota: string;
  /** En «sin responder» o «pendiente de cobro», subir no es una buena noticia. */
  subirEsMalo?: boolean;
}) {
  const sube = (variacion ?? 0) >= 0;
  const bien = subirEsMalo ? !sube : sube;

  return (
    <article className="tarjeta p-5 transition-colors duration-300 hover:border-tenue/40">
      <div className="flex items-center gap-2.5">
        <Icono nombre={icono} className="h-4 w-4 shrink-0 text-tenue" />
        <p className="truncate text-sm text-tenue">{etiqueta}</p>
      </div>

      <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p className="titular cifra text-[2rem] leading-none">
          {valor.toLocaleString("es-ES")}
          <span className="ml-0.5 text-xl text-tenue">{sufijo}</span>
        </p>

        {variacion !== null && (
          <span
            className="flex items-center gap-1 text-xs"
            style={{ color: bien ? "#57a86f" : "#c2452f" }}
          >
            <span aria-hidden>{sube ? "↑" : "↓"}</span>
            {sube ? "+" : ""}
            {variacion}%
          </span>
        )}
      </div>

      <p className="mt-2 text-xs text-tenue">{nota}</p>
    </article>
  );
}
