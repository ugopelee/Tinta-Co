import { notasEvaluacion } from "@tinta/compartido/estudio";
import { Icono } from "@/components/Icono";

/** Nota de 1 a 5 en estrellas, con el nombre al lado para no depender del dibujo. */
export function Estrellas({ nota, conNombre = true }: { nota: number; conNombre?: boolean }) {
  const nombre = notasEvaluacion.find((opcion) => opcion.nota === nota)?.nombre ?? "";

  return (
    <span className="inline-flex items-center gap-2" title={`${nota} de 5 · ${nombre}`}>
      <span className="flex" aria-label={`${nota} de 5`}>
        {[1, 2, 3, 4, 5].map((posicion) => (
          <Icono
            key={posicion}
            nombre="estrella"
            className={`h-4 w-4 ${posicion <= nota ? "fill-amarillo text-amarillo" : "text-borde"}`}
          />
        ))}
      </span>
      {conNombre && (
        <span className="text-xs text-tenue">
          {nota} · {nombre}
        </span>
      )}
    </span>
  );
}
