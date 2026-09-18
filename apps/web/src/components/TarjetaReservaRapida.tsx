"use client";

import { useState } from "react";
import { estudio } from "@tinta/compartido/estudio";

export const EVENTO_ELEGIR_ESTILO = "tintaco:elegir-estilo";

const claseCampo =
  "w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-texto outline-none transition-colors duration-300 focus:border-acento";

/** Eco de la reserva en la portada: elige y baja al formulario relleno. */
export function TarjetaReservaRapida() {
  const destacados = estudio.estilos.filter((estilo) => estilo.destacado);
  // El config es `as const`, así que sin tipar aquí el estado se estrecharía
  // al literal del primer estilo.
  const [estilo, setEstilo] = useState<string>(destacados[0]?.nombre ?? "");
  const [fecha, setFecha] = useState("");

  const precioMinimo = 85;
  const hoy = new Date().toISOString().slice(0, 10);

  function irAlFormulario() {
    window.dispatchEvent(
      new CustomEvent(EVENTO_ELEGIR_ESTILO, { detail: { estilo, fecha } }),
    );
    document
      .getElementById("reserva")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="cristal-denso w-full max-w-sm rounded-2xl p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="titular text-lg leading-tight">Reserva tu sesión</p>
          <p className="mt-1 text-xs text-tenue">Respuesta en menos de 48 h</p>
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-sm text-tenue">
          ✦
        </span>
      </div>

      <div className="mt-5 space-y-3">
        <label className="block">
          <span className="etiqueta mb-1.5 block text-tenue">Estilo</span>
          <select
            value={estilo}
            onChange={(evento) => setEstilo(evento.target.value)}
            className={claseCampo}
          >
            {destacados.map((opcion) => (
              <option key={opcion.id} value={opcion.nombre}>
                {opcion.nombre}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="etiqueta mb-1.5 block text-tenue">Fecha</span>
          <input
            type="date"
            min={hoy}
            value={fecha}
            onChange={(evento) => setFecha(evento.target.value)}
            className={claseCampo}
          />
        </label>
      </div>

      <div className="mt-5 flex items-end justify-between gap-4">
        <div>
          <p className="etiqueta text-tenue">Desde</p>
          <p className="cifra mt-1 text-2xl leading-none">{precioMinimo} €</p>
        </div>
        <p className="max-w-[9rem] text-right text-xs leading-snug text-tenue">
          {estudio.contacto.horario}
        </p>
      </div>

      <button
        type="button"
        onClick={irAlFormulario}
        className="boton-barrido mt-5 w-full rounded-xl bg-acento px-6 py-3 text-sm font-medium text-white transition-colors duration-300"
      >
        Continuar
      </button>
    </div>
  );
}
