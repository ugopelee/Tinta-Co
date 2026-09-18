"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import type { Diseno } from "@tinta/compartido/tipos";
import { EVENTO_ELEGIR_DISENO } from "@/components/TarjetaFlash";

/** Alturas alternas: la tira no se lee como una rejilla, sino como un muro. */
const ALTURAS = ["h-[22rem]", "h-[27rem]", "h-[24rem]", "h-[30rem]"];

function llevarAlFormulario(id: string) {
  window.dispatchEvent(new CustomEvent(EVENTO_ELEGIR_DISENO, { detail: id }));
  document
    .getElementById("reserva")
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function Pieza({ diseno, altura }: { diseno: Diseno; altura: string }) {
  return (
    <button
      type="button"
      onClick={() => llevarAlFormulario(diseno.id)}
      aria-label={`Reservar el diseño ${diseno.nombre}`}
      className="group relative w-[15rem] shrink-0 text-left outline-none sm:w-[17rem]"
    >
      <p className="etiqueta mb-3 text-tenue transition-colors duration-300 group-hover:text-texto">
        {diseno.estilo ?? "Flash"}
      </p>

      <div
        className={`relative ${altura} overflow-hidden rounded-lg border border-white/10 bg-superficie`}
      >
        {diseno.imagen_url && (
          <Image
            src={diseno.imagen_url}
            alt={diseno.nombre}
            fill
            unoptimized
            sizes="17rem"
            className="object-contain p-8 opacity-80 transition-all duration-700 ease-out group-hover:scale-105 group-hover:opacity-100"
          />
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-3 bg-gradient-to-t from-fondo via-fondo/85 to-transparent p-4 pt-14 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
          <p className="text-sm">{diseno.nombre}</p>
          {diseno.precio !== null && (
            <p className="cifra mt-1 text-sm text-acento">
              {Number(diseno.precio).toLocaleString("es-ES", {
                style: "currency",
                currency: "EUR",
                maximumFractionDigits: 0,
              })}
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-3">
        <p className="truncate text-sm text-tenue">{diseno.nombre}</p>
        {diseno.tamano_aprox && (
          <p className="etiqueta shrink-0 text-tenue/60">
            {diseno.tamano_aprox}
          </p>
        )}
      </div>
    </button>
  );
}

export function GaleriaDisenos({ disenos }: { disenos: Diseno[] }) {
  // Dos copias seguidas: al terminar la primera, la segunda ya está en su
  // sitio y el bucle no se nota.
  const tanda = (
    <div className="flex shrink-0 items-start gap-5 pr-5">
      {disenos.map((diseno, indice) => (
        <Pieza
          key={diseno.id}
          diseno={diseno}
          altura={ALTURAS[indice % ALTURAS.length]}
        />
      ))}
    </div>
  );

  return (
    <div
      className="galeria flex overflow-hidden"
      style={{ "--duracion-galeria": `${disenos.length * 6}s` } as CSSProperties}
    >
      {tanda}
      {tanda}
    </div>
  );
}
