"use client";

import { useState } from "react";

export type MesFacturado = {
  etiqueta: string;
  cobrado: number;
  pendiente: number;
};

const ANCHO = 680;
const ALTO = 220;
const MARGEN = { arriba: 16, derecha: 8, abajo: 32, izquierda: 44 };
const RADIO = 3;
const HUECO = 2;

const COBRADO = "#57a86f";
const PENDIENTE = "#bd8a2e";

function trazo(x: number, y: number, ancho: number, alto: number, redondea: boolean) {
  if (!redondea) return `M${x},${y}h${ancho}v${alto}h${-ancho}Z`;
  const r = Math.min(RADIO, alto, ancho / 2);
  return `M${x},${y + alto} L${x},${y + r} Q${x},${y} ${x + r},${y} L${x + ancho - r},${y} Q${x + ancho},${y} ${x + ancho},${y + r} L${x + ancho},${y + alto} Z`;
}

const euros = (valor: number) =>
  valor.toLocaleString("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });

export function GraficoFacturacion({ datos }: { datos: MesFacturado[] }) {
  const [activo, setActivo] = useState<number | null>(null);

  const areaAncho = ANCHO - MARGEN.izquierda - MARGEN.derecha;
  const areaAlto = ALTO - MARGEN.arriba - MARGEN.abajo;

  const totales = datos.map((mes) => mes.cobrado + mes.pendiente);
  const maximo = Math.max(1, ...totales);
  const paso = areaAncho / Math.max(1, datos.length);
  const anchoBarra = Math.min(44, Math.max(10, paso - 22));

  return (
    <figure className="m-0">
      <div className="mb-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
        {[
          { nombre: "Cobrado", color: COBRADO },
          { nombre: "Pendiente", color: PENDIENTE },
        ].map((serie) => (
          <span key={serie.nombre} className="flex items-center gap-2">
            <span
              aria-hidden
              className="h-2 w-2 rounded-full"
              style={{ background: serie.color }}
            />
            <span className="text-tenue">{serie.nombre}</span>
          </span>
        ))}
      </div>

      <div className="relative">
        <svg
          viewBox={`0 0 ${ANCHO} ${ALTO}`}
          className="h-auto w-full"
          role="img"
          aria-label={`Facturación por mes. ${datos
            .map((mes) => `${mes.etiqueta}: ${euros(mes.cobrado)} cobrado`)
            .join(". ")}`}
        >
          {[0, maximo / 2, maximo].map((valor) => {
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
                  fontSize={10}
                  fontFamily="var(--font-mono-ui)"
                >
                  {Math.round(valor)}
                </text>
              </g>
            );
          })}

          {datos.map((mes, indice) => {
            const x = MARGEN.izquierda + indice * paso + (paso - anchoBarra) / 2;
            const resaltada = activo === indice;
            const altoCobrado = (mes.cobrado / maximo) * areaAlto;
            const altoPendiente = (mes.pendiente / maximo) * areaAlto;
            const base = MARGEN.arriba + areaAlto;

            return (
              <g
                key={mes.etiqueta}
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

                {mes.cobrado > 0 && (
                  <path
                    d={trazo(
                      x,
                      base - altoCobrado,
                      anchoBarra,
                      Math.max(1, altoCobrado - (mes.pendiente > 0 ? HUECO : 0)),
                      mes.pendiente === 0,
                    )}
                    fill={COBRADO}
                    opacity={activo === null || resaltada ? 1 : 0.35}
                    style={{ transition: "opacity .25s ease" }}
                  />
                )}

                {mes.pendiente > 0 && (
                  <path
                    d={trazo(
                      x,
                      base - altoCobrado - altoPendiente,
                      anchoBarra,
                      Math.max(1, altoPendiente - HUECO),
                      true,
                    )}
                    fill={PENDIENTE}
                    opacity={activo === null || resaltada ? 1 : 0.35}
                    style={{ transition: "opacity .25s ease" }}
                  />
                )}

                <text
                  x={MARGEN.izquierda + indice * paso + paso / 2}
                  y={ALTO - 10}
                  textAnchor="middle"
                  fill={resaltada ? "var(--texto)" : "var(--tenue)"}
                  fontSize={10}
                  fontFamily="var(--font-mono-ui)"
                >
                  {mes.etiqueta}
                </text>
              </g>
            );
          })}
        </svg>

        {activo !== null && totales[activo] > 0 && (
          <div
            className="pointer-events-none absolute top-2 min-w-[9rem] rounded-lg border border-borde bg-fondo/95 px-3 py-2 text-xs shadow-xl backdrop-blur"
            style={{
              left: `${((activo + 0.5) / datos.length) * 100}%`,
              transform: "translateX(-50%)",
            }}
          >
            <p className="mb-1.5 text-tenue">{datos[activo].etiqueta}</p>
            <p className="flex items-center gap-2 leading-5">
              <span
                aria-hidden
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: COBRADO }}
              />
              <span className="text-tenue">Cobrado</span>
              <span className="cifra ml-auto">{euros(datos[activo].cobrado)}</span>
            </p>
            {datos[activo].pendiente > 0 && (
              <p className="flex items-center gap-2 leading-5">
                <span
                  aria-hidden
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: PENDIENTE }}
                />
                <span className="text-tenue">Pendiente</span>
                <span className="cifra ml-auto">
                  {euros(datos[activo].pendiente)}
                </span>
              </p>
            )}
          </div>
        )}
      </div>
    </figure>
  );
}
