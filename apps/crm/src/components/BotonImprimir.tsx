"use client";

import { Icono } from "@/components/Icono";

export function BotonImprimir() {
  return (
    <button type="button" onClick={() => window.print()} className="boton-fantasma print:hidden">
      <Icono nombre="descargar" className="h-4 w-4" />
      Imprimir / PDF
    </button>
  );
}
