"use client";

import { useEffect, useRef, useState } from "react";

const RADIO = 20;
const CIRCUNFERENCIA = 2 * Math.PI * RADIO;

/**
 * Botón fijo para volver a la portada desde cualquier punto. Aparece al dejar
 * atrás la portada y su anillo se va cerrando con lo que llevas de página.
 */
export function VolverArriba() {
  const [visible, setVisible] = useState(false);
  const anillo = useRef<SVGCircleElement>(null);

  useEffect(() => {
    let pendiente = 0;
    const actualizar = () => {
      pendiente = 0;
      const recorrido = document.documentElement.scrollHeight - window.innerHeight;
      const p = recorrido > 0 ? window.scrollY / recorrido : 0;
      anillo.current?.setAttribute("stroke-dashoffset", String(CIRCUNFERENCIA * (1 - p)));
      const pasada = window.scrollY > window.innerHeight * 0.8;
      setVisible((actual) => (actual === pasada ? actual : pasada));
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
    <button
      type="button"
      aria-label="Volver al inicio"
      tabIndex={visible ? 0 : -1}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`cristal group fixed bottom-24 right-5 z-50 grid h-12 w-12 place-items-center rounded-full transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.94] md:bottom-8 md:right-8 ${
        visible ? "opacity-100" : "pointer-events-none translate-y-2 scale-90 opacity-0"
      }`}
    >
      <svg aria-hidden viewBox="0 0 48 48" className="absolute inset-0 h-full w-full -rotate-90">
        <circle cx="24" cy="24" r={RADIO} fill="none" stroke="rgb(255 255 255 / 0.1)" strokeWidth="1.5" />
        <circle
          ref={anillo}
          cx="24"
          cy="24"
          r={RADIO}
          fill="none"
          stroke="var(--acento-suave)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray={CIRCUNFERENCIA}
          strokeDashoffset={CIRCUNFERENCIA}
        />
      </svg>
      <span aria-hidden className="text-sm transition-transform duration-200 ease-out group-hover:-translate-y-0.5">
        ↑
      </span>
    </button>
  );
}
