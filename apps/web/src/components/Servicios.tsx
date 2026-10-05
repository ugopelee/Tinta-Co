"use client";

import { useRef, useState } from "react";
import { estudio } from "@tinta/compartido/estudio";
import { irAProgreso, Revelar, useProgresoFijado } from "@/components/animaciones";
import { HiloTinta } from "@/components/HiloTinta";

const servicios = estudio.servicios;
const N = servicios.length;

/** "Diseño personalizado" → ["Diseño", "personalizado"]: la última va en cursiva. */
function partir(nombre: string) {
  const palabras = nombre.split(" ");
  return [palabras.slice(0, -1).join(" "), palabras[palabras.length - 1]] as const;
}

/**
 * Cada servicio tiene su color: fondo muy oscuro teñido y un tono vivo para
 * la cursiva, el hilo y los puntos. Van en el mismo orden que los servicios.
 */
const COLORES: { fondo: string; tono: string }[] = [
  { fondo: "#1b0d0a", tono: "#ef7a5f" }, // flash: el rojo de siempre
  { fondo: "#120e24", tono: "#a795ff" }, // a medida: el violeta del calco
  { fondo: "#07191a", tono: "#52d1b4" }, // piercing: verde acero
  { fondo: "#1a1408", tono: "#f0b85a" }, // retoque: ámbar
];

const mezclarHex = (a: string, b: string, t: number) => {
  const x = parseInt(a.slice(1), 16);
  const y = parseInt(b.slice(1), 16);
  const canal = (d: number) => Math.round(((x >> d) & 255) + (((y >> d) & 255) - ((x >> d) & 255)) * t);
  return "#" + [16, 8, 0].map((d) => canal(d).toString(16).padStart(2, "0")).join("");
};

/** Parte del recorrido de cada servicio que se queda quieto para leerlo. */
const PAUSA = 0.45;

/**
 * Progreso del scroll → posición del carril, en hojas. Cada servicio ocupa
 * un tramo igual del scroll; en el centro del tramo la hoja se queda quieta
 * y solo en los bordes se desliza a la siguiente, con entrada y salida suaves.
 */
function avanceDe(p: number) {
  const u = Math.min(N - 1e-6, Math.max(0, p * N - 0.5));
  const i = Math.floor(u);
  const f = Math.min(1, Math.max(0, (u - i - PAUSA / 2) / (1 - PAUSA)));
  return Math.min(N - 1, i + f * f * (3 - 2 * f));
}

/**
 * En escritorio la sección se queda fija y el scroll vertical desliza los
 * servicios de lado, como pasar las hojas de una carpeta. Abajo, un hilo de
 * tinta avanza con ellos y hace de índice. En móvil, uno debajo de otro.
 * La figura de puntos del lienzo cambia con el servicio (`data-forma`).
 */
