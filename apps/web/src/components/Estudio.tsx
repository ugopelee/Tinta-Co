"use client";

import { estudio } from "@tinta/compartido/estudio";
import { Revelar } from "@/components/animaciones";
import { NEGRO_PORTADA, ORLA } from "@/components/PapelRasgado";
import { RuedaProceso, type PasoProceso } from "@/components/RuedaProceso";
import { fotosEstudio } from "@/lib/flash";

/** Lo que pasa desde que entras por la puerta hasta que te vas curado. */
const PROCESO: PasoProceso[] = [
  {
    titulo: "La idea",
    texto: "Vienes con una referencia, una frase o nada. Miramos juntos la pared de flash y hablamos de tamaño, zona y presupuesto.",
    foto: fotosEstudio.pared,
  },
  {
    titulo: "El boceto",
    texto: "Lo dibujamos a mano y lo ajustamos las veces que haga falta. Los cambios no se cobran.",
    foto: fotosEstudio.boceto,
  },
  {
    titulo: "El calco",
    texto: "Pasamos el diseño a papel de calco y lo colocamos sobre la piel. Si no te convence cómo cae, se mueve.",
    foto: fotosEstudio.calco,
  },
  {
    titulo: "El material",
    texto: "Agujas, film y guantes de un solo uso. Todo se abre delante de ti y se tira al acabar.",
    foto: fotosEstudio.maquina,
  },
  {
    titulo: "La sesión",
    texto: "Una sola sesión abierta a la vez: nadie espera en la puerta y nadie tiene prisa.",
    foto: fotosEstudio.sesion,
  },
  {
    titulo: "La cura",
    texto: "Te llevas la guía de cuidados por escrito y revisamos la pieza al mes. El retoque, si hace falta, es gratis.",
    foto: fotosEstudio.guantes,
  },
];

/**
 * El estudio en dos tiempos: una apertura con el titular sobre la esfera de
 * puntos y el proceso como una rueda que gira con el scroll.
 */
export function Estudio() {
  return (
    <section id="estudio" data-fondo="#0a0e20" data-tono="#8f9dff" className="relative scroll-mt-0">
      {/* Puente con la portada: sube por debajo de su orla de tinta (que
          deja ver lo de detrás por los huecos) con el mismo negro, y luego
          se disuelve en el azul del estudio. Ni recta ni cambio de golpe.
          Va fuera del bloque de apertura, que recorta lo que sobresale. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -z-10"
        style={{
          top: `calc(-1 * ${ORLA})`,
          height: `calc(${ORLA} + 75svh)`,
          background: `linear-gradient(to bottom, ${NEGRO_PORTADA} 0%, ${NEGRO_PORTADA} 24%, color-mix(in srgb, ${NEGRO_PORTADA} 55%, transparent) 55%, transparent 100%)`,
        }}
      />
      {/* Apertura: el formato de la antigua portada, con los textos del
          estudio. La esfera de puntos hace de fondo. */}
      <div
        data-forma="esfera"
        data-lado="detras"
        className="relative flex min-h-[100svh] items-center overflow-hidden"
      >
        <div aria-hidden className="reticula pointer-events-none absolute inset-0 -z-10" />
        <div className="contenedor py-28">
          <Revelar>
            <p className="etiqueta flex items-center gap-3">
              <span className="h-px w-8 bg-white/20" />
              El estudio · Madrid
            </p>
          </Revelar>
          <Revelar retardo={120}>
            <h2 className="titular mt-6 text-[clamp(3rem,7vw,6.4rem)] leading-[0.98]">
              Tres artistas,
              <br />
              una sola sesión
              <br />
              <span className="serif-cursiva text-[1.1em] text-acento-suave">y ninguna prisa.</span>
            </h2>
          </Revelar>
          <Revelar retardo={260}>
            <p className="parrafo mt-8 max-w-md text-[0.95rem] text-tenue">{estudio.descripcion}</p>
          </Revelar>
          <Revelar retardo={380}>
            <a
              href="#proceso"
              className="group mt-10 inline-flex items-center gap-3 text-sm text-texto/80 transition-colors hover:text-texto"
            >
              <span className="enlace-sutil">Cómo trabajamos</span>
              <span aria-hidden className="transition-transform duration-200 ease-out group-hover:translate-y-0.5">
                ↓
              </span>
            </a>
          </Revelar>
        </div>
      </div>

      {/* Proceso: los puntos se apagan, mandan las fotos. */}
      <div id="proceso" data-forma="monograma" data-lado="oculto" className="scroll-mt-0">
      <RuedaProceso pasos={PROCESO} rotulo="Cómo trabajamos" />
      </div>
    </section>
  );
}
