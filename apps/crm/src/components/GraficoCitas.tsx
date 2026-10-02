"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { estadosCita } from "@tinta/compartido/estudio";
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

export type PuntoMes = {
  etiqueta: string;
  /** Recuento por estado, en el mismo orden que `estadosCita`. */
  valores: number[];
};

const SERIES: Serie[] = estadosCita.map((estado) => ({
  clave: estado.id,
  nombre: estado.nombre,
  color: estado.color,
}));

const CLAVES = SERIES.map((serie) => serie.clave);
const TRAMOS = tramoApilado(CLAVES);

/** Columnas apiladas por estado: cuánto entra cada mes y cómo acaba. */
export function GraficoCitas({ datos }: { datos: PuntoMes[] }) {
  const filas = datos.map((punto) => ({
    etiqueta: punto.etiqueta,
    ...Object.fromEntries(CLAVES.map((clave, indice) => [clave, punto.valores[indice] ?? 0])),
  }));

  const total = datos.reduce(
    (suma, punto) => suma + punto.valores.reduce((a, b) => a + b, 0),
    0,
  );

  return (
    <figure className="m-0">
      <div className="mb-4">
        <Leyenda series={SERIES} />
      </div>

      <div
        className="h-64"
        role="img"
        aria-label={`Oportunidades por mes y estado. ${filas
          .map((fila, indice) => `${fila.etiqueta}: ${datos[indice].valores.reduce((a, b) => a + b, 0)}`)
          .join(". ")}`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={filas} barCategoryGap="32%" margin={{ top: 8, right: 4, left: -12, bottom: 0 }}>
            <CartesianGrid {...rejilla} />
            <XAxis dataKey="etiqueta" {...ejeX} tickFormatter={(mes: string) => mes.charAt(0).toUpperCase() + mes.slice(1)} />
            <YAxis {...ejeY} allowDecimals={false} />
            <Tooltip cursor={cursorColumna} content={(props) => <TarjetaTooltip {...props} series={SERIES} />} />
            {SERIES.map((serie) => (
              <Bar
                key={serie.clave}
                dataKey={serie.clave}
                name={serie.nombre}
                stackId="estados"
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

      {total === 0 && (
        <figcaption className="mt-2 text-center text-sm text-tenue">
          Todavía no ha entrado ninguna oportunidad en estos meses.
        </figcaption>
      )}
    </figure>
  );
}
