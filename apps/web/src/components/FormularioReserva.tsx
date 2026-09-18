"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { reservarCita } from "@/app/acciones";
import { formularioInicial } from "@tinta/compartido/formularios";
import { estudio } from "@tinta/compartido/estudio";
import type { Diseno } from "@tinta/compartido/tipos";
import { EVENTO_ELEGIR_DISENO } from "@/components/TarjetaFlash";

const claseCampo =
  "w-full rounded-lg border border-borde bg-fondo/60 px-3.5 py-2.5 text-sm text-texto outline-none transition-colors duration-300 placeholder:text-tenue/70 focus:border-acento focus:ring-1 focus:ring-acento";

const claseEtiqueta = "mb-1.5 block text-xs text-tenue";

function BotonEnviar() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="boton-barrido w-full rounded-xl bg-acento px-6 py-3 text-sm font-medium text-white transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Enviando…" : "Solicitar cita"}
    </button>
  );
}

export function FormularioReserva({ disenos }: { disenos: Diseno[] }) {
  const [resultado, accion] = useActionState(reservarCita, formularioInicial);
  const formulario = useRef<HTMLFormElement>(null);
  const [disenoElegido, setDisenoElegido] = useState("");
  const [fechaElegida, setFechaElegida] = useState("");

  // El catálogo avisa por evento cuando tocas una pieza.
  useEffect(() => {
    const alElegirDiseno = (evento: Event) => {
      setDisenoElegido((evento as CustomEvent<string>).detail);
    };

    window.addEventListener(EVENTO_ELEGIR_DISENO, alElegirDiseno);
    return () =>
      window.removeEventListener(EVENTO_ELEGIR_DISENO, alElegirDiseno);
  }, []);

  useEffect(() => {
    // reset() dispara el evento onReset, que es donde se limpia el select
    // controlado. Así no hay setState síncrono dentro del efecto.
    if (resultado.estado === "ok") formulario.current?.reset();
  }, [resultado]);

  const hoy = new Date().toISOString().slice(0, 10);

  return (
    <form
      ref={formulario}
      action={accion}
      onReset={() => {
        setDisenoElegido("");
        setFechaElegida("");
      }}
      className="space-y-4"
    >
      {/* Señuelo para bots: fuera de pantalla y saltado por el tabulador. */}
      <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="apodo">No rellenes este campo</label>
        <input id="apodo" name="apodo" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={claseEtiqueta} htmlFor="nombre">
            Nombre *
          </label>
          <input
            id="nombre"
            name="nombre"
            required
            maxLength={120}
            autoComplete="name"
            placeholder="Cómo te llamas"
            className={claseCampo}
          />
        </div>

        <div>
          <label className={claseEtiqueta} htmlFor="email">
            Email *
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            maxLength={160}
            autoComplete="email"
            placeholder="tu@email.com"
            className={claseCampo}
          />
        </div>

        <div>
          <label className={claseEtiqueta} htmlFor="telefono">
            Teléfono
          </label>
          <input
            id="telefono"
            name="telefono"
            type="tel"
            maxLength={40}
            autoComplete="tel"
            placeholder="600 000 000"
            className={claseCampo}
          />
        </div>

        <div>
          <label className={claseEtiqueta} htmlFor="fecha_deseada">
            Fecha deseada
          </label>
          <input
            id="fecha_deseada"
            name="fecha_deseada"
            type="date"
            min={hoy}
            value={fechaElegida}
            onChange={(evento) => setFechaElegida(evento.target.value)}
            className={claseCampo}
          />
        </div>
      </div>


      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={claseEtiqueta} htmlFor="diseno_id">
            Diseño del catálogo
          </label>
          <select
            id="diseno_id"
            name="diseno_id"
            value={disenoElegido}
            onChange={(evento) => setDisenoElegido(evento.target.value)}
            className={claseCampo}
          >
            <option value="">Ninguno en concreto</option>
            {disenos.map((diseno) => (
              <option key={diseno.id} value={diseno.id}>
                {diseno.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={claseEtiqueta} htmlFor="zona_cuerpo">
            Zona del cuerpo
          </label>
          <select
            id="zona_cuerpo"
            name="zona_cuerpo"
            defaultValue=""
            className={claseCampo}
          >
            <option value="">Todavía no lo tengo claro</option>
            {estudio.zonasCuerpo.map((zona) => (
              <option key={zona} value={zona}>
                {zona}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={claseEtiqueta} htmlFor="mensaje">
          Cuéntanos tu idea
        </label>
        <textarea
          id="mensaje"
          name="mensaje"
          rows={2}
          maxLength={2000}
          placeholder="Tamaño aproximado, referencias, si es tu primer tatuaje…"
          className={`${claseCampo} resize-y`}
        />
      </div>

      <div className="space-y-3 pt-1">
        <BotonEnviar />
        <p className="text-xs leading-relaxed text-tenue sm:max-w-xs">
          {estudio.reserva.aviso}
        </p>
      </div>

      {resultado.estado !== "inicial" && (
        <p
          role="status"
          aria-live="polite"
          className={`rounded-lg border px-4 py-3 text-sm ${
            resultado.estado === "ok"
              ? "border-acento/40 bg-acento/10 text-texto"
              : "border-borde bg-superficie text-tenue"
          }`}
        >
          {resultado.mensaje}
        </p>
      )}
    </form>
  );
}
