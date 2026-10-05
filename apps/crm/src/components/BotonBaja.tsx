"use client";

import { useState, useTransition } from "react";
import { cambiarBaja } from "@/app/acciones-equipo";

/** Dar de baja corta el acceso a su portal sin borrar su historial. */
export function BotonBaja({ empleadoId, deBaja }: { empleadoId: string; deBaja: boolean }) {
  const [ocupado, iniciar] = useTransition();
  const [error, setError] = useState("");

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        disabled={ocupado}
        onClick={() => {
          if (!deBaja && !window.confirm("¿Dar de baja? Perderá el acceso a su portal.")) return;
          iniciar(async () => {
            const resultado = await cambiarBaja(empleadoId, !deBaja);
            setError(resultado.ok ? "" : resultado.mensaje);
          });
        }}
        className="boton-fantasma"
      >
        {ocupado ? "Guardando…" : deBaja ? "Reactivar" : "Dar de baja"}
      </button>
      {error && <span className="text-sm text-acento">{error}</span>}
    </span>
  );
}
