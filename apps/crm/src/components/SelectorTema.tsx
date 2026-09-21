"use client";

import { useSyncExternalStore } from "react";
import { Icono } from "@/components/Icono";
import {
  aplicarTema,
  leerTema,
  suscribirTema,
  temaPorDefecto,
} from "@/lib/preferencias";

/**
 * Un solo botón que conmuta. El icono muestra el tema al que se va, no el
 * que está puesto: es lo que espera quien lo pulsa.
 */
export function SelectorTema() {
  const tema = useSyncExternalStore(suscribirTema, leerTema, temaPorDefecto);
  const siguiente = tema === "oscuro" ? "claro" : "oscuro";

  return (
    <button
      type="button"
      onClick={() => aplicarTema(siguiente)}
      title={`Cambiar a modo ${siguiente}`}
      aria-label={`Cambiar a modo ${siguiente}`}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-borde text-tenue transition-colors duration-200 hover:bg-superficie-alta hover:text-texto"
    >
      <Icono
        nombre={tema === "oscuro" ? "sol" : "luna"}
        className="h-[17px] w-[17px]"
      />
    </button>
  );
}
