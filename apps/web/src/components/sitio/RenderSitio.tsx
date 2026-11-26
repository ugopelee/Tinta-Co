import type { ComponentType } from "react";
import type { Seccion, Sitio, TipoSeccion } from "@tinta/compartido/web/esquema";
import { variablesTema } from "@tinta/compartido/web/tema";
import type { DatosWeb, PropsSeccion } from "./contrato";
import { PLANTILLAS_WEB } from "./plantillas";

/**
 * Pinta un sitio con su plantilla. Lo usan la web pública (`/`) y la vista
 * previa del editor (`/vista-previa`).
 *
 * Cada sección va envuelta en un div con `id` (su ancla) y `data-seccion`
 * (para que el editor la resalte). La primera sección de cada tipo también
 * responde al ancla del tipo (#servicios, #reserva…), que es lo que usan los
 * botones por defecto.
 */
const sinAsteriscos = <T extends Seccion>(s: T): T => {
  const r: Record<string, unknown> = { ...s };
  for (const k of ["titulo", "antetitulo"]) if (typeof r[k] === "string") r[k] = (r[k] as string).replace(/\*([^*]+)\*/g, "$1");
  return r as T;
};

export function RenderSitio({ sitio, datos, vista = false }: { sitio: Sitio; datos: DatosWeb; vista?: boolean }) {
  const { Marco, secciones } = PLANTILLAS_WEB[sitio.plantilla] ?? PLANTILLAS_WEB.lamina;
  // *palabra* marca énfasis; solo Revista lo pinta en cursiva, las demás quitan los asteriscos.
  const visibles = sitio.secciones
    .filter((s) => s.visible)
    .map((s) => (sitio.plantilla === "revista" ? s : sinAsteriscos(s)));
  const ids = new Set(visibles.map((s) => s.id));
  const tiposVistos = new Set<TipoSeccion>();

  return (
    <div
      data-plantilla={sitio.plantilla}
      data-modo={sitio.tema.modo}
      style={variablesTema(sitio)}
      className="web min-h-dvh bg-[var(--w-fondo)] text-[var(--w-tinta)] [font-family:var(--w-texto),ui-sans-serif,system-ui,sans-serif]"
    >
      <Marco sitio={sitio} datos={datos} vista={vista}>
        {visibles.map((seccion, indice) => {
          const Componente = secciones[seccion.tipo] as ComponentType<PropsSeccion<TipoSeccion>>;
          const anclaTipo = !tiposVistos.has(seccion.tipo) && !ids.has(seccion.tipo);
          tiposVistos.add(seccion.tipo);
          return (
            <div key={seccion.id} id={seccion.id} data-seccion={seccion.id} className="relative scroll-mt-20">
              {anclaTipo && <span id={seccion.tipo} className="absolute top-0" aria-hidden />}
              <Componente seccion={seccion} sitio={sitio} datos={datos} vista={vista} indice={indice} />
            </div>
          );
        })}
      </Marco>
    </div>
  );
}
