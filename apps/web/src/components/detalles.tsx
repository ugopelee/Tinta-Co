"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Escritura } from "@/components/Escritura";
import { prefiereMenosMovimiento } from "@/components/puntos/nucleo";

/** Una palabra que se borra y se reescribe con la siguiente de la lista. */
export function PalabraRotatoria({
  palabras,
  cada = 2800,
  className = "",
}: {
  palabras: readonly string[];
  cada?: number;
  className?: string;
}) {
  const [indice, setIndice] = useState(0);

  useEffect(() => {
    const temporizador = window.setInterval(
      () => setIndice((actual) => (actual + 1) % palabras.length),
      cada,
    );
    return () => window.clearInterval(temporizador);
  }, [palabras.length, cada]);

  return <Escritura texto={palabras[indice]} className={className} velocidad={55} />;
}

/**
 * Enlace que se deja atraer por el puntero. El desplazamiento se escribe en
 * el estilo directamente: un estado de React por píxel sería derroche.
 */
export function EnlaceMagnetico({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  const referencia = useRef<HTMLAnchorElement>(null);

  const mover = (evento: React.PointerEvent<HTMLAnchorElement>) => {
    const nodo = referencia.current;
    if (!nodo || prefiereMenosMovimiento()) return;
    const caja = nodo.getBoundingClientRect();
    const x = (evento.clientX - (caja.left + caja.width / 2)) * 0.25;
    const y = (evento.clientY - (caja.top + caja.height / 2)) * 0.35;
    nodo.style.transform = `translate(${x}px, ${y}px)`;
  };

  const soltar = () => {
    if (referencia.current) referencia.current.style.transform = "";
  };

  return (
    <a
      ref={referencia}
      href={href}
      onPointerMove={mover}
      onPointerLeave={soltar}
      className={`transition-transform duration-500 ease-[var(--ease-salida)] ${className}`}
    >
      {children}
    </a>
  );
}

/** Hora de Madrid, al segundo: el estudio está abierto o no, ahora mismo. */
export function HoraMadrid() {
  const [ahora, setAhora] = useState<Date | null>(null);

  useEffect(() => {
    const tic = () => setAhora(new Date());
    const primero = window.setTimeout(tic, 0);
    const intervalo = window.setInterval(tic, 1000);
    return () => {
      window.clearTimeout(primero);
      window.clearInterval(intervalo);
    };
  }, []);

  // En el servidor no hay hora que valga: se pinta un hueco del mismo ancho.
  return (
    <span className="cifra tabular-nums">
      {ahora
        ? ahora.toLocaleTimeString("es-ES", {
            timeZone: "Europe/Madrid",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })
        : "--:--:--"}
    </span>
  );
}
