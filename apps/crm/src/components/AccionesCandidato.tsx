"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { cambiarEstadoCandidato, contratarCandidato } from "@/app/acciones-equipo";
import { Icono } from "@/components/Icono";
import { TarjetaCredenciales } from "@/components/TarjetaCredenciales";
import type { ResultadoAlta } from "@/lib/equipo";

type Fase = "nuevo" | "entrevista" | "oferta" | "descartado";

const SIGUIENTE: Partial<Record<Fase, { fase: Fase; texto: string }>> = {
  nuevo: { fase: "entrevista", texto: "Citar a entrevista" },
  entrevista: { fase: "oferta", texto: "Hacer oferta" },
};

/**
 * Botones de un proceso abierto: avanzar de fase, descartar y contratar.
 * Al contratar se enseñan aquí las credenciales nuevas, una sola vez.
 */
export function AccionesCandidato({ id, nombre, estado }: { id: string; nombre: string; estado: Fase }) {
  const [error, setError] = useState("");
  const [alta, setAlta] = useState<ResultadoAlta | null>(null);
  const [ocupado, iniciar] = useTransition();

  function mover(fase: Fase) {
    iniciar(async () => {
      const resultado = await cambiarEstadoCandidato(id, fase);
      setError(resultado.ok ? "" : resultado.mensaje);
    });
  }

  function contratar() {
    iniciar(async () => {
      const resultado = await contratarCandidato(id);
      if (resultado.estado === "ok") {
        setError("");
        setAlta(resultado);
      } else {
        setError(resultado.mensaje);
      }
    });
  }

  if (alta) {
    return (
      <div className="mt-3 space-y-3">
        <p className="flex flex-wrap items-center gap-2 text-sm">
          <Icono nombre="bien" className="h-4 w-4 text-verde" />
          <span className="flex-1">{alta.mensaje}</span>
          {alta.empleadoId && (
            <Link href={`/equipo/${alta.empleadoId}`} className="font-medium underline-offset-4 hover:underline">
              Ver su ficha
            </Link>
          )}
        </p>
        {alta.credenciales && <TarjetaCredenciales credenciales={alta.credenciales} nombre={nombre} />}
      </div>
    );
  }

  const siguiente = SIGUIENTE[estado];

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {estado === "descartado" ? (
        <button type="button" disabled={ocupado} onClick={() => mover("nuevo")} className="boton-fantasma">
          Reabrir
        </button>
      ) : (
        <>
          {siguiente && (
            <button type="button" disabled={ocupado} onClick={() => mover(siguiente.fase)} className="boton-fantasma">
              <Icono nombre="flecha" className="h-4 w-4" />
              {siguiente.texto}
            </button>
          )}
          <button
            type="button"
            disabled={ocupado}
            onClick={contratar}
            className="inline-flex items-center gap-1.5 rounded-full bg-lima px-3.5 py-1.5 text-sm font-medium text-sobre-lima disabled:opacity-50"
          >
            <Icono nombre="alta" className="h-4 w-4" />
            {ocupado ? "Un momento…" : "Contratar"}
          </button>
          <button type="button" disabled={ocupado} onClick={() => mover("descartado")} className="boton-fantasma">
            <Icono nombre="cerrar" className="h-4 w-4" />
            Descartar
          </button>
        </>
      )}
      {error && <span className="text-sm text-acento">{error}</span>}
    </div>
  );
}
