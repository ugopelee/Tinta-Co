"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  Leyenda,
  TarjetaTooltip,
  cursorColumna,
  ejeX,
  ejeY,
  rejilla,
  tramoApilado,
  type Serie,
} from "@/components/graficos";

export type MesFacturado = {
  etiqueta: string;
  cobrado: number;
  pendiente: number;
};

// Lo que ya está en caja va en negro, el color fuerte del panel; lo que
// falta por cobrar, en la lima de acento, encima.
const SERIES: Serie[] = [
  { clave: "cobrado", nombre: "Cobrado", color: "var(--texto)" },
  { clave: "pendiente", nombre: "Pendiente", color: "var(--lima)" },
];

const TRAMOS = tramoApilado(SERIES.map((serie) => serie.clave));

const euros = (valor: number) =>
  valor.toLocaleString("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });

/** Eje compacto: «1,2 mil €» ocupa menos que «1.200 €» y se lee igual. */
const eurosCortos = (valor: number) =>
  valor >= 1000
    ? `${(valor / 1000).toLocaleString("es-ES", { maximumFractionDigits: 1 })}k`
    : String(valor);

export function GraficoFacturacion({ datos }: { datos: MesFacturado[] }) {
  const cobradoPeriodo = datos.reduce((suma, mes) => suma + mes.cobrado, 0);
  const actual = datos.at(-1)?.cobrado ?? 0;
  const anterior = datos.at(-2)?.cobrado ?? 0;
  // El mes en curso está a medias: comparado vacío daría siempre «-100 %».
  const variacion =
    anterior && actual ? Math.round(((actual - anterior) / anterior) * 100) : null;

  return (
    <figure className="m-0">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-tenue">Cobrado en seis meses</p>
          <p className="titular cifra mt-1 text-[2rem] leading-none">
            {euros(cobradoPeriodo)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {variacion !== null && (
            <span
              className={
                variacion >= 0
                  ? "chip-lima cifra"
                  : "cifra rounded-full bg-acento/10 px-3 py-1 text-[0.8125rem] font-medium text-acento"
              }
            >
              {variacion >= 0 ? "+" : ""}
              {variacion}% vs. mes anterior
            </span>
          )}
          <Leyenda series={SERIES} />
        </div>
      </div>

      <div
        className="h-64"
        role="img"
        aria-label={`Facturación por mes. ${datos
          .map((mes) => `${mes.etiqueta}: ${euros(mes.cobrado)} cobrado, ${euros(mes.pendiente)} pendiente`)
          .join(". ")}`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={datos} barCategoryGap="32%" margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
            <CartesianGrid {...rejilla} />
            <XAxis dataKey="etiqueta" {...ejeX} tickFormatter={(mes: string) => mes.charAt(0).toUpperCase() + mes.slice(1)} />
            <YAxis {...ejeY} tickFormatter={eurosCortos} />
            <Tooltip
              cursor={cursorColumna}
              content={(props) => <TarjetaTooltip {...props} series={SERIES} formato={euros} />}
            />
            {SERIES.map((serie) => (
              <Bar
                key={serie.clave}
                dataKey={serie.clave}
                name={serie.nombre}
                stackId="caja"
                fill={serie.color}
                shape={TRAMOS[serie.clave]}
                maxBarSize={44}
                animationDuration={700}
                animationEasing="ease-out"
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}
