"use client";

import { useState } from "react";
import { estadosCita } from "@tinta/compartido/estudio";

export type PuntoMes = {
  etiqueta: string;
  /** Recuento por estado, en el mismo orden que `estadosCita`. */
  valores: number[];
};

const ANCHO = 680;
const ALTO = 260;
const MARGEN = { arriba: 16, derecha: 8, abajo: 34, izquierda: 30 };
const RADIO = 3;
/** Hueco entre segmentos apilados: separa sin necesidad de borde. */
const HUECO = 2;

function trazoSegmento(
  x: number,
  y: number,
  ancho: number,
  alto: number,
  redondeaArriba: boolean,
) {
  if (!redondeaArriba) return `M${x},${y}h${ancho}v${alto}h${-ancho}Z`;
  const r = Math.min(RADIO, alto, ancho / 2);
  return `M${x},${y + alto} L${x},${y + r} Q${x},${y} ${x + r},${y} L${x + ancho - r},${y} Q${x + ancho},${y} ${x + ancho},${y + r} L${x + ancho},${y + alto} Z`;
}

/**
 * Trama diagonal para las barras: separa las series aunque se impriman en
 * blanco y negro, y da textura sin recurrir a degradados.
 */
function Rayas({ id, color }: { id: string; color: string }) {
  return (
    <pattern
      id={id}
      width="7"
      height="7"
      patternUnits="userSpaceOnUse"
      patternTransform="rotate(45)"
    >
      <rect width="7" height="7" fill={color} opacity="0.4" />
      <rect width="3.5" height="7" fill={color} />
    </pattern>
  );
}

export function GraficoCitas({ datos }: { datos: PuntoMes[] }) {
  const [activo, setActivo] = useState<number | null>(null);

  const areaAncho = ANCHO - MARGEN.izquierda - MARGEN.derecha;
  const areaAlto = ALTO - MARGEN.arriba - MARGEN.abajo;

  const totales = datos.map((punto) =>
    punto.valores.reduce((suma, valor) => suma + valor, 0),
  );
  const maximo = Math.max(1, ...totales);

  const paso = areaAncho / Math.max(1, datos.length);
  const anchoBarra = Math.min(46, Math.max(10, paso - 22));
  const referencias = [0, Math.round(maximo / 2), maximo];

  return (
    <figure className="m-0">
      <div className="mb-5 flex flex-wrap items-center gap-x-5 gap-y-2">
        {estadosCita.map((estado) => (
          <span key={estado.id} className="flex items-center gap-2 text-xs">
            <span
              aria-hidden
              className="h-2 w-2 rounded-full"
              style={{ background: estado.color }}
            />
            <span className="text-tenue">{estado.nombre}</span>
          </span>
        ))}
      </div>

      <div className="relative">
        <svg
          viewBox={`0 0 ${ANCHO} ${ALTO}`}
          className="h-auto w-full"
          role="img"
          aria-label={`Citas por mes y estado. ${datos
            .map((punto, indice) => `${punto.etiqueta}: ${totales[indice]}`)
            .join(". ")}`}
        >
          <defs>
            {estadosCita.map((estado) => (
              <Rayas
                key={estado.id}
                id={`rayas-${estado.id}`}
                color={estado.color}
              />
            ))}
          </defs>

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
                  strokeDasharray={valor === 0 ? undefined : "2 5"}
                />
                <text
                  x={MARGEN.izquierda - 8}
                  y={y + 4}
                  textAnchor="end"
                  fill="var(--tenue)"
                  fontSize={10}
                >
                  {valor}
                </text>
              </g>
            );
          })}

          {datos.map((punto, indice) => {
            const x = MARGEN.izquierda + indice * paso + (paso - anchoBarra) / 2;
            const resaltada = activo === indice;
            let acumulado = 0;

            return (
              <g
                key={punto.etiqueta}
                onMouseEnter={() => setActivo(indice)}
                onMouseLeave={() => setActivo(null)}
              >
                <rect
                  x={MARGEN.izquierda + indice * paso}
                  y={MARGEN.arriba}
                  width={paso}
                  height={areaAlto}
                  fill={resaltada ? "var(--superficie-alta)" : "transparent"}
                  opacity={0.5}
                />

                {punto.valores.map((valor, capa) => {
                  if (valor === 0) return null;

                  const altura = (valor / maximo) * areaAlto;
                  const y =
                    MARGEN.arriba + areaAlto - acumulado - altura;
                  const esUltima = punto.valores
                    .slice(capa + 1)
                    .every((resto) => resto === 0);
                  acumulado += altura;

                  return (
                    <path
                      key={estadosCita[capa].id}
                      d={trazoSegmento(
                        x,
                        y,
                        anchoBarra,
                        Math.max(1, altura - HUECO),
                        esUltima,
                      )}
                      fill={`url(#rayas-${estadosCita[capa].id})`}
                      opacity={activo === null || resaltada ? 1 : 0.35}
                      style={{ transition: "opacity .25s ease" }}
                    />
                  );
                })}

                <text
                  x={MARGEN.izquierda + indice * paso + paso / 2}
                  y={ALTO - 12}
                  textAnchor="middle"
                  fill={resaltada ? "var(--texto)" : "var(--tenue)"}
                  fontSize={9.5}
                  letterSpacing={0.8}
                >
                  {punto.etiqueta.toUpperCase()}
                </text>
              </g>
            );
          })}
        </svg>

        {activo !== null && totales[activo] > 0 && (
          <div
            className="pointer-events-none absolute top-2 rounded-lg border border-borde bg-fondo/95 px-3 py-2 text-xs shadow-xl backdrop-blur"
            style={{
              left: `${((activo + 0.5) / datos.length) * 100}%`,
              transform: "translateX(-50%)",
            }}
          >
            <p className="mb-1.5 text-tenue">{datos[activo].etiqueta}</p>
            {datos[activo].valores.map((valor, capa) =>
              valor > 0 ? (
                <p
                  key={estadosCita[capa].id}
                  className="flex items-center gap-2 leading-5"
                >
                  <span
                    aria-hidden
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: estadosCita[capa].color }}
                  />
                  <span className="text-tenue">
                    {estadosCita[capa].nombre}
                  </span>
                  <span className="cifra ml-auto">{valor}</span>
                </p>
              ) : null,
            )}
          </div>
        )}
      </div>
    </figure>
  );
}
