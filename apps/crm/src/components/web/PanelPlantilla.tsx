"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CircleCheck } from "lucide-react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { PLANTILLAS, plantilla } from "@tinta/compartido/web/catalogo";
import type { IdPlantilla, Sitio, Tema } from "@tinta/compartido/web/esquema";
import { MiniaturaPlantilla } from "./Miniaturas";
import type { Cambiar } from "./historial";

const mismoTema = (a: Tema, b: Tema) =>
  a.acento.toUpperCase() === b.acento.toUpperCase() && a.modo === b.modo && a.titulos === b.titulos && a.texto === b.texto && a.esquinas === b.esquinas;

/**
 * Cambiar de plantilla nunca toca el contenido. Si el estilo es el de serie se
 * cambia también sin preguntar (con «Deshacer»); si se ha personalizado, se
 * pregunta si conservarlo.
 */
export function PanelPlantilla({ sitio, cambiar }: { sitio: Sitio; cambiar: Cambiar }) {
  const [pendiente, setPendiente] = useState<IdPlantilla | null>(null);

  function aplicar(id: IdPlantilla, conEstilo: boolean) {
    const antes = { plantilla: sitio.plantilla, tema: sitio.tema };
    const p = plantilla(id);
    cambiar((s) => ({ ...s, plantilla: id, tema: conEstilo ? { ...p.tema } : s.tema }));
    setPendiente(null);
    toast(`Ahora usas ${p.nombre}${conEstilo ? " con su estilo" : " con tu estilo"}`, {
      description: "El contenido no ha cambiado.",
      action: { label: "Deshacer", onClick: () => cambiar((s) => ({ ...s, ...antes })) },
    });
  }

  function elegir(id: IdPlantilla) {
    if (id === sitio.plantilla) return;
    if (mismoTema(sitio.tema, plantilla(sitio.plantilla).tema)) aplicar(id, true);
    else setPendiente(id);
  }

  const nombrePendiente = pendiente ? plantilla(pendiente).nombre : "";

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[0.8125rem] leading-snug text-tenue">
        La plantilla decide cómo se ve la web. Puedes cambiarla cuando quieras: los textos, fotos y secciones se conservan.
      </p>
      <ul className="flex flex-col gap-3">
        {PLANTILLAS.map((p) => {
          const on = p.id === sitio.plantilla;
          return (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => elegir(p.id)}
                aria-pressed={on}
                className="group flex w-full flex-col gap-2.5 rounded-xl p-2 text-left transition-[background-color,transform] duration-150 hover:bg-superficie-alta active:scale-[0.99]"
              >
                <span
                  className={`block aspect-[16/10] w-full overflow-hidden rounded-lg ring-1 transition-shadow duration-150 ${
                    on ? "ring-2 ring-texto" : "ring-borde group-hover:ring-tenue/40"
                  }`}
                >
                  <MiniaturaPlantilla id={p.id} />
                </span>
                <span className="flex flex-col gap-0.5 px-0.5">
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-texto">{p.nombre}</span>
                    {on && (
                      <span className="flex items-center gap-1 text-xs font-medium text-texto">
                        <CircleCheck className="size-3.5" aria-hidden />
                        En uso
                      </span>
                    )}
                  </span>
                  <span className="text-[0.8125rem] leading-snug text-tenue">{p.descripcion}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <Dialog open={pendiente != null} onOpenChange={(o) => !o && setPendiente(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>¿Usar también el estilo de {nombrePendiente}?</DialogTitle>
            <DialogDescription>
              Has cambiado el color, las letras o las esquinas. Puedes llevarte tu estilo a {nombrePendiente} o usar el que trae de serie. El
              contenido no cambia en ningún caso.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => pendiente && aplicar(pendiente, false)}>
              Mantener mi estilo
            </Button>
            <Button onClick={() => pendiente && aplicar(pendiente, true)}>Usar el estilo de {nombrePendiente}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
