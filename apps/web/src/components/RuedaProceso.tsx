"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { irAProgreso, useProgresoFijado } from "@/components/animaciones";

export type PasoProceso = { titulo: string; texto: string; foto: string };

/*
 * El proceso del estudio como una rueda que gira con el scroll.
 *
 * En reposo, las fotos forman un anillo alrededor del título, cada una
 * tangente al círculo. El primer tramo de scroll abre el anillo en un tambor
 * vertical: la foto de delante queda plana y a tamaño completo, y las de
 * arriba y abajo giran en perspectiva y se van por los bordes. Seguir bajando
 * trae el siguiente paso al frente.
 *
 * Todo cuelga de un número, `giro`: 0 es el anillo, 1 el tambor con el primer
 * paso delante y cada entero más, un paso más. Un único bucle de rAF escribe
 * las transformaciones en el DOM. La idea viene de un índice de portfolio que
 * se movía con la rueda del ratón; aquí la mueve el scroll de la página, que
 * en una landing es lo que el lector ya está haciendo, sin secuestrarle nada.
 */

/* Geometría, relativa al escenario y luego a la tarjeta. PASO frente a TAMBOR
   decide cuánto giran las vecinas; TAMBOR frente a LENTE, si caen dentro del
   marco o se salen. ARCO curva la tira hacia la izquierda: sin él sería una
   pila de tarjetas y no una rueda vista de lado. */
const ALTO_TARJETA = 0.4;
const ANCHO_MAX = 0.36;
const PROPORCION = 1.45;
const PASO = 40;
const TAMBOR = 2.22;
const LENTE = 2.7;
const ANILLO = 1.14;
const ARCO = 1.82;
/** Pasos a cada lado del frente que aún merece la pena pintar. */
const CORTE = 1.6;
/** Parte de cada tramo de scroll en que la rueda se queda quieta. */
const PAUSA = 0.4;

const acotar = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const rad = (g: number) => (g * Math.PI) / 180;

/** Cuánto ha llevado el arco hacia la izquierda algo girado `grados` del frente. */
const arcoEn = (grados: number, arco: number) => -arco * (1 - Math.cos(rad(grados)));

/** Anillo y tambor en una sola cadena: `m` pasa de uno a otro. */
function colocar(gradosAnillo: number, gradosTambor: number, radioAnillo: number, radioTambor: number, arco: number, m: number) {
  return (
    `translateX(${m * arcoEn(gradosTambor, arco)}px)` +
    ` rotateZ(${(1 - m) * gradosAnillo}deg) translateY(${-(1 - m) * radioAnillo}px)` +
    ` rotateX(${m * gradosTambor}deg) translateZ(${m * radioTambor}px)`
  );
}

/**
 * Scroll → giro. Cada posición entera (el anillo y cada paso) ocupa un tramo
 * igual de scroll; en el centro del tramo la rueda se para para leer.
 */
function giroDe(p: number, total: number) {
  const u = acotar(p * (total + 1) - 0.5, 0, total);
  const i = Math.floor(u);
  const f = acotar((u - i - PAUSA / 2) / (1 - PAUSA), 0, 1);
  return Math.min(total, i + f * f * (3 - 2 * f));
}

