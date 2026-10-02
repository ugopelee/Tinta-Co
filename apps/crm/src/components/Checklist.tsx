"use client";

import { useOptimistic, useState, useTransition } from "react";
import type { TareaIncorporacion } from "@tinta/compartido/tipos";
import { alternarTarea, completarMiTarea } from "@/app/acciones-equipo";
import { Icono } from "@/components/Icono";
import { fechaCorta } from "@/lib/equipo";

/**
 * Checklist de incorporación. El propietario marca y desmarca cualquiera; el
 * empleado solo cierra las que le tocan a él, y no puede reabrirlas.
 */
export function Checklist({ tareas, modo }: { tareas: TareaIncorporacion[]; modo: "propietario" | "empleado" }) {
  const [visibles, aplicar] = useOptimistic(
    tareas,
    (actuales: TareaIncorporacion[], cambio: { id: string; hecha: boolean }) =>
      actuales.map((tarea) => (tarea.id === cambio.id ? { ...tarea, hecha: cambio.hecha } : tarea)),
  );
  const [, iniciar] = useTransition();
  const [error, setError] = useState("");

  const hechas = visibles.filter((tarea) => tarea.hecha).length;

  function cambiar(tarea: TareaIncorporacion) {
    const hecha = !tarea.hecha;
    iniciar(async () => {
      aplicar({ id: tarea.id, hecha });
      setError("");
      const resultado =
        modo === "propietario" ? await alternarTarea(tarea.id, hecha) : await completarMiTarea(tarea.id);
      if (!resultado.ok) setError(resultado.mensaje);
    });
  }

  if (visibles.length === 0) {
    return <p className="fila px-4 py-6 text-center text-sm text-tenue">Sin tareas de incorporación.</p>;
  }

  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-superficie-alta">
          <div
            className="h-full rounded-full bg-verde transition-[width] duration-500"
            style={{ width: `${(hechas / visibles.length) * 100}%` }}
          />
        </div>
        <span className="cifra text-xs text-tenue">
          {hechas}/{visibles.length}
        </span>
      </div>

      <ul className="space-y-2">
        {visibles.map((tarea) => {
          const puede = modo === "propietario" || (tarea.de_empleado && !tarea.hecha);
          return (
            <li key={tarea.id}>
              <label className={`fila flex items-start gap-3 px-4 py-3 ${puede ? "cursor-pointer" : ""}`}>
                <input
                  type="checkbox"
                  checked={tarea.hecha}
                  disabled={!puede}
                  onChange={() => cambiar(tarea)}
                  className="mt-0.5 h-4 w-4 accent-[var(--texto)]"
                />
                <span className="min-w-0 flex-1">
                  <span className={`block text-sm font-medium ${tarea.hecha ? "text-tenue line-through" : ""}`}>
                    {tarea.titulo}
                  </span>
                  {tarea.descripcion && <span className="block text-xs text-tenue">{tarea.descripcion}</span>}
                </span>
                {tarea.de_empleado && (
                  <span className="insignia shrink-0 text-[0.7rem]">
                    {modo === "empleado" ? "Te toca" : "La marca el empleado"}
                  </span>
                )}
                {tarea.hecha && tarea.hecha_at && (
                  <span className="hidden shrink-0 items-center gap-1 text-xs text-tenue sm:flex">
                    <Icono nombre="hecho" className="h-3.5 w-3.5 text-verde" />
                    {fechaCorta(tarea.hecha_at)}
                  </span>
                )}
              </label>
            </li>
          );
        })}
      </ul>

      {error && (
        <p role="alert" className="mt-2 text-sm text-acento">
          {error}
        </p>
      )}
    </div>
  );
}
