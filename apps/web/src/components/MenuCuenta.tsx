"use client";

import { useEffect, useRef, useState } from "react";
import { cerrarSesion } from "@/app/cuenta/acciones";

export type Sesion = {
  nombre: string;
  email: string;
  esPropietario: boolean;
};

const URL_CRM = process.env.NEXT_PUBLIC_URL_CRM ?? "";

export function MenuCuenta({ sesion }: { sesion: Sesion }) {
  const [abierto, setAbierto] = useState(false);
  const contenedor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;

    const alPulsarFuera = (evento: MouseEvent) => {
      if (!contenedor.current?.contains(evento.target as Node)) {
        setAbierto(false);
      }
    };

    const alPulsarEscape = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") setAbierto(false);
    };

    document.addEventListener("mousedown", alPulsarFuera);
    document.addEventListener("keydown", alPulsarEscape);

    return () => {
      document.removeEventListener("mousedown", alPulsarFuera);
      document.removeEventListener("keydown", alPulsarEscape);
    };
  }, [abierto]);

  const iniciales = sesion.nombre
    .split(" ")
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div ref={contenedor} className="relative">
      <button
        type="button"
        onClick={() => setAbierto((valor) => !valor)}
        aria-expanded={abierto}
        aria-haspopup="menu"
        className="flex items-center gap-2.5 rounded-full border border-white/15 bg-white/5 py-1.5 pl-1.5 pr-4 text-tenue backdrop-blur transition-all duration-300 hover:border-white/30 hover:text-texto"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-[0.7rem] text-texto">
          {iniciales || "·"}
        </span>
        <span className="hidden max-w-[8rem] truncate text-sm sm:inline">
          {sesion.nombre}
        </span>
      </button>

      {abierto && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+0.6rem)] w-60 overflow-hidden rounded-2xl border border-white/10 bg-superficie/95 backdrop-blur-xl"
        >
          <div className="border-b border-white/10 px-4 py-3">
            <p className="truncate text-sm">{sesion.nombre}</p>
            <p className="mt-0.5 truncate text-xs text-tenue">{sesion.email}</p>
          </div>

          {sesion.esPropietario && URL_CRM && (
            <a
              href={URL_CRM}
              role="menuitem"
              className="block px-4 py-3 text-sm text-tenue transition-colors hover:bg-white/5 hover:text-texto"
            >
              Ir al panel
            </a>
          )}

          <form action={cerrarSesion}>
            <button
              type="submit"
              role="menuitem"
              className="block w-full border-t border-white/10 px-4 py-3 text-left text-sm text-tenue transition-colors hover:bg-white/5 hover:text-texto"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
