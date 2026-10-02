"use client";

import { useState, useTransition } from "react";
import { responderVacaciones } from "@/app/acciones-equipo";
import { Icono } from "@/components/Icono";

/** Aprobar o rechazar una solicitud pendiente, con una nota opcional. */
export function RespuestaVacaciones({ id }: { id: string }) {
  const [nota, setNota] = useState("");
  const [error, setError] = useState("");
  const [ocupado, iniciar] = useTransition();

  function responder(estado: "aprobada" | "rechazada") {
    iniciar(async () => {
      const resultado = await responderVacaciones(id, estado, nota);
      setError(resultado.ok ? "" : resultado.mensaje);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        value={nota}
        onChange={(evento) => setNota(evento.target.value)}
        placeholder="Nota (opcional)"
        aria-label="Nota para el empleado"
        className="h-9 w-44 rounded-xl bg-superficie px-3 text-sm outline-none ring-1 ring-borde focus:ring-2 focus:ring-texto/30"
      />
      <button
        type="button"
        disabled={ocupado}
        onClick={() => responder("aprobada")}
        className="inline-flex items-center gap-1.5 rounded-full bg-lima px-3.5 py-1.5 text-sm font-medium text-sobre-lima disabled:opacity-50"
      >
        <Icono nombre="hecho" className="h-4 w-4" />
        Aprobar
      </button>
      <button type="button" disabled={ocupado} onClick={() => responder("rechazada")} className="boton-fantasma">
        <Icono nombre="cerrar" className="h-4 w-4" />
        Rechazar
      </button>
      {error && <span className="text-sm text-acento">{error}</span>}
    </div>
  );
}
