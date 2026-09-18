"use client";

import Link from "next/link";
import { estudio } from "@tinta/compartido/estudio";
import { MenuCuenta, type Sesion } from "@/components/MenuCuenta";

const enlaces = [
  { href: "#servicios", texto: "Servicios" },
  { href: "#catalogo", texto: "Catálogo" },
  { href: "#reserva", texto: "Reservar" },
];

/**
 * La navegación vive dentro del panel de cristal de la portada, no pegada a
 * la ventana: es lo que hace que la portada se lea como una pieza.
 */
export function Cabecera({ sesion }: { sesion: Sesion | null }) {
  return (
    <nav className="flex items-center justify-between gap-4">
      <Link
        href="/"
        className="titular text-xl transition-opacity duration-300 hover:opacity-70"
      >
        {estudio.nombre}
      </Link>

      <div className="hidden items-center gap-8 md:flex">
        {enlaces.map((enlace) => (
          <a
            key={enlace.href}
            href={enlace.href}
            className="enlace-sutil -my-2 py-2 text-sm text-tenue transition-colors duration-300 hover:text-texto"
          >
            {enlace.texto}
          </a>
        ))}
      </div>

      <div className="flex items-center gap-3">
        {sesion ? (
          <MenuCuenta sesion={sesion} />
        ) : (
          <Link
            href="/acceder"
            className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-tenue backdrop-blur transition-all duration-300 hover:border-white/30 hover:text-texto"
          >
            Acceder
          </Link>
        )}

        <a
          href="#reserva"
          className="boton-barrido hidden rounded-full bg-texto px-5 py-2.5 text-sm font-medium text-fondo transition-colors duration-300 sm:block"
        >
          {estudio.hero.cta}
        </a>
      </div>
    </nav>
  );
}
