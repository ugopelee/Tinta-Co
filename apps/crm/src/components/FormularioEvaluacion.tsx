"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { notasEvaluacion } from "@tinta/compartido/estudio";
import { formularioInicial } from "@tinta/compartido/formularios";
import type { Evaluacion } from "@tinta/compartido/tipos";
import { guardarEvaluacion } from "@/app/acciones-equipo";
import { Icono } from "@/components/Icono";
import { claseCampo } from "@/components/FormularioAlta";

function Guardar() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="boton !px-4 !py-2">
      {pending ? "Guardando…" : "Guardar evaluación"}
    </button>
  );
}

/**
 * Evaluación trimestral del 1 al 5. Si el trimestre ya está evaluado, el
 * formulario carga esa nota y guardarlo la corrige.
 */
export function FormularioEvaluacion({
  empleadoId,
  trimestres,
  evaluaciones,
}: {
  empleadoId: string;
  trimestres: { clave: string; nombre: string }[];
  evaluaciones: Evaluacion[];
}) {
  const [trimestre, setTrimestre] = useState(trimestres[0]?.clave ?? "");
  const existente = evaluaciones.find((evaluacion) => evaluacion.trimestre === trimestre);
  const [nota, setNota] = useState<number>(existente?.nota ?? 0);
  const [resultado, accion] = useActionState(guardarEvaluacion, formularioInicial);

  return (
    <form action={accion} className="fila grid gap-3 p-4">
      <input type="hidden" name="empleado_id" value={empleadoId} />
      <input type="hidden" name="nota" value={nota || ""} />

      <label className="grid gap-1 text-xs text-tenue">
        Trimestre
        {/* No controlado: React vacía el formulario tras cada envío y un
            select con `value` se quedaría mostrando otra opción que la del
            estado. Con `defaultValue` vuelve al trimestre elegido. */}
        <select
          name="trimestre"
          defaultValue={trimestre}
          onChange={(evento) => {
            setTrimestre(evento.target.value);
            setNota(evaluaciones.find((e) => e.trimestre === evento.target.value)?.nota ?? 0);
          }}
          className={claseCampo}
        >
          {trimestres.map((opcion) => (
            <option key={opcion.clave} value={opcion.clave}>
              {opcion.clave.replace("-T", " · T")} ({opcion.nombre})
              {evaluaciones.some((e) => e.trimestre === opcion.clave) ? " · evaluado" : ""}
            </option>
          ))}
        </select>
      </label>

      <fieldset>
        <legend className="mb-1.5 text-xs text-tenue">Nota</legend>
        <div className="flex flex-wrap gap-2">
          {notasEvaluacion.map((opcion) => (
            <button
              key={opcion.nota}
              type="button"
              aria-pressed={nota === opcion.nota}
              onClick={() => setNota(opcion.nota)}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm transition-colors duration-200 ${
                nota === opcion.nota ? "bg-texto text-fondo" : "bg-superficie ring-1 ring-borde hover:ring-texto/30"
              }`}
            >
              <Icono
                nombre="estrella"
                className={`h-4 w-4 ${nota >= opcion.nota ? "fill-amarillo text-amarillo" : ""}`}
              />
              <span className="cifra font-semibold">{opcion.nota}</span>
              <span className="hidden text-xs opacity-70 sm:inline">{opcion.nombre}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <label className="grid gap-1 text-xs text-tenue">
        Comentario
        <textarea
          key={trimestre}
          name="comentario"
          rows={2}
          defaultValue={existente?.comentario ?? ""}
          placeholder="Qué ha ido bien, qué mejorar el próximo trimestre…"
          className={`${claseCampo} resize-none`}
        />
      </label>

      {resultado.estado !== "inicial" && (
        <p
          role={resultado.estado === "error" ? "alert" : undefined}
          className={`text-sm ${resultado.estado === "error" ? "text-acento" : "text-tenue"}`}
        >
          {resultado.mensaje}
        </p>
      )}

      <div>
        <Guardar />
      </div>
    </form>
  );
}
