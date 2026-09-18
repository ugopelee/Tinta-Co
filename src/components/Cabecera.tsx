"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { estudio } from "@/config/estudio";
import { MenuCuenta, type Sesion } from "@/components/MenuCuenta";

const enlaces = [
  { href: "#servicios", texto: "Servicios", soloEscritorio: true },
  { href: "#catalogo", texto: "Catálogo", soloEscritorio: true },
  { href: "#reserva", texto: "Reservar", soloEscritorio: false },
];

export function Cabecera({ sesion }: { sesion: Sesion | null }) {
  const [oculta, setOculta] = useState(false);
  const [despegada, setDespegada] = useState(false);
  const ultimaPosicion = useRef(0);

  useEffect(() => {
    let pendiente = 0;

    const revisar = () => {
      const y = window.scrollY;
      const anterior = ultimaPosicion.current;

      // Se esconde al bajar (pasada la altura del hero) y vuelve al subir.
      setOculta(y > 240 && y > anterior);
      setDespegada(y > 24);

      ultimaPosicion.current = y;
      pendiente = 0;
    };

    const alMoverse = () => {
      if (!pendiente) pendiente = requestAnimationFrame(revisar);
    };

    window.addEventListener("scroll", alMoverse, { passive: true });
    return () => {
      window.removeEventListener("scroll", alMoverse);
      if (pendiente) cancelAnimationFrame(pendiente);
    };
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        oculta ? "-translate-y-full" : "translate-y-0"
      } ${
        despegada
          ? "border-b border-borde/60 bg-fondo/70 backdrop-blur-xl"
          : "border-b border-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link
          href="/"
          className="titular text-xl tracking-tight transition-opacity duration-300 hover:opacity-70 sm:text-2xl"
        >
          {estudio.nombre}
        </Link>

        <div className="flex items-center gap-5 text-sm sm:gap-7">
          {enlaces.map((enlace) => (
            <a
              key={enlace.href}
              href={enlace.href}
              className={`enlace-sutil -my-2 py-2 text-tenue transition-colors duration-300 hover:text-texto ${
                enlace.soloEscritorio ? "hidden sm:inline-block" : "inline-block"
              }`}
            >
              {enlace.texto}
            </a>
          ))}
          {sesion ? (
            <MenuCuenta sesion={sesion} />
          ) : (
            <Link
              href="/crm/login"
              className="etiqueta rounded-full border border-borde px-4 py-2 text-tenue transition-all duration-300 hover:border-acento hover:text-texto"
            >
              Acceder
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
