"use client";

import { Rectangle, type BarShapeProps } from "recharts";

/**
 * Piezas comunes de los gráficos del panel (Recharts). Todos comparten ejes
 * sin línea, rejilla horizontal punteada y la misma tarjeta flotante, para
 * que se lean como un solo sistema.
 */

export const ejeX = {
  axisLine: false,
  tickLine: false,
  tickMargin: 10,
  tick: { fill: "var(--tenue)", fontSize: 12 },
} as const;

export const ejeY = {
  axisLine: false,
  tickLine: false,
  width: 44,
  tickMargin: 6,
  tick: { fill: "var(--tenue)", fontSize: 12 },
} as const;

export const rejilla = {
  vertical: false,
  stroke: "var(--borde)",
  strokeDasharray: "3 6",
} as const;

/** Columna resaltada bajo el puntero: gris suave con las esquinas redondas. */
export const cursorColumna = { fill: "var(--superficie-alta)", radius: 10 } as const;

export type Serie = { clave: string; nombre: string; color: string };

export function Leyenda({ series }: { series: Serie[] }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[0.8125rem]">
      {series.map((serie) => (
        <li key={serie.clave} className="flex items-center gap-1.5 text-tenue">
          <span
            aria-hidden
            className="h-2.5 w-2.5 rounded-full"
            style={{ background: serie.color }}
          />
          {serie.nombre}
        </li>
      ))}
    </ul>
  );
}

type Entrada = { dataKey?: unknown; value?: unknown };

/** Tarjeta del tooltip: título, una fila por serie con valor y total. */
export function TarjetaTooltip({
  active,
  payload,
  label,
  series,
  formato = (valor) => valor.toLocaleString("es-ES"),
}: {
  active?: boolean;
  payload?: readonly Entrada[];
  label?: unknown;
  series: Serie[];
  formato?: (valor: number) => string;
}) {
  if (!active || !payload?.length) return null;

  const valores = series.map((serie) => ({
    ...serie,
    valor: Number(payload.find((entrada) => entrada.dataKey === serie.clave)?.value ?? 0),
  }));
  const total = valores.reduce((suma, serie) => suma + serie.valor, 0);

  return (
    <div className="min-w-[11rem] rounded-2xl bg-superficie p-3 text-[0.8125rem] shadow-[0_8px_30px_rgb(0_0_0/0.12)] ring-1 ring-borde">
      <p className="mb-2 font-semibold capitalize">{String(label)}</p>
      <ul className="space-y-1">
        {valores.map((serie) => (
          <li key={serie.clave} className="flex items-center gap-2">
            <span
              aria-hidden
              className="h-2 w-2 rounded-full"
              style={{ background: serie.color }}
            />
            <span className="text-tenue">{serie.nombre}</span>
            <span className="cifra ml-auto pl-4 font-medium">{formato(serie.valor)}</span>
          </li>
        ))}
      </ul>
      {series.length > 1 && (
        <p className="mt-2 flex justify-between border-t border-borde pt-2">
          <span className="text-tenue">Total</span>
          <span className="cifra font-semibold">{formato(total)}</span>
        </p>
      )}
    </div>
  );
}

/**
 * En una pila solo se redondea el tramo de arriba de cada columna, que
 * cambia mes a mes según qué series tengan valor. El trazo del color de la
 * tarjeta abre un hueco fino entre tramos sin tener que calcularlo.
 */
export function tramoApilado(claves: string[], radio = 8) {
  return Object.fromEntries(
    claves.map((clave, propia) => {
      function Tramo(props: BarShapeProps) {
        const fila = props.payload as Record<string, number>;
        const esCima = claves.slice(propia + 1).every((otra) => !fila[otra]);

        return (
          <Rectangle
            {...props}
            radius={esCima ? [radio, radio, 0, 0] : 0}
            stroke="var(--superficie)"
            strokeWidth={2}
          />
        );
      }

      return [clave, Tramo];
    }),
  );
}
