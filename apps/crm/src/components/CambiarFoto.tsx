"use client";

import { useState, useTransition } from "react";
import { cambiarFoto } from "@/app/acciones-equipo";
import { Avatar } from "@/components/Avatar";
import { Icono } from "@/components/Icono";

/** La foto de la ficha, con un botón encima para cambiarla. */
export function CambiarFoto({ empleadoId, nombre, foto }: { empleadoId: string; nombre: string; foto: string | null }) {
  const [ocupado, iniciar] = useTransition();
  const [error, setError] = useState("");

  return (
    <div className="flex flex-col items-center gap-1">
      <label className="group relative cursor-pointer" title="Cambiar foto">
        <Avatar nombre={nombre} foto={foto} className="h-24 w-24 text-xl" />
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <Icono nombre="camara" className="h-6 w-6" />
        </span>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          aria-label="Cambiar foto"
          disabled={ocupado}
          onChange={(evento) => {
            const archivo = evento.target.files?.[0];
            if (!archivo) return;
            const datos = new FormData();
            datos.set("foto", archivo);
            iniciar(async () => {
              const resultado = await cambiarFoto(empleadoId, datos);
              setError(resultado.ok ? "" : resultado.mensaje);
            });
          }}
        />
      </label>
      <span className="text-xs text-tenue">{ocupado ? "Subiendo…" : "Cambiar foto"}</span>
      {error && (
        <span role="alert" className="max-w-32 text-center text-xs text-acento">
          {error}
        </span>
      )}
    </div>
  );
}
