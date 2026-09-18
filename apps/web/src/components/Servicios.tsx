"use client";

import { useState } from "react";
import { estudio } from "@tinta/compartido/estudio";
import { MarcaDeAgua } from "@/components/MarcaDeAgua";

/**
 * En lugar de una lista con cuatro fichas iguales, el servicio elegido ocupa
 * la sección entera: su nombre gigante detrás y el detalle delante. El listado
 * queda reducido a un selector.
 */
export function Servicios() {
  const [activo, setActivo] = useState(0);
  const servicio = estudio.servicios[activo];

  return (
    <section
      id="servicios"
      className="relative flex min-h-[38rem] scroll-mt-24 flex-col justify-between overflow-hidden px-6 py-20 sm:min-h-[42rem] sm:px-10 sm:py-24"
    >
      {/* El nombre del servicio, enorme y detrás de todo. */}
      <p
        aria-hidden
        key={servicio.id}
        className="surgir titular pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 select-none whitespace-nowrap text-center text-[clamp(4rem,17vw,15rem)] leading-none text-texto/[0.07]"
      >
        {servicio.nombre}
      </p>

      <MarcaDeAgua className="pointer-events-none absolute -left-20 top-1/2 h-[34rem] w-auto -translate-y-1/2 text-texto opacity-[0.03]" />

      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 left-1/2 h-[30rem] w-[40rem] -translate-x-1/2 rounded-full opacity-25 blur-[130px]"
        style={{ background: "var(--acento)" }}
      />

      <div className="relative mx-auto flex w-full max-w-7xl flex-wrap items-center justify-center gap-2">
        {estudio.servicios.map((opcion, indice) => (
          <button
            key={opcion.id}
            type="button"
            onMouseEnter={() => setActivo(indice)}
            onFocus={() => setActivo(indice)}
            onClick={() => setActivo(indice)}
            aria-pressed={indice === activo}
            className={`rounded-full border px-4 py-2 text-sm transition-all duration-300 ${
              indice === activo
                ? "border-acento bg-acento/10 text-texto"
                : "border-white/10 text-tenue hover:border-white/25 hover:text-texto"
            }`}
          >
            {opcion.nombre}
          </button>
        ))}
      </div>

      <div className="relative mx-auto flex w-full max-w-7xl flex-wrap items-end justify-between gap-8">
        <div className="max-w-sm">
          <p className="etiqueta text-acento">
            0{activo + 1} · {servicio.nombre}
          </p>
          <p className="parrafo mt-4 text-sm text-tenue">
            {servicio.descripcion}
          </p>
        </div>

        <a
          href="#reserva"
          className="group flex items-center gap-3 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm backdrop-blur transition-all duration-300 hover:border-white/35"
        >
          {servicio.detalle}
          <span
            aria-hidden
            className="transition-transform duration-300 group-hover:translate-x-1"
          >
            ↗
          </span>
        </a>
      </div>
    </section>
  );
}
