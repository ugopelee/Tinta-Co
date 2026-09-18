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
 * Fija arriba y con la píldora centrada respecto a la ventana, no respecto
 * al logo: por eso va posicionada de forma absoluta y no dentro del flujo.
 */
export function Cabecera({ sesion }: { sesion: Sesion | null }) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 py-4 sm:px-7 sm:py-6">
      <div className="relative flex items-center justify-between gap-4">
        <Link
          href="/"
          className="titular text-lg transition-opacity duration-300 hover:opacity-70 sm:text-xl"
        >
          {estudio.nombre}
        </Link>

        {/* En móvil no caben logo, menú y cuenta en la misma línea, así que
            la píldora baja al pulgar. */}
        <nav className="fixed bottom-5 left-1/2 -translate-x-1/2 sm:absolute sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2">
          <ul className="flex items-center gap-1 rounded-full border border-white/10 bg-fondo/70 p-1.5 shadow-lg shadow-black/40 backdrop-blur-xl">
            {enlaces.map((enlace) => (
              <li key={enlace.href}>
                <a
                  href={enlace.href}
                  className="block rounded-full px-3.5 py-2 text-[0.8rem] font-medium text-texto/90 transition-colors duration-300 hover:bg-white/10 hover:text-texto sm:px-5 sm:text-sm"
                >
                  {enlace.texto}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {sesion ? (
          <MenuCuenta sesion={sesion} />
        ) : (
          <Link
            href="/acceder"
            className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-texto/90 backdrop-blur transition-all duration-300 hover:border-white/30 hover:text-texto"
          >
            Acceder
          </Link>
        )}
      </div>
    </header>
  );
}
