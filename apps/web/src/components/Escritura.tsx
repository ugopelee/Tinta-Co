"use client";

import { useEffect, useRef, useState } from "react";
import { prefiereMenosMovimiento } from "@/components/puntos/nucleo";

/**
 * Texto que se teclea delante de ti con un cursor de bloque. Al cambiar
 * `texto` borra solo lo que sobra (si el nuevo empieza igual, conserva el
 * prefijo) y escribe el resto, que es lo que hace creíble la máquina.
 */
export function Escritura({
  texto,
  className = "",
  velocidad = 42,
  cursor = true,
}: {
  texto: string;
  className?: string;
  /** Milisegundos por letra al escribir; al borrar va al doble de rápido. */
  velocidad?: number;
  cursor?: boolean;
}) {
  const [mostrado, setMostrado] = useState("");
  const actual = useRef("");

  useEffect(() => {
    let temporizador = 0;

    const teclear = () => {
      const previo = actual.current;
      let siguiente = previo;
      let espera = velocidad * (0.6 + Math.random() * 0.9);

      if (prefiereMenosMovimiento()) {
        siguiente = texto;
      } else if (!texto.startsWith(previo)) {
        siguiente = previo.slice(0, -1);
        espera = velocidad / 2;
      } else if (previo.length < texto.length) {
        siguiente = texto.slice(0, previo.length + 1);
        // Una pausa breve tras cada palabra, como quien piensa la siguiente.
        if (texto[previo.length] === " ") espera += velocidad * 2;
      }

      actual.current = siguiente;
      setMostrado(siguiente);
      if (siguiente !== texto) temporizador = window.setTimeout(teclear, espera);
    };

    temporizador = window.setTimeout(teclear, velocidad);
    return () => window.clearTimeout(temporizador);
  }, [texto, velocidad]);

  return (
    <span className={className}>
      <span className="sr-only">{texto}</span>
      <span aria-hidden>
        {mostrado}
        {cursor && <span className="cursor-bloque" />}
      </span>
    </span>
  );
}
