"use client";

import { useState, useTransition } from "react";
import { fichar } from "@/app/acciones-equipo";
import { Icono } from "@/components/Icono";

/** Un solo botón: entra si estás fuera, sale si estás dentro. */
export function BotonFichar({ dentro }: { dentro: boolean }) {
  const [mensaje, setMensaje] = useState("");
  const [ocupado, iniciar] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        disabled={ocupado}
        onClick={() =>
          iniciar(async () => {
            const resultado = await fichar();
            setMensaje(resultado.mensaje);
          })
        }
        className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-transform duration-150 active:scale-[0.98] disabled:opacity-60 ${
          dentro ? "bg-texto text-fondo" : "bg-lima text-sobre-lima"
        }`}
      >
        <Icono nombre="fichaje" className="h-5 w-5" />
        {ocupado ? "Fichando…" : dentro ? "Fichar salida" : "Fichar entrada"}
      </button>
      {mensaje && (
        <p role="status" className="text-sm text-tenue">
          {mensaje}
        </p>
      )}
    </div>
  );
}
