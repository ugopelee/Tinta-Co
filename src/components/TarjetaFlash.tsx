"use client";

import Image from "next/image";
import type { Diseno } from "@/lib/tipos";
import { Cortina, Revelar } from "@/components/animaciones";

export const EVENTO_ELEGIR_DISENO = "tintaco:elegir-diseno";

export function TarjetaFlash({
  diseno,
  retardo = 0,
}: {
  diseno: Diseno;
  retardo?: number;
}) {
  function llevarAlFormulario() {
    window.dispatchEvent(
      new CustomEvent(EVENTO_ELEGIR_DISENO, { detail: diseno.id }),
    );
    document
      .getElementById("reserva")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <Revelar retardo={retardo}>
      <article className="carta-flash group relative h-full overflow-hidden rounded-xl border border-borde bg-superficie transition-all duration-500 hover:-translate-y-1 hover:border-acento/40">
        <button
          type="button"
          onClick={llevarAlFormulario}
          className="block w-full cursor-pointer text-left outline-none focus-visible:ring-1 focus-visible:ring-acento"
          aria-label={`Reservar el diseño ${diseno.nombre}`}
        >
          <Cortina
            retardo={retardo + 120}
            className="relative flex aspect-[4/5] items-center justify-center overflow-hidden bg-superficie-alta"
          >
            {diseno.imagen_url && (
              <Image
                src={diseno.imagen_url}
                alt={diseno.nombre}
                width={200}
                height={260}
                unoptimized
                className="h-4/5 w-auto opacity-90 transition-transform duration-[900ms] ease-out group-hover:scale-[1.07]"
              />
            )}

            {diseno.estilo && (
              <span className="etiqueta absolute left-4 top-4 rounded-full border border-borde bg-fondo/70 px-3 py-1.5 text-tenue backdrop-blur">
                {diseno.estilo}
              </span>
            )}

            <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-4 bg-gradient-to-t from-fondo via-fondo/80 to-transparent p-5 pt-16 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
              <span className="flex items-center gap-2 text-sm text-texto">
                Reservar este diseño
                <span className="transition-transform duration-500 group-hover:translate-x-1">
                  →
                </span>
              </span>
            </div>
          </Cortina>

          <div className="p-6">
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="titular text-xl">{diseno.nombre}</h3>
              {diseno.precio !== null && (
                <span className="cifra shrink-0 text-acento">
                  {Number(diseno.precio).toLocaleString("es-ES", {
                    style: "currency",
                    currency: "EUR",
                    maximumFractionDigits: 0,
                  })}
                </span>
              )}
            </div>

            {diseno.descripcion && (
              <p className="parrafo mt-3 text-sm text-tenue">
                {diseno.descripcion}
              </p>
            )}

            {diseno.tamano_aprox && (
              <p className="etiqueta mt-4 text-tenue/70">
                {diseno.tamano_aprox}
              </p>
            )}
          </div>
        </button>
      </article>
    </Revelar>
  );
}
