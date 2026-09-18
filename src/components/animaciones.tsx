"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

function prefiereMenosMovimiento() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** Marca un elemento como visible la primera vez que entra en pantalla. */
function useEnVista<T extends HTMLElement>(margen = "0px 0px -80px 0px") {
  const referencia = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const nodo = referencia.current;
    if (!nodo) return;

    // Con movimiento reducido no hace falta un camino aparte: el CSS anula
    // la duración de la transición, así que el elemento aparece de golpe.
    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          setVisible(true);
          observador.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: margen },
    );

    observador.observe(nodo);
    return () => observador.disconnect();
  }, [margen]);

  return { referencia, visible };
}

export function Revelar({
  children,
  retardo = 0,
  className = "",
}: {
  children: ReactNode;
  retardo?: number;
  className?: string;
}) {
  const { referencia, visible } = useEnVista<HTMLDivElement>();

  return (
    <div
      ref={referencia}
      data-revelar
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : "translateY(26px)",
        filter: visible ? "blur(0)" : "blur(6px)",
        transition: `opacity .9s cubic-bezier(.22,.8,.26,1) ${retardo}ms, transform .9s cubic-bezier(.22,.8,.26,1) ${retardo}ms, filter .9s cubic-bezier(.22,.8,.26,1) ${retardo}ms`,
      }}
    >
      {children}
    </div>
  );
}

/**
 * Revela un texto palabra a palabra: cada una sube desde detrás de una
 * máscara. Es el gesto que más carácter da a los titulares.
 */
export function TextoRevelado({
  texto,
  className = "",
  retardo = 0,
  paso = 55,
  enfasis = [],
}: {
  texto: string;
  className?: string;
  retardo?: number;
  paso?: number;
  /** Palabras que se componen en cursiva, para romper la uniformidad. */
  enfasis?: readonly string[];
}) {
  const { referencia, visible } = useEnVista<HTMLSpanElement>();
  const palabras = texto.split(" ");
  const enCursiva = new Set(enfasis.map((p) => p.toLowerCase()));

  return (
    <span ref={referencia} className={`block ${className}`}>
      {palabras.map((palabra, indice) => {
        const cursiva = enCursiva.has(
          palabra.toLowerCase().replace(/[.,;:]/g, ""),
        );

        return (
          <span
            key={`${palabra}-${indice}`}
            className="inline-flex overflow-hidden pb-[0.14em] align-bottom"
          >
            <span
              data-revelar
              className={`inline-block ${cursiva ? "italic" : ""}`}
              style={{
                transform: visible ? "translateY(0)" : "translateY(110%)",
                opacity: visible ? 1 : 0,
                transition: `transform 1.05s cubic-bezier(.19,.9,.22,1) ${
                  retardo + indice * paso
                }ms, opacity .8s ease ${retardo + indice * paso}ms`,
              }}
            >
              {palabra}
            </span>
            {indice < palabras.length - 1 && <span>&nbsp;</span>}
          </span>
        );
      })}
    </span>
  );
}

/** Filete horizontal que se dibuja de izquierda a derecha al aparecer. */
export function Filete({
  className = "",
  retardo = 0,
}: {
  className?: string;
  retardo?: number;
}) {
  const { referencia, visible } = useEnVista<HTMLSpanElement>();

  return (
    <span
      ref={referencia}
      data-revelar
      className={`block origin-left ${className}`}
      style={{
        transform: visible ? "scaleX(1)" : "scaleX(0)",
        transition: `transform 1.1s cubic-bezier(.22,.8,.26,1) ${retardo}ms`,
      }}
    />
  );
}

