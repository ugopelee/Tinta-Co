"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Las fotos se destapan de arriba abajo, como una página que se descubre. Por
 * defecto se ven: solo se ocultan las que aún están bajo el pliegue y solo si
 * el usuario no pide menos movimiento. Estilos en estilos.ts ([data-revela]).
 */
export function Revela({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.9) return;

    el.dataset.revela = "oculto";
    const io = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((e) => e.isIntersecting)) {
          el.dataset.revela = "visto";
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      delete el.dataset.revela;
    };
  }, []);

  return (
    <div ref={ref} className={`overflow-hidden rounded-[var(--w-radio)] ${className}`}>
      {children}
    </div>
  );
}
