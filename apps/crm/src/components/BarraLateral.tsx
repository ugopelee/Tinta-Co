"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { estudio } from "@tinta/compartido/estudio";
import { cerrarSesion } from "@/app/acciones";
import { Icono, type NombreIcono } from "@/components/Icono";
import {
  alternarBarra,
  barraPorDefecto,
  leerBarra,
  suscribirBarra,
} from "@/lib/preferencias";

const URL_WEB = process.env.NEXT_PUBLIC_URL_WEB ?? "/";

type Enlace = { href: string; texto: string; icono: NombreIcono };

const GRUPOS: { titulo: string; enlaces: Enlace[] }[] = [
  {
    titulo: "Vistas",
    enlaces: [
      { href: "/", texto: "Resumen", icono: "panel" },
      { href: "/citas", texto: "Citas", icono: "calendario" },
      { href: "/clientes", texto: "Clientes", icono: "personas" },
      { href: "/facturacion", texto: "Facturación", icono: "euro" },
    ],
  },
];

const ENLACES_PROPIETARIO: Enlace[] = [
  { href: "/cuentas", texto: "Cuentas", icono: "llave" },
];

/** Misma caja para enlaces, botones y formularios de la barra. */
const FILA =
  "barra-centrar group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors duration-200";

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
  const plegada = useSyncExternalStore(
    suscribirBarra,
    leerBarra,
    barraPorDefecto,
  );

  const grupos = esPropietario
    ? [...GRUPOS, { titulo: "Gestión", enlaces: ENLACES_PROPIETARIO }]
    : GRUPOS;

  const iniciales = nombre
    .split(" ")
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <>
      <div className="flex items-center justify-between border-b border-borde px-4 py-3 lg:hidden">
        <span className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-acento text-sm font-semibold text-white">
            T
          </span>
          <span className="titular text-[0.95rem]">{estudio.nombre}</span>
        </span>
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
        className={`barra ${
          abierta ? "block" : "hidden"
        } border-b border-borde lg:sticky lg:top-0 lg:block lg:h-screen lg:shrink-0 lg:border-b-0 lg:border-r`}
      >
        <div className="flex h-full flex-col p-3">
          <div className="barra-cabecera hidden items-center justify-between gap-2 px-1 py-2 lg:flex">
            {/* La marca se queda aunque se pliegue: es la referencia de dónde
                está uno. Lo que desaparece es el nombre escrito. */}
            <span className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-acento text-sm font-semibold text-white">
                T
              </span>
              <span className="barra-texto min-w-0">
                <span className="titular block truncate text-[0.95rem] leading-tight">
                  {estudio.nombre}
                </span>
                <span className="block text-xs text-tenue">Panel</span>
              </span>
            </span>

            <button
              type="button"
              onClick={() => alternarBarra(!plegada)}
              aria-expanded={!plegada}
              title={plegada ? "Desplegar el menú" : "Plegar el menú"}
              aria-label={plegada ? "Desplegar el menú" : "Plegar el menú"}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-tenue transition-colors duration-200 hover:bg-superficie-alta hover:text-texto"
            >
              <Icono nombre="plegar" className="h-[17px] w-[17px]" />
            </button>
          </div>

          <nav className="mt-3 space-y-5">
            {grupos.map((grupo) => (
              <div key={grupo.titulo}>
                <p className="barra-texto etiqueta mb-1.5 px-3 text-tenue/70">
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
                          title={enlace.texto}
                          className={`${FILA} ${
                            activo
                              ? "bg-superficie-alta text-texto"
                              : "text-tenue hover:bg-superficie hover:text-texto"
                          }`}
                        >
                          <Icono
                            nombre={enlace.icono}
                            className={`h-[18px] w-[18px] shrink-0 transition-colors duration-200 ${
                              activo ? "text-acento" : "group-hover:text-texto"
                            }`}
                          />
                          <span className="barra-texto">{enlace.texto}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

          <div className="mt-auto pt-6">
            <a
              href={URL_WEB}
              title="Ver la web"
              className={`${FILA} text-tenue hover:bg-superficie hover:text-texto`}
            >
              <Icono nombre="enlace" className="h-[18px] w-[18px] shrink-0" />
              <span className="barra-texto">Ver la web</span>
            </a>

            <form action={cerrarSesion}>
              <button
                type="submit"
                title="Cerrar sesión"
                className={`${FILA} w-full text-tenue hover:bg-superficie hover:text-acento`}
              >
                <Icono nombre="salir" className="h-[18px] w-[18px] shrink-0" />
                <span className="barra-texto">Cerrar sesión</span>
              </button>
            </form>

            <div className="barra-centrar mt-2 flex items-center gap-3 rounded-lg border border-borde bg-superficie px-3 py-2.5">
              <span
                title={email}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-superficie-alta text-[0.7rem]"
              >
                {iniciales || "·"}
              </span>
              <span className="barra-texto min-w-0 flex-1">
                <span className="block truncate text-sm">{nombre}</span>
                <span className="block truncate text-xs text-tenue">{email}</span>
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