/** Descubre su contenido con una cortina que sube. */
export function Cortina({
  children,
  retardo = 0,
  className = "",
}: {
  children: ReactNode;
  retardo?: number;
  className?: string;
}) {
  const { referencia, visible } = useEnVista<HTMLDivElement>();

  return (
    <div
      ref={referencia}
      data-revelar
      className={className}
      style={{
        clipPath: visible
          ? "inset(0% 0% 0% 0%)"
          : "inset(0% 0% 100% 0%)",
        transform: visible ? "scale(1)" : "scale(1.06)",
        transition: `clip-path 1.2s cubic-bezier(.22,.8,.26,1) ${retardo}ms, transform 1.4s cubic-bezier(.22,.8,.26,1) ${retardo}ms`,
      }}
    >
      {children}
    </div>
  );
}

/** Desplaza su contenido a distinta velocidad que el scroll. */
export function Parallax({
  children,
  intensidad = 0.12,
  className = "",
}: {
  children: ReactNode;
  intensidad?: number;
  className?: string;
}) {
  const referencia = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const nodo = referencia.current;
    if (!nodo || prefiereMenosMovimiento()) return;

    let pendiente = 0;

    const actualizar = () => {
      const caja = nodo.getBoundingClientRect();
      const desvio =
        caja.top + caja.height / 2 - window.innerHeight / 2;
      nodo.style.transform = `translate3d(0, ${(-desvio * intensidad).toFixed(
        1,
      )}px, 0)`;
      pendiente = 0;
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
  }, [intensidad]);

  return (
    <div ref={referencia} className={className} style={{ willChange: "transform" }}>
      {children}
    </div>
  );
}

/** Cuenta desde cero hasta `valor` cuando entra en pantalla. */
export function Contador({
  valor,
  sufijo = "",
  duracion = 1700,
}: {
  valor: number;
  sufijo?: string;
  duracion?: number;
}) {
  const { referencia, visible } = useEnVista<HTMLSpanElement>();
  const [actual, setActual] = useState(0);

  useEffect(() => {
    if (!visible) return;

    let cuadro = 0;
    const inicio = performance.now();
    // Duración cero con movimiento reducido: el primer fotograma ya salta
    // al valor final.
    const total = prefiereMenosMovimiento() ? 0 : duracion;

    const avanzar = (ahora: number) => {
      const progreso = Math.min(1, (ahora - inicio) / total);
      const suavizado = 1 - Math.pow(1 - progreso, 3);
      setActual(Math.round(valor * suavizado));
      if (progreso < 1) cuadro = requestAnimationFrame(avanzar);
    };

    cuadro = requestAnimationFrame(avanzar);
    return () => cancelAnimationFrame(cuadro);
  }, [visible, valor, duracion]);

  return (
    <span ref={referencia}>
      {actual.toLocaleString("es-ES")}
      {sufijo}
    </span>
  );
}

/** Línea de progreso de lectura fija en la parte superior. */
export function BarraProgreso() {
  const [progreso, setProgreso] = useState(0);

  useEffect(() => {
    let pendiente = 0;

    const actualizar = () => {
      const recorrido =
        document.documentElement.scrollHeight - window.innerHeight;
      setProgreso(recorrido > 0 ? window.scrollY / recorrido : 0);
      pendiente = 0;
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
    <div
      aria-hidden
      className="fixed inset-x-0 top-0 z-[60] h-px origin-left bg-acento"
      style={{ transform: `scaleX(${progreso})` }}
    />
  );
}

/** Banda de palabras en movimiento continuo. */
export function Marquesina({
  palabras,
  duracion = 38,
}: {
  palabras: readonly string[];
  duracion?: number;
}) {
  const tanda = (
    <div className="flex shrink-0 items-center gap-10 px-5">
      {palabras.map((palabra) => (
        <span key={palabra} className="flex items-center gap-10">
          <span className="titular text-2xl text-tenue sm:text-4xl">
            {palabra}
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-acento" />
        </span>
      ))}
    </div>
  );

  return (
    <div
      aria-hidden
      className="marquesina flex overflow-hidden border-y border-borde py-6"
      style={{ "--duracion-marquesina": `${duracion}s` } as CSSProperties}
    >
      {tanda}
      {tanda}
    </div>
  );
}
