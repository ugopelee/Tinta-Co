"use client";

import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TarjetaTooltip, cursorColumna } from "@/components/graficos";

export type Porcion = { nombre: string; total: number };

const euros = (valor: number) =>
  valor.toLocaleString("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

/** Negro, lima, azul y ámbar: los colores fuertes del panel, en ese orden. */
const COLORES = ["var(--texto)", "var(--lima)", "var(--azul)", "var(--amarillo)", "var(--verde)"];

/** Rosco por método de pago, con el total en el centro y la leyenda al lado. */
export function DonutMetodos({ datos }: { datos: Porcion[] }) {
  const total = datos.reduce((suma, porcion) => suma + porcion.total, 0);

  if (!total) {
    return <p className="fila px-4 py-8 text-center text-sm text-tenue">Sin cobros en este trimestre.</p>;
  }

  return (
    <div className="flex flex-wrap items-center gap-5">
      <div
        className="relative h-44 w-44 shrink-0"
        role="img"
        aria-label={`Cobros por método: ${datos.map((p) => `${p.nombre} ${euros(p.total)}`).join(", ")}`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={datos}
              dataKey="total"
              nameKey="nombre"
              innerRadius="68%"
              outerRadius="100%"
              paddingAngle={datos.length > 1 ? 3 : 0}
              cornerRadius={6}
              stroke="none"
              animationDuration={800}
            >
              {datos.map((porcion, indice) => (
                <Cell key={porcion.nombre} fill={COLORES[indice % COLORES.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-tenue">Total</span>
          <span className="titular cifra text-lg">{euros(total)}</span>
        </div>
      </div>

      <ul className="min-w-[10rem] flex-1 space-y-2">
        {datos.map((porcion, indice) => (
          <li key={porcion.nombre} className="fila flex items-center gap-2.5 px-3 py-2 text-sm">
            <span
              aria-hidden
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: COLORES[indice % COLORES.length] }}
            />
            <span className="flex-1 font-medium">{porcion.nombre}</span>
            <span className="cifra text-tenue">{Math.round((porcion.total / total) * 100)}%</span>
            <span className="cifra w-20 text-right font-medium">{euros(porcion.total)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Barras horizontales ordenadas: qué estilo deja más en caja. */
export function BarrasEstilos({ datos }: { datos: Porcion[] }) {
  if (!datos.length) {
    return <p className="fila px-4 py-8 text-center text-sm text-tenue">Sin cobros en este trimestre.</p>;
  }

  const series = [{ clave: "total", nombre: "Cobrado", color: "var(--texto)" }];

  return (
    <div
      style={{ height: Math.max(140, datos.length * 44) }}
      role="img"
      aria-label={`Cobrado por estilo: ${datos.map((p) => `${p.nombre} ${euros(p.total)}`).join(", ")}`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={datos} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }} barCategoryGap="28%">
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="nombre"
            width={110}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--texto)", fontSize: 13 }}
          />
          <Tooltip
            cursor={cursorColumna}
            content={(props) => <TarjetaTooltip {...props} series={series} formato={euros} />}
          />
          <Bar
            dataKey="total"
            name="Cobrado"
            radius={[0, 8, 8, 0]}
            background={{ fill: "var(--superficie-alta)", radius: 8 }}
            animationDuration={700}
          >
            {datos.map((porcion, indice) => (
              // La primera, la que más factura, en lima: es la lectura del gráfico.
              <Cell key={porcion.nombre} fill={indice === 0 ? "var(--lima)" : "var(--texto)"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
