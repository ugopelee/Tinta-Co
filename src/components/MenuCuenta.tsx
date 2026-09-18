"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { salirDeLaCuenta } from "@/app/crm/acciones";

export type Sesion = {
  nombre: string;
  email: string;
  esPropietario: boolean;
};

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
        className="flex items-center gap-2.5 rounded-full border border-borde py-1.5 pl-1.5 pr-4 text-tenue transition-all duration-300 hover:border-acento hover:text-texto"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-superficie-alta text-[0.7rem] text-texto">
          {iniciales || "·"}
        </span>
        <span className="max-w-[9rem] truncate text-sm">{sesion.nombre}</span>
        <span
          aria-hidden
          className={`text-[0.6rem] transition-transform duration-300 ${
            abierto ? "rotate-180" : ""
          }`}
        >
          ▼
        </span>
      </button>

      {abierto && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+0.6rem)] w-60 overflow-hidden rounded-xl border border-borde bg-superficie shadow-2xl shadow-black/60"
        >
          <div className="border-b border-borde px-4 py-3">
            <p className="truncate text-sm">{sesion.nombre}</p>
            <p className="mt-0.5 truncate text-xs text-tenue">{sesion.email}</p>
          </div>

          {sesion.esPropietario && (
            <Link
              href="/crm"
              role="menuitem"
              onClick={() => setAbierto(false)}
              className="block px-4 py-3 text-sm text-tenue transition-colors hover:bg-superficie-alta hover:text-texto"
            >
              Ir al CRM
            </Link>
          )}

          <form action={salirDeLaCuenta}>
            <input type="hidden" name="destino" value="/crm/login" />
            <button
              type="submit"
              role="menuitem"
              className="block w-full px-4 py-3 text-left text-sm text-tenue transition-colors hover:bg-superficie-alta hover:text-texto"
            >
              Cambiar de cuenta
            </button>
          </form>

          <form action={salirDeLaCuenta}>
            <input type="hidden" name="destino" value="/" />
            <button
              type="submit"
              role="menuitem"
              className="block w-full border-t border-borde px-4 py-3 text-left text-sm text-tenue transition-colors hover:bg-superficie-alta hover:text-texto"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
