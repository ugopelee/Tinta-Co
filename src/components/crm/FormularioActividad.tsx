"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { anadirActividad } from "@/app/crm/acciones";
import { formularioInicial } from "@/lib/formularios";
import { tiposActividad } from "@/config/estudio";

const claseCampo =
  "w-full rounded-lg border border-borde bg-fondo px-3 py-2 text-sm text-texto outline-none transition-colors duration-200 placeholder:text-tenue/70 focus:border-acento focus:ring-1 focus:ring-acento";

function Boton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-acento px-5 py-2.5 text-sm font-medium text-white transition-colors duration-300 hover:bg-acento-suave disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Guardando…" : "Añadir al historial"}
    </button>
  );
}

export function FormularioActividad({ clienteId }: { clienteId: string }) {
  const [resultado, accion] = useActionState(anadirActividad, formularioInicial);
  const formulario = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (resultado.estado === "ok") formulario.current?.reset();
  }, [resultado]);

  return (
    <form ref={formulario} action={accion} className="space-y-4">
      <input type="hidden" name="cliente_id" value={clienteId} />

      <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto]">
        <input
          name="titulo"
          required
          maxLength={160}
          placeholder="Qué ha pasado"
          className={claseCampo}
          aria-label="Título de la actividad"
        />
        <select
          name="tipo"
          defaultValue="tatuaje"
          className={claseCampo}
          aria-label="Tipo de actividad"
        >
          {tiposActividad.map((tipo) => (
            <option key={tipo.id} value={tipo.id}>
              {tipo.nombre}
            </option>
          ))}
        </select>
        <input
          name="fecha"
          type="date"
          defaultValue={new Date().toISOString().slice(0, 10)}
          className={claseCampo}
          aria-label="Fecha"
        />
      </div>

      <textarea
        name="descripcion"
        rows={2}
        maxLength={2000}
        placeholder="Detalles (opcional)"
        className={`${claseCampo} resize-y`}
        aria-label="Descripción"
      />

      <div className="flex items-center gap-4">
        <Boton />
        {resultado.estado !== "inicial" && (
          <p
            role="status"
            className={`text-sm ${
              resultado.estado === "ok" ? "text-tenue" : "text-acento-suave"
            }`}
          >
            {resultado.mensaje}
          </p>
        )}
      </div>
    </form>
  );
}
