"use client";

import { PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer } from "recharts";

/**
 * Media luna con Recharts: un arco sobre su pista gris, con la cifra en el
 * centro. La escala va fija de 0 a 100 para que el arco diga «por dónde va»
 * aunque no se lea el número.
 */
export function Medidor({
  porcentaje,
  etiqueta,
  pie,
}: {
  porcentaje: number;
  etiqueta: string;
  pie: { texto: string; detalle: string };
}) {
  const valor = Math.max(0, Math.min(100, Math.round(porcentaje)));

  return (
    <section className="tarjeta p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold tracking-tight">Cobro</h2>
        <span className="chip-lima cifra">{pie.detalle} cobradas</span>
      </div>

      <div
        className="relative mx-auto mt-3 h-32 w-full max-w-[16rem]"
        role="img"
        aria-label={`${etiqueta}: ${valor}%`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            data={[{ valor }]}
            startAngle={180}
            endAngle={0}
            cy="100%"
            // El radio máximo de Recharts es la mitad del lado corto (el alto);
            // con el centro abajo, el arco cabe entero al doble de eso.
            innerRadius="158%"
            outerRadius="196%"
          >
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} axisLine={false} />
            <RadialBar
              dataKey="valor"
              cornerRadius={9}
              fill="var(--texto)"
              background={{ fill: "var(--superficie-alta)" }}
              animationDuration={900}
              animationEasing="ease-out"
              isAnimationActive
            />
          </RadialBarChart>
        </ResponsiveContainer>

        <p className="titular cifra absolute inset-x-0 bottom-0 text-center text-[2.25rem] leading-none">
          {valor}
          <span className="text-lg text-tenue">%</span>
        </p>
      </div>

      <p className="mt-2 text-center text-sm text-tenue">{etiqueta}</p>

      <div className="fila mt-4 flex items-center justify-between gap-3 px-4 py-3">
        <p className="truncate text-sm font-medium">{pie.texto}</p>
        <p className="cifra shrink-0 text-sm text-tenue">{pie.detalle}</p>
      </div>
    </section>
  );
}
