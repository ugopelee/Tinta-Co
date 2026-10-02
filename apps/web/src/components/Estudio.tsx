"use client";

import { useEffect, useRef } from "react";
import { estudio } from "@tinta/compartido/estudio";
import { Contador, Revelar } from "@/components/animaciones";
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

/** Posición de cada cifra sobre la regla, en centímetros de 0 a 20. */
const MARCAS = [2, 7, 12.5, 17.5];

/**
 * El estudio en tres tiempos: una apertura con el titular sobre la esfera de
 * puntos, el proceso como una rueda que gira con el scroll, y las cifras
 * medidas sobre una regla de tatuador.
 */
export function Estudio() {
  const regla = useRef<HTMLDivElement>(null);

  // El cursor de la regla avanza con el scroll.
  useEffect(() => {
    const marco = regla.current;
    if (!marco) return;
    const menos = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let pendiente = 0;
    const actualizar = () => {
      pendiente = 0;
      const caja = marco.getBoundingClientRect();
      const alto = window.innerHeight;
      const p = menos ? 1 : Math.min(1, Math.max(0, (alto * 0.95 - caja.top) / (caja.height + alto * 0.4)));
      marco.style.setProperty("--avance", p.toFixed(4));
    };
    const alMoverse = () => {
      if (!pendiente) pendiente = requestAnimationFrame(actualizar);
    };
    actualizar();
    window.addEventListener("scroll", alMoverse, { passive: true });
    window.addEventListener("resize", alMoverse);
    return () => {
      window.removeEventListener("scroll", alMoverse);
      window.removeEventListener("resize", alMoverse);
      if (pendiente) cancelAnimationFrame(pendiente);
    };
  }, []);

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

      {/* Proceso y cifras: los puntos se apagan, mandan las fotos. */}
      <div id="proceso" data-forma="monograma" data-lado="oculto" className="scroll-mt-0">
      <RuedaProceso pasos={PROCESO} rotulo="Cómo trabajamos" />

      <div className="pb-28 pt-10 md:pb-40">
        {/* Las cifras sobre una regla de tatuador, de 0 a 20 cm. */}
      <div className="contenedor mt-24 md:mt-32">
        <div ref={regla} className="relative" style={{ ["--avance" as string]: 0 }}>
          <dl className="relative grid grid-cols-2 gap-y-10 pb-14 md:block md:h-40">
            {estudio.cifras.map((cifra, i) => (
              <div
                key={cifra.etiqueta}
                className="flex flex-col-reverse md:absolute md:bottom-14 md:pl-4 md:transition-opacity md:duration-300"
                style={{
                  left: `${(MARCAS[i] / 20) * 100}%`,
                  // Se enciende cuando el cursor de la regla llega a su marca.
                  opacity: `clamp(0.28, calc((var(--avance) * 20 - ${MARCAS[i]} + 1.2) * 0.9), 1)`,
                }}
              >
                {/* Filete que baja de la cifra a su marca. */}
                <span aria-hidden className="absolute left-0 top-2 hidden h-[calc(100%+3.5rem-0.5rem)] w-px bg-white/25 md:block" />
                <dt className="mono mt-2 text-tenue">{cifra.etiqueta}</dt>
                <dd className="titular cifra whitespace-nowrap text-5xl md:text-7xl">
                  <Contador valor={cifra.valor} sufijo={cifra.sufijo} />
                </dd>
              </div>
            ))}
          </dl>

          <div aria-hidden className="relative h-10 border-t border-white/25">
            {/* Milímetros, medios y centímetros, con gradientes repetidos. */}
            <div
              className="absolute inset-x-0 top-0 h-2"
              style={{ background: "repeating-linear-gradient(90deg, rgb(255 255 255 / 0.18) 0 1px, transparent 1px calc(100% / 200))" }}
            />
            <div
              className="absolute inset-x-0 top-0 h-3.5"
              style={{ background: "repeating-linear-gradient(90deg, rgb(255 255 255 / 0.3) 0 1px, transparent 1px calc(100% / 40))" }}
            />
            <div
              className="absolute inset-x-0 top-0 h-5"
              style={{ background: "repeating-linear-gradient(90deg, rgb(255 255 255 / 0.55) 0 1px, transparent 1px calc(100% / 20))" }}
            />
            {[0, 5, 10, 15].map((cm) => (
              <span key={cm} className="mono absolute top-6 -translate-x-1/2 text-[0.65rem] text-tenue/70" style={{ left: `${(cm / 20) * 100}%` }}>
                {cm}
              </span>
            ))}
            <span className="mono absolute right-0 top-6 text-[0.65rem] text-tenue/70">20 cm</span>
            {/* El cursor rojo recorre la regla al bajar. */}
            <span
              className="absolute -top-3 h-8 w-px bg-acento-suave shadow-[0_0_12px_var(--acento-suave)]"
              style={{ left: "calc(var(--avance) * 100%)" }}
            />
          </div>
        </div>
      </div>
      </div>
      </div>
    </section>
  );
}