export function RuedaProceso({ pasos, rotulo }: { pasos: PasoProceso[]; rotulo: string }) {
  const seccion = useRef<HTMLElement>(null);
  const escenario = useRef<HTMLDivElement>(null);
  const rueda = useRef<HTMLDivElement>(null);
  const tarjetas = useRef<(HTMLDivElement | null)[]>([]);
  const velos = useRef<(HTMLDivElement | null)[]>([]);
  const etiqueta = useRef<HTMLDivElement>(null);
  const ficha = useRef<HTMLDivElement>(null);

  const giro = useRef(0);
  const objetivo = useRef(0);
  const [activo, setActivo] = useState(0);
  const [medidas, setMedidas] = useState({ w: 0, h: 0 });
  const n = pasos.length;

  useEffect(() => {
    const nodo = escenario.current;
    if (!nodo) return;
    const leer = () => setMedidas({ w: nodo.clientWidth, h: nodo.clientHeight });
    leer();
    const observador = new ResizeObserver(leer);
    observador.observe(nodo);
    return () => observador.disconnect();
  }, []);

  const geo = useMemo(() => {
    const { w, h } = medidas;
    const estrecha = w < 768;
    // En móvil la tarjeta manda por ancho: si no, quedaría diminuta.
    const anchoTarjeta = estrecha ? Math.min(h * 0.3 * PROPORCION, w * 0.78) : Math.min(h * ALTO_TARJETA * PROPORCION, w * ANCHO_MAX);
    const altoTarjeta = anchoTarjeta / PROPORCION;
    const radioAnillo = altoTarjeta * ANILLO;
    const escalaAnillo = n ? acotar((((2 * Math.PI * radioAnillo) / n) * 0.82) / (anchoTarjeta || 1), 0.16, 1) : 1;
    return {
      estrecha,
      anchoTarjeta,
      altoTarjeta,
      radioAnillo,
      escalaAnillo,
      radioTambor: altoTarjeta * TAMBOR,
      arco: estrecha ? 0 : altoTarjeta * ARCO,
      lente: altoTarjeta * LENTE,
    };
  }, [medidas, n]);

  useProgresoFijado(seccion, (p) => {
    objetivo.current = giroDe(p, n);
  });

  useEffect(() => {
    if (!medidas.h) return;
    const menos = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let cuadro = 0;
    let visible = false;
    const { radioAnillo, escalaAnillo, radioTambor, arco } = geo;

    const pintar = () => {
      cuadro = 0;
      if (!visible) return;
      const hueco = objetivo.current - giro.current;
      if (Math.abs(hueco) < 0.0005 || menos) giro.current = objetivo.current;
      else giro.current += hueco * 0.12;

      const t = giro.current;
      const m = acotar(t, 0, 1);
      const pos = Math.max(0, t - 1);

      // El tambor retrocede para que su cara delantera quede en el plano del
      // cuadro; tiene que llegar con él, o el anillo se vería a mitad de tamaño.
      if (rueda.current) rueda.current.style.transform = `translateZ(${-m * radioTambor}px)`;

      for (let i = 0; i < n; i++) {
        const d = i - pos;
        const tarjeta = tarjetas.current[i];
        if (tarjeta) {
          tarjeta.style.transform = colocar(d * (360 / n), d * PASO, radioAnillo, radioTambor, arco, m);
          tarjeta.style.opacity = m > 0.5 && Math.abs(d) > CORTE ? "0" : "1";
          tarjeta.style.zIndex = String(Math.round(100 - Math.abs(d) * 2));
          const cara = tarjeta.firstElementChild as HTMLElement | null;
          if (cara) cara.style.transform = `scale(${escalaAnillo + (1 - escalaAnillo) * m})`;
        }
        // Las que no están delante se apagan: el ojo va a la del frente.
        const velo = velos.current[i];
        if (velo) velo.style.opacity = String(m * Math.min(0.7, Math.abs(d) * 0.7));
      }

      if (etiqueta.current) etiqueta.current.style.opacity = String(1 - m);
      if (ficha.current) ficha.current.style.opacity = String(m);
      const cerca = acotar(Math.round(pos), 0, n - 1);
      setActivo((antes) => (antes === cerca ? antes : cerca));
      cuadro = requestAnimationFrame(pintar);
    };

    const observador = new IntersectionObserver(([entrada]) => {
      visible = entrada.isIntersecting;
      if (visible && !cuadro) cuadro = requestAnimationFrame(pintar);
    });
    if (seccion.current) observador.observe(seccion.current);
    return () => {
      cancelAnimationFrame(cuadro);
      observador.disconnect();
    };
  }, [geo, medidas.h, n]);

  const ir = (i: number) => {
    // Centro del tramo del paso i (el anillo es el tramo 0).
    if (seccion.current) irAProgreso(seccion.current, (i + 1.5) / (n + 1));
  };

  const paso = pasos[activo];

  return (
    <section ref={seccion} aria-label={rotulo} className="relative" style={{ height: `${100 + (n + 1) * 60}svh` }}>
      <div
        ref={escenario}
        className="sticky top-0 h-[100svh] overflow-hidden"
        style={{ perspective: `${geo.lente}px` }}
      >
        <div
          ref={rueda}
          className="absolute left-1/2 [transform-style:preserve-3d]"
          style={{ top: geo.estrecha ? "40%" : "50%" }}
        >
          {pasos.map((p, i) => (
            <div
              key={p.titulo}
              ref={(nodo) => {
                tarjetas.current[i] = nodo;
              }}
              className="absolute [backface-visibility:hidden]"
              style={{
                width: geo.anchoTarjeta,
                height: geo.altoTarjeta,
                marginLeft: -geo.anchoTarjeta / 2,
                marginTop: -geo.altoTarjeta / 2,
              }}
            >
              <div className="relative size-full overflow-hidden rounded-xl bg-superficie shadow-[0_24px_60px_-24px_rgb(0_0_0/0.9)]">
                <Image src={p.foto} alt={p.titulo} fill sizes="(min-width: 768px) 36vw, 78vw" className="object-cover" draggable={false} />
                <span className="mono absolute left-3 top-3 rounded-full bg-fondo/70 px-2 py-0.5 text-texto backdrop-blur-sm">
                  0{i + 1}
                </span>
                <div
                  ref={(nodo) => {
                    velos.current[i] = nodo;
                  }}
                  aria-hidden
                  className="absolute inset-0 bg-fondo"
                  style={{ opacity: 0 }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* En el anillo, el título; en el tambor, la ficha del paso de delante. */}
        <div ref={etiqueta} className="pointer-events-none absolute inset-0 grid place-items-center">
          <p className="titular text-center text-[clamp(1.6rem,3.4vw,3rem)] leading-none">
            {rotulo.split(" ").slice(0, -1).join(" ")}{" "}
            <span className="serif-cursiva text-acento-suave">{rotulo.split(" ").slice(-1)}</span>
          </p>
        </div>

        <div
          ref={ficha}
          className={`pointer-events-none absolute opacity-0 ${
            geo.estrecha
              ? "inset-x-0 bottom-0 bg-gradient-to-t from-fondo via-fondo/95 to-transparent px-5 pb-28 pt-12 text-center"
              : "left-[6%] top-1/2 w-[min(22rem,24vw)] -translate-y-1/2"
          }`}
        >
          <p className="mono text-acento-suave">Paso 0{activo + 1}</p>
          <p key={paso.titulo} className="surgir titular mt-2 text-[clamp(1.8rem,3vw,3rem)] leading-none">
            {paso.titulo}
          </p>
          <p key={`${paso.titulo}-texto`} className="surgir parrafo mt-4 text-sm text-tenue">
            {paso.texto}
          </p>
        </div>

        {!geo.estrecha && (
          <ol className="absolute right-[3%] top-1/2 -translate-y-1/2 space-y-1.5 text-right text-sm">
            {pasos.map((p, i) => (
              <li key={p.titulo}>
                <button
                  type="button"
                  onClick={() => ir(i)}
                  className={`transition-colors duration-200 ${i === activo ? "text-texto" : "text-tenue/60 hover:text-texto"}`}
                >
                  {p.titulo}
                  <span className={`ml-2 inline-block h-px align-middle transition-[width,background-color] duration-300 ${i === activo ? "w-6 bg-acento-suave" : "w-3 bg-white/20"}`} />
                </button>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
