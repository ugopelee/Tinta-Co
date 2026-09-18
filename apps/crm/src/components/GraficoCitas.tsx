"use client";

import { useState } from "react";

export type PuntoMes = { etiqueta: string; valor: number };

const ANCHO = 620;
const ALTO = 220;
const MARGEN = { arriba: 16, derecha: 8, abajo: 30, izquierda: 32 };
const RADIO = 4;

/** Barra con las esquinas superiores redondeadas y la base plana. */
function trazoBarra(x: number, y: number, ancho: number, alto: number) {
  const r = Math.min(RADIO, alto, ancho / 2);
  const base = y + alto;
  return `M${x},${base} L${x},${y + r} Q${x},${y} ${x + r},${y} L${x + ancho - r},${y} Q${x + ancho},${y} ${x + ancho},${y + r} L${x + ancho},${base} Z`;
}

export function GraficoCitas({ datos }: { datos: PuntoMes[] }) {
  const [activo, setActivo] = useState<number | null>(null);

  const areaAncho = ANCHO - MARGEN.izquierda - MARGEN.derecha;
  const areaAlto = ALTO - MARGEN.arriba - MARGEN.abajo;
  const maximo = Math.max(1, ...datos.map((punto) => punto.valor));

  // 2px de hueco entre barras contiguas, como pide la guía de marcas.
  const paso = areaAncho / Math.max(1, datos.length);
  const anchoBarra = Math.max(6, paso - 14);

  // Tres líneas de referencia bastan; más ruido no aporta lectura.
  const referencias = [0, Math.round(maximo / 2), maximo];

  return (
    <figure className="m-0">
      <svg
        viewBox={`0 0 ${ANCHO} ${ALTO}`}
        className="h-auto w-full"
        role="img"
        aria-label={`Citas recibidas por mes. ${datos
          .map((punto) => `${punto.etiqueta}: ${punto.valor}`)
          .join(". ")}`}
      >
        {referencias.map((valor) => {
          const y = MARGEN.arriba + areaAlto - (valor / maximo) * areaAlto;
          return (
            <g key={valor}>
              <line
                x1={MARGEN.izquierda}
                x2={ANCHO - MARGEN.derecha}
                y1={y}
                y2={y}
                stroke="var(--borde)"
                strokeWidth={1}
              />
              <text
                x={MARGEN.izquierda - 8}
                y={y + 4}
                textAnchor="end"
                fill="var(--tenue)"
                fontSize={11}
                fontFamily="var(--font-mono-ui)"
              >
                {valor}
              </text>
            </g>
          );
        })}

        {datos.map((punto, indice) => {
          const alto = (punto.valor / maximo) * areaAlto;
          const x = MARGEN.izquierda + indice * paso + (paso - anchoBarra) / 2;
          const y = MARGEN.arriba + areaAlto - alto;
          const resaltada = activo === indice;

          return (
            <g
              key={punto.etiqueta}
              onMouseEnter={() => setActivo(indice)}
              onMouseLeave={() => setActivo(null)}
            >
              {/* Zona sensible más ancha que la barra, para acertar sin precisión. */}
              <rect
                x={MARGEN.izquierda + indice * paso}
                y={MARGEN.arriba}
                width={paso}
                height={areaAlto}
                fill="transparent"
              />
              {punto.valor > 0 && (
                <path
                  d={trazoBarra(x, y, anchoBarra, alto)}
                  fill="var(--acento)"
                  opacity={activo === null || resaltada ? 1 : 0.4}
                  style={{ transition: "opacity .25s ease" }}
                />
              )}
              <text
                x={MARGEN.izquierda + indice * paso + paso / 2}
                y={ALTO - 10}
                textAnchor="middle"
                fill={resaltada ? "var(--texto)" : "var(--tenue)"}
                fontSize={11}
                fontFamily="var(--font-mono-ui)"
              >
                {punto.etiqueta}
              </text>
              {resaltada && punto.valor > 0 && (
                <text
                  x={x + anchoBarra / 2}
                  y={y - 8}
                  textAnchor="middle"
                  fill="var(--texto)"
                  fontSize={13}
                  fontFamily="var(--font-mono-ui)"
                >
                  {punto.valor}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
