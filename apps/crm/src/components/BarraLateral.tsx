"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { estudio } from "@tinta/compartido/estudio";
import { cerrarSesion } from "@/app/acciones";
import { Icono, type NombreIcono } from "@/components/Icono";

const URL_WEB = process.env.NEXT_PUBLIC_URL_WEB ?? "/";

type Enlace = { href: string; texto: string; icono: NombreIcono };

const GRUPOS: { titulo: string; enlaces: Enlace[] }[] = [
  {
    titulo: "Estudio",
    enlaces: [
      { href: "/", texto: "Panel", icono: "panel" },
      { href: "/citas", texto: "Citas", icono: "calendario" },
      { href: "/clientes", texto: "Clientes", icono: "personas" },
      { href: "/facturacion", texto: "Facturación", icono: "euro" },
    ],
  },
];

const ENLACES_PROPIETARIO: Enlace[] = [
  { href: "/cuentas", texto: "Cuentas", icono: "llave" },
];

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

  const grupos = esPropietario
    ? [...GRUPOS, { titulo: "Administración", enlaces: ENLACES_PROPIETARIO }]
    : GRUPOS;

  const iniciales = nombre
    .split(" ")
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <>
      <div className="flex items-center justify-between border-b border-borde px-5 py-4 lg:hidden">
        <span className="titular text-lg">{estudio.nombre}</span>
        <button
          type="button"
          onClick={() => setAbierta((valor) => !valor)}
          aria-expanded={abierta}
          className="rounded-lg border border-borde px-3 py-1.5 text-sm text-tenue transition-colors hover:text-texto"
        >
          {abierta ? "Cerrar" : "Menú"}
        </button>
      </div>

      <aside
        className={`${
          abierta ? "block" : "hidden"
        } border-b border-borde bg-superficie/40 lg:sticky lg:top-0 lg:block lg:h-screen lg:w-[16.5rem] lg:shrink-0 lg:border-b-0 lg:border-r`}
      >
        <div className="flex h-full flex-col p-4">
          <div className="hidden items-center gap-3 px-2 py-2 lg:flex">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-acento text-sm font-semibold text-white">
              T
            </span>
            <div className="min-w-0">
              <p className="titular truncate text-[0.95rem] leading-none">
                {estudio.nombre}
              </p>
              <p className="mt-1 text-xs text-tenue">Panel del estudio</p>
            </div>
          </div>

          <nav className="mt-4 space-y-6 lg:mt-6">
            {grupos.map((grupo) => (
              <div key={grupo.titulo}>
                <p className="etiqueta mb-2 px-3 text-tenue/60">
                  {grupo.titulo}
                </p>
                <ul className="space-y-0.5">
                  {grupo.enlaces.map((enlace) => {
                    const activo =
                      enlace.href === "/"
                        ? ruta === "/"
                        : ruta.startsWith(enlace.href);

                    return (
                      <li key={enlace.href}>
                        <Link
                          href={enlace.href}
                          onClick={() => setAbierta(false)}
                          aria-current={activo ? "page" : undefined}
                          className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 ${
                            activo
                              ? "bg-superficie-alta text-texto"
                              : "text-tenue hover:bg-superficie hover:text-texto"
                          }`}
                        >
                          {/* Marca del activo: crece desde el centro. */}
                          <span
                            aria-hidden
                            className={`absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-acento transition-transform duration-300 ${
                              activo ? "scale-y-100" : "scale-y-0"
                            }`}
                          />
                          <Icono
                            nombre={enlace.icono}
                            className={`h-[18px] w-[18px] transition-colors duration-200 ${
                              activo
                                ? "text-acento"
                                : "text-tenue group-hover:text-texto"
                            }`}
                          />
                          {enlace.texto}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

          <div className="mt-auto space-y-1 pt-6">
            <a
              href={URL_WEB}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-tenue transition-colors duration-200 hover:bg-superficie hover:text-texto"
            >
              <Icono nombre="enlace" className="h-[18px] w-[18px]" />
              Ver la web
            </a>

            <div className="mt-3 flex items-center gap-3 rounded-xl border border-borde bg-superficie px-3 py-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-superficie-alta text-[0.7rem]">
                {iniciales || "·"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{nombre}</p>
                <p className="truncate text-xs text-tenue">{email}</p>
              </div>
              <form action={cerrarSesion}>
                <button
                  type="submit"
                  title="Cerrar sesión"
                  aria-label="Cerrar sesión"
                  className="rounded-lg p-1.5 text-tenue transition-colors hover:bg-superficie-alta hover:text-acento"
                >
                  <Icono nombre="salir" className="h-[18px] w-[18px]" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
