"use client";

import { useMemo, useRef, useState } from "react";
import { irAProgreso, Revelar, useProgresoFijado } from "@/components/animaciones";
import { LienzoAguja } from "@/components/LienzoAguja";
import { llevarPiezaAlFormulario } from "@/lib/eventos";
import { focoDe } from "@/lib/flash";
import type { Diseno } from "@tinta/compartido/tipos";

const euros = (valor: number | null) =>
  valor === null
    ? ""
    : Number(valor).toLocaleString("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

/** Las que caben en la hoja: el resto sigue en el formulario de reserva. */
const MAX_PIEZAS = 4;

/**
 * Una hoja de flash de cuatro piezas. La sección se queda fija y cada tramo de
 * scroll es una pieza: su calco aparece a la derecha y la aguja lo entinta
 * mientras bajas. Los datos cambian deslizándose por detrás de una máscara.
 */
export function Catalogo({ disenos }: { disenos: Diseno[] }) {
  // Lo que se publica desde el CRM es lo que sale aquí: misma tabla, mismas fotos.
  // Memorizado: el lienzo reinicia su animación si cambian estas listas.
  const { piezas, imagenes, focos } = useMemo(() => {
    const piezas = disenos
      .filter((d) => d.imagen_url)
      .slice(0, MAX_PIEZAS)
      .map((d) => ({
        id: d.id,
        nombre: d.nombre,
        estilo: d.estilo ?? "",
        tamano: d.tamano_aprox ?? "",
        precio: d.precio,
        foto: d.imagen_url as string,
      }));
    return {
      piezas,
      imagenes: piezas.map((p) => p.foto),
      focos: piezas.map((p) => focoDe(p.foto)),
    };
  }, [disenos]);
  const total = piezas.length;

  const seccion = useRef<HTMLElement>(null);
  const barras = useRef<HTMLDivElement>(null);
  const activa = useRef(0);
  const entintado = useRef(0);
  const [indice, setIndice] = useState(0);

  useProgresoFijado(seccion, (p) => {
    const u = Math.min(total - 1e-6, p * total);
    const i = Math.floor(u);
    const dentro = u - i;
    activa.current = i;
    // La pieza se entinta en los dos primeros tercios de su tramo y el
    // último se queda terminada, para mirarla.
    entintado.current = Math.min(1, dentro / 0.66);

    barras.current?.querySelectorAll<HTMLElement>("[data-relleno]").forEach((barra, k) => {
      const lleno = k < i ? 1 : k > i ? 0 : dentro;
      barra.style.transform = `scaleX(${lleno})`;
    });
    setIndice((actual) => (actual === i ? actual : i));
  });

  const pieza = piezas[indice];
  if (!pieza) return null;
  // Cada dato vive en una máscara: el que sale sube y el que entra llega de abajo.
  const posicion = (k: number) =>
    k === indice ? "translate-y-0 opacity-100" : k < indice ? "-translate-y-full opacity-0" : "translate-y-full opacity-0";
  const mascara = "transition-[transform,opacity] duration-[650ms] ease-[cubic-bezier(0.23,1,0.32,1)]";

  return (
    <section
      ref={seccion}
      id="catalogo"
      data-forma="monograma"
      data-lado="oculto"
      data-fondo="#1a0a12"
      data-tono="#f27ba3"
      className="relative"
      style={{ height: `${total * 75 + 100}svh` }}
    >
      <div className="sticky top-0 flex h-[100svh] flex-col overflow-hidden">
        <div className="contenedor grid grid-cols-1 min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] gap-6 pb-8 pt-24 lg:grid-cols-2 lg:grid-rows-1 lg:items-center lg:gap-10 lg:pb-12 lg:pt-24">
          {/* Lámina: el dibujo en calco y la aguja. */}
          <div className="relative order-1 h-[34svh] lg:order-2 lg:h-[74svh]">
            <Esquinas />
            <LienzoAguja imagenes={imagenes} focos={focos} activa={activa} entintado={entintado} className="h-full w-full" />
          </div>

          <div className="order-2 lg:order-1">
            <Revelar>
              <div className="flex items-baseline justify-between gap-4 border-b border-white/12 pb-4">
                <h2 className="etiqueta">Flash disponible</h2>
                <p className="cifra text-xs text-tenue">
                  {String(indice + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
                </p>
              </div>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-tenue">
                Diseños originales del estudio. Cada uno se tatúa una sola vez.
              </p>
            </Revelar>

            {/* Nombre */}
            <div className="relative mt-6 h-[1.3em] overflow-hidden text-[clamp(2.2rem,4.2vw,4.6rem)] leading-[1.05] lg:mt-10">
              {piezas.map((p, k) => (
                <p
                  key={p.id}
                  aria-hidden={k !== indice}
                  className={`titular absolute inset-x-0 top-0 whitespace-nowrap pb-[0.2em] ${mascara} ${posicion(k)}`}
                >
                  <span className="serif-cursiva text-[1.06em]">{p.nombre}</span>
                </p>
              ))}
            </div>

            {/* Estilo, tamaño y precio */}
            <div className="relative mt-2 h-7 overflow-hidden">
              {piezas.map((p, k) => (
                <p
                  key={p.id}
                  aria-hidden={k !== indice}
                  className={`absolute inset-x-0 top-0 flex items-baseline gap-4 text-tenue ${mascara} ${posicion(k)}`}
                  style={{ transitionDelay: k === indice ? "60ms" : "0ms" }}
                >
                  <span className="text-sm">{p.estilo}</span>
                  <span className="text-sm">{p.tamano}</span>
                  <span className="cifra ml-auto text-lg text-texto lg:ml-6">{euros(p.precio)}</span>
                </p>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 lg:mt-10">
              <button
                type="button"
                onClick={() => llevarPiezaAlFormulario(pieza.nombre)}
                className="group flex items-center gap-2 rounded-full bg-texto px-5 py-2.5 text-sm text-fondo transition-[transform,background-color] duration-150 ease-out hover:bg-acento-suave active:scale-[0.97]"
              >
                Reservar esta pieza
                <span
                  aria-hidden
                  className="transition-transform duration-200 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                >
                  ↗
                </span>
              </button>
            </div>

            {/* Índice: una barra por pieza que se llena con el scroll. */}
            <div ref={barras} className="mt-10 flex gap-1.5 lg:mt-16">
              {piezas.map((p, k) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => seccion.current && irAProgreso(seccion.current, (k + 0.7) / total)}
                  aria-label={`Ver ${p.nombre}`}
                  aria-current={k === indice}
                  className="group relative h-6 flex-1"
                >
                  <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-white/12 transition-colors duration-200 group-hover:bg-white/30" />
                  <span
                    data-relleno
                    className="absolute inset-x-0 top-1/2 h-px origin-left bg-texto"
                    style={{ transform: "scaleX(0)", marginTop: "-0.5px" }}
                  />
                </button>
              ))}
            </div>
            <a
              href="#reserva"
              className="enlace-sutil mt-3 inline-block text-xs text-tenue transition-colors hover:text-texto"
            >
              Hay más flash en el estudio: pregúntanos en el formulario
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Marcas de corte en las esquinas, como en una lámina impresa. */
function Esquinas() {
  const base = "pointer-events-none absolute h-4 w-4 border-white/25";
  return (
    <>
      <span aria-hidden className={`${base} left-0 top-0 border-l border-t`} />
      <span aria-hidden className={`${base} right-0 top-0 border-r border-t`} />
      <span aria-hidden className={`${base} bottom-0 left-0 border-b border-l`} />
      <span aria-hidden className={`${base} bottom-0 right-0 border-b border-r`} />
    </>
  );
}
