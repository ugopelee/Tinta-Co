"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { Diseno } from "@/lib/tipos";
import { TarjetaFlash } from "@/components/TarjetaFlash";
import { Revelar } from "@/components/animaciones";

type Grupo = {
  estilo: string;
  disenos: Diseno[];
  precioMinimo: number | null;
};

function agrupar(disenos: Diseno[]): Grupo[] {
  const mapa = new Map<string, Diseno[]>();

  for (const diseno of disenos) {
    const estilo = diseno.estilo ?? "Otros";
    mapa.set(estilo, [...(mapa.get(estilo) ?? []), diseno]);
  }

  return [...mapa.entries()].map(([estilo, lista]) => {
    const precios = lista
      .map((diseno) => diseno.precio)
      .filter((precio): precio is number => precio !== null);

    return {
      estilo,
      disenos: lista,
      precioMinimo: precios.length ? Math.min(...precios) : null,
    };
  });
}

export function CatalogoPlegable({ disenos }: { disenos: Diseno[] }) {
  const grupos = useMemo(() => agrupar(disenos), [disenos]);
  const [abierto, setAbierto] = useState<string | null>(null);

  return (
    <div className="border-t border-borde">
      {grupos.map((grupo, indice) => {
        const desplegado = abierto === grupo.estilo;

        return (
          <Revelar key={grupo.estilo} retardo={indice * 60}>
            <section className="border-b border-borde">
              <button
                type="button"
                onClick={() =>
                  setAbierto(desplegado ? null : grupo.estilo)
                }
                aria-expanded={desplegado}
                aria-controls={`grupo-${indice}`}
                className="group flex w-full items-center justify-between gap-6 py-7 text-left transition-colors duration-500 hover:bg-superficie/40 sm:px-6"
              >
                <div className="min-w-0">
                  <h3 className="titular text-2xl transition-transform duration-500 sm:text-3xl sm:group-hover:translate-x-2">
                    {grupo.estilo}
                  </h3>
                  <p className="etiqueta mt-2 text-tenue">
                    {grupo.disenos.length}{" "}
                    {grupo.disenos.length === 1 ? "pieza" : "piezas"}
                    {grupo.precioMinimo !== null && ` · desde ${grupo.precioMinimo} €`}
                  </p>
                </div>

                <div className="flex items-center gap-5">
                  {/* Vista previa: se intuye el estilo sin abrir nada. */}
                  <div
                    aria-hidden
                    className="hidden items-center sm:flex"
                  >
                    {grupo.disenos.slice(0, 4).map((diseno, posicion) => (
                      <span
                        key={diseno.id}
                        className="-ml-3 flex h-14 w-14 items-center justify-center rounded-full border border-borde bg-superficie-alta transition-transform duration-500 first:ml-0 group-hover:translate-x-0"
                        style={{
                          zIndex: 4 - posicion,
                          transform: desplegado
                            ? `translateX(${posicion * 6}px)`
                            : undefined,
                        }}
                      >
                        {diseno.imagen_url && (
                          <Image
                            src={diseno.imagen_url}
                            alt=""
                            width={56}
                            height={56}
                            unoptimized
                            className="h-8 w-auto opacity-70"
                          />
                        )}
                      </span>
                    ))}
                  </div>

                  <span
                    aria-hidden
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-borde text-lg transition-all duration-500 group-hover:border-acento ${
                      desplegado ? "rotate-45 border-acento text-acento" : ""
                    }`}
                  >
                    +
                  </span>
                </div>
              </button>

              {/* 0fr → 1fr anima la altura sin tener que medirla. */}
              <div
                id={`grupo-${indice}`}
                className="grid transition-[grid-template-rows] duration-700 ease-[cubic-bezier(.22,.8,.26,1)]"
                style={{ gridTemplateRows: desplegado ? "1fr" : "0fr" }}
              >
                <div className="overflow-hidden">
                  <div className="grid gap-6 pb-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
                    {grupo.disenos.map((diseno) => (
                      <TarjetaFlash key={diseno.id} diseno={diseno} />
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </Revelar>
        );
      })}
    </div>
  );
}