export function Servicios() {
  const seccion = useRef<HTMLElement>(null);
  const carril = useRef<HTMLDivElement>(null);
  const progreso = useRef(0);
  const [activo, setActivo] = useState(0);

  useProgresoFijado(seccion, (p) => {
    progreso.current = avanceDe(p) / (N - 1);
    const nodoCarril = carril.current;
    const nodoSeccion = seccion.current;
    if (!nodoCarril || !nodoSeccion) return;

    const ancha = window.matchMedia("(min-width: 1024px)").matches;
    let indice: number;

    if (ancha) {
      const avance = avanceDe(p);
      nodoCarril.style.transform = `translate3d(${-avance * 100}vw,0,0)`;
      indice = Math.round(avance);

      // Capas a distinta velocidad dentro de cada hoja: el titular llega
      // antes que el texto y se va después.
      nodoCarril.querySelectorAll<HTMLElement>("[data-hoja]").forEach((hoja, i) => {
        const desvio = i - avance;
        hoja.querySelectorAll<HTMLElement>("[data-capa]").forEach((capa) => {
          const factor = Number(capa.dataset.capa);
          capa.style.transform = `translate3d(${desvio * factor * 22}vw,0,0)`;
          capa.style.opacity = String(Math.max(0, 1 - Math.abs(desvio) * (0.9 + factor)));
        });
      });
    } else {
      nodoCarril.style.transform = "";
      const linea = window.innerHeight * 0.8;
      const hojas = nodoCarril.querySelectorAll<HTMLElement>("[data-hoja]");
      indice = 0;
      hojas.forEach((hoja, i) => {
        if (hoja.getBoundingClientRect().top < linea) indice = i;
      });
    }

    // El color sigue al carril: entre dos servicios, la mezcla de ambos.
    const posicion = ancha ? avanceDe(p) : indice;
    const a = Math.floor(posicion);
    const b = Math.min(N - 1, a + 1);
    const f = posicion - a;
    nodoSeccion.dataset.fondo = mezclarHex(COLORES[a].fondo, COLORES[b].fondo, f);
    nodoSeccion.dataset.tono = mezclarHex(COLORES[a].tono, COLORES[b].tono, f);
    window.dispatchEvent(new Event("tintaco:tono"));

    setActivo((actual) => (actual === indice ? actual : indice));
  });

  const ir = (indice: number) => {
    if (seccion.current) irAProgreso(seccion.current, (indice + 0.5) / N);
  };

  return (
    <section
      ref={seccion}
      id="servicios"
      data-forma={`servicio-${activo}`}
      data-fondo={COLORES[0].fondo}
      data-tono={COLORES[0].tono}
      className="relative scroll-mt-0 lg:h-[420vh]"
    >
      <div className="lg:sticky lg:top-0 lg:flex lg:h-[100svh] lg:flex-col lg:overflow-hidden">
        <div className="contenedor pt-28 lg:pt-28">
          <Revelar>
            <h2 className="flex items-baseline gap-4 text-tenue">
              <span className="etiqueta">Servicios</span>
              <span className="serif-cursiva text-lg text-texto/70">lo que hacemos en el estudio</span>
            </h2>
          </Revelar>
        </div>

        <div
          ref={carril}
          className="flex flex-col will-change-transform lg:min-h-0 lg:flex-1 lg:flex-row"
        >
          {servicios.map((servicio, indice) => {
            const [inicio, fin] = partir(servicio.nombre);
            return (
              <article
                key={servicio.id}
                data-hoja
                aria-label={servicio.nombre}
                className="flex shrink-0 items-center py-16 lg:w-screen lg:py-0"
              >
                <div className="contenedor grid grid-cols-1 lg:grid-cols-2">
                  <div>
                    <Revelar>
                      <h3
                        data-capa="0.35"
                        className="titular text-[clamp(3.2rem,6.6vw,7.2rem)] leading-[0.92]"
                      >
                        {inicio && <span className="block">{inicio}</span>}
                        {/* La cursiva se escribe de izquierda a derecha al llegar y se
                            borra si vuelves hacia atrás. */}
                        <span
                          className="serif-cursiva block pl-[0.06em] pr-[0.1em] text-[1.08em] text-acento-suave transition-[clip-path] duration-[1100ms] ease-[cubic-bezier(0.65,0,0.35,1)]"
                          style={{
                            clipPath:
                              indice <= activo ? "inset(-20% -5% -20% 0)" : "inset(-20% 100% -20% 0)",
                          }}
                        >
                          {fin}
                        </span>
                      </h3>
                    </Revelar>

                    <Revelar retardo={90}>
                      <p
                        data-capa="0.7"
                        className="parrafo mt-8 max-w-sm text-[0.98rem] text-tenue"
                      >
                        {servicio.descripcion}
                      </p>
                    </Revelar>

                    <Revelar retardo={160}>
                      <div data-capa="1" className="mt-10 flex max-w-sm items-center gap-5">
                        <span className="cifra text-xl">{servicio.detalle}</span>
                        <span className="h-px min-w-4 flex-1 bg-white/12" />
                        <a
                          href="#reserva"
                          className="group flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-white/15 px-4 py-2 text-sm transition-[transform,background-color,color] duration-150 ease-out hover:bg-texto hover:text-fondo active:scale-[0.97]"
                        >
                          Pedir cita
                          <span
                            aria-hidden
                            className="transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                          >
                            ↗
                          </span>
                        </a>
                      </div>
                    </Revelar>
                  </div>
                </div>
                <span className="sr-only">
                  {indice + 1} de {N}
                </span>
              </article>
            );
          })}
        </div>

        {/* Índice: el hilo de tinta y, debajo, los nombres como paradas. */}
        <div className="contenedor hidden pb-10 lg:block">
          <HiloTinta progreso={progreso} paradas={N} className="h-12 w-full" />
          <div className="relative mt-2 h-5">
            {servicios.map((servicio, indice) => {
              const f = indice / (N - 1);
              return (
                <button
                  key={servicio.id}
                  type="button"
                  onClick={() => ir(indice)}
                  className={`absolute top-0 whitespace-nowrap text-xs transition-colors duration-200 ${
                    indice === activo ? "text-texto" : "text-tenue/70 hover:text-texto"
                  }`}
                  style={{
                    left: `calc(8px + (100% - 16px) * ${f})`,
                    transform: `translateX(${indice === 0 ? "-8px" : indice === N - 1 ? "calc(-100% + 8px)" : "-50%"})`,
                  }}
                >
                  {servicio.nombre}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
