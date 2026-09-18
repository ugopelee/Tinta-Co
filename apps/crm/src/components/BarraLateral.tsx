"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { estudio } from "@tinta/compartido/estudio";
import { cerrarSesion } from "@/app/acciones";

const URL_WEB = process.env.NEXT_PUBLIC_URL_WEB ?? "/";

type Enlace = { href: string; texto: string; icono: string };

const ENLACES: Enlace[] = [
  { href: "/", texto: "Panel", icono: "▦" },
  { href: "/citas", texto: "Citas", icono: "◷" },
  { href: "/clientes", texto: "Clientes", icono: "◎" },
];

const ENLACE_PROPIETARIO: Enlace = {
  href: "/cuentas",
  texto: "Cuentas",
  icono: "⬡",
};

export function BarraLateral({
  nombre,
  email,
  esPropietario,
}: {
  nombre: string;
  email: string;
  esPropietario: boolean;
}) {
  const ruta = usePathname();
  const [abierta, setAbierta] = useState(false);

  const enlaces = esPropietario ? [...ENLACES, ENLACE_PROPIETARIO] : ENLACES;

  const iniciales = nombre
    .split(" ")
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <>
      {/* Cabecera compacta: solo en móvil, donde no cabe la barra fija. */}
      <div className="flex items-center justify-between border-b border-borde px-5 py-4 lg:hidden">
        <span className="titular text-lg">{estudio.nombre}</span>
        <button
          type="button"
          onClick={() => setAbierta((valor) => !valor)}
          aria-expanded={abierta}
          className="rounded-lg border border-borde px-3 py-1.5 text-sm text-tenue"
        >
          {abierta ? "Cerrar" : "Menú"}
        </button>
      </div>

      <aside
        className={`${
          abierta ? "block" : "hidden"
        } border-b border-borde lg:sticky lg:top-0 lg:block lg:h-screen lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r`}
      >
        <div className="flex h-full flex-col p-5">
          <div className="hidden items-center gap-3 lg:flex">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-acento text-sm text-white">
              T
            </span>
            <div className="min-w-0">
              <p className="titular truncate text-lg leading-none">
                {estudio.nombre}
              </p>
              <p className="etiqueta mt-1 text-tenue">Panel</p>
            </div>
          </div>

          <div className="mt-0 flex items-center gap-3 rounded-xl border border-borde bg-superficie px-3 py-2.5 lg:mt-6">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-superficie-alta text-[0.7rem]">
              {iniciales || "·"}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm">{nombre}</p>
              <p className="truncate text-xs text-tenue">{email}</p>
            </div>
          </div>

          <nav className="mt-6 space-y-1">
            {enlaces.map((enlace) => {
              const activo =
                enlace.href === "/"
                  ? ruta === "/"
                  : ruta.startsWith(enlace.href);

              return (
                <Link
                  key={enlace.href}
                  href={enlace.href}
                  onClick={() => setAbierta(false)}
                  aria-current={activo ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors duration-300 ${
                    activo
                      ? "bg-superficie-alta text-texto"
                      : "text-tenue hover:bg-superficie hover:text-texto"
                  }`}
                >
                  <span
                    aria-hidden
                    className={activo ? "text-acento" : "text-tenue"}
                  >
                    {enlace.icono}
                  </span>
                  {enlace.texto}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto space-y-1 pt-6">
            <a
              href={URL_WEB}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-tenue transition-colors duration-300 hover:bg-superficie hover:text-texto"
            >
              <span aria-hidden>↗</span>
              Ver la web
            </a>
            <form action={cerrarSesion}>
              <button
                type="submit"
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-tenue transition-colors duration-300 hover:bg-superficie hover:text-texto"
              >
                <span aria-hidden>⤝</span>
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}
