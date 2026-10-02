"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { estudio } from "@tinta/compartido/estudio";
import { Logo } from "@/components/Logo";
import { cerrarSesion } from "@/app/acciones";
import { Icono, type NombreIcono } from "@/components/Icono";
import { SelectorTema } from "@/components/SelectorTema";
import {
  alternarBarra,
  barraPorDefecto,
  leerBarra,
  suscribirBarra,
} from "@/lib/preferencias";

const URL_WEB = process.env.NEXT_PUBLIC_URL_WEB ?? "/";

export type Contadores = {
  oportunidades: number;
  clientes: number;
  cobros: number;
  sinResponder: number;
  vacaciones: number;
};

type Enlace = {
  href: string;
  texto: string;
  icono: NombreIcono;
  contador?: keyof Contadores;
};

const GRUPOS: { titulo: string | null; enlaces: Enlace[] }[] = [
  {
    titulo: null,
    enlaces: [
      { href: "/", texto: "Resumen", icono: "panel" },
      {
        href: "/oportunidades",
        texto: "Oportunidades",
        icono: "bandeja",
        contador: "sinResponder",
      },
      { href: "/agenda", texto: "Agenda", icono: "calendario" },
      { href: "/catalogo", texto: "Catálogo flash", icono: "catalogo" },
      { href: "/clientes", texto: "Clientes", icono: "personas" },
      { href: "/consentimientos", texto: "Consentimientos", icono: "consentimiento" },
    ],
  },
  {
    titulo: "Equipo",
    enlaces: [
      { href: "/equipo", texto: "Personas", icono: "equipo" },
      {
        href: "/equipo/ausencias",
        texto: "Vacaciones",
        icono: "ausencias",
        contador: "vacaciones",
      },
      { href: "/equipo/fichajes", texto: "Fichajes", icono: "fichaje" },
    ],
  },
  {
    titulo: "Caja",
    enlaces: [
      {
        href: "/facturacion",
        texto: "Facturación",
        icono: "euro",
        contador: "cobros",
      },
      { href: "/informes", texto: "Informes", icono: "informe" },
    ],
  },
];

const ENLACES_PROPIETARIO: Enlace[] = [
  { href: "/cuentas", texto: "Cuentas", icono: "llave" },
];

/** Misma caja para enlaces, botones y formularios de la barra. */
const FILA =
  "barra-centrar group flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors bajo:py-1.5 enano:py-1 duration-200";

export function BarraLateral({
  nombre,
  email,
  contadores,
  esPropietario,
}: {
  nombre: string;
  email: string;
  contadores: Contadores;
  esPropietario: boolean;
}) {
  const ruta = usePathname();
  const router = useRouter();
  const campo = useRef<HTMLInputElement>(null);
  const [abierta, setAbierta] = useState(false);
  const plegada = useSyncExternalStore(
    suscribirBarra,
    leerBarra,
    barraPorDefecto,
  );

  const grupos = esPropietario
    ? [...GRUPOS, { titulo: "Ajustes", enlaces: ENLACES_PROPIETARIO }]
    : GRUPOS;

  const iniciales = nombre
    .split(" ")
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? "")
    .join("");

  // El buscador responde a ⌘K / Ctrl+K desde cualquier vista.
  useEffect(() => {
    function alPulsar(evento: KeyboardEvent) {
      if (evento.key === "k" && (evento.metaKey || evento.ctrlKey)) {
        evento.preventDefault();
        if (leerBarra()) alternarBarra(false);
        campo.current?.focus();
        campo.current?.select();
      }
    }

    window.addEventListener("keydown", alPulsar);
    return () => window.removeEventListener("keydown", alPulsar);
  }, []);

  return (
    <>
      <div className="flex items-center justify-between px-4 py-3 lg:hidden">
        <span className="flex items-center gap-2.5">
          <Logo className="h-9 w-9" />
          <span className="text-[0.95rem] font-semibold tracking-tight">
            {estudio.nombre}
          </span>
        </span>
        <button
          type="button"
          onClick={() => setAbierta((valor) => !valor)}
          aria-expanded={abierta}
          className="rounded-full bg-superficie px-4 py-1.5 text-sm font-medium"
        >
          {abierta ? "Cerrar" : "Menú"}
        </button>
      </div>

      <aside
        className={`barra ${
          abierta ? "block" : "hidden"
        } tarjeta mx-3 mb-3 lg:sticky lg:top-3 lg:mx-0 lg:mb-0 lg:block lg:h-[calc(100vh-1.5rem)] lg:shrink-0`}
      >
        <div className="flex h-full flex-col p-3 enano:p-2">
          <div className="barra-cabecera hidden items-center justify-between gap-2 px-1 pb-3 pt-1 bajo:pb-2 lg:flex">
            <span className="flex min-w-0 items-center gap-2.5">
              <Logo className="h-10 w-10 bajo:h-8 bajo:w-8" />
              <span className="barra-texto min-w-0 truncate text-[0.95rem] font-semibold tracking-tight">
                {estudio.nombre}
              </span>
            </span>

            <button
              type="button"
              onClick={() => alternarBarra(!plegada)}
              aria-expanded={!plegada}
              title={plegada ? "Desplegar el menú" : "Plegar el menú"}
              aria-label={plegada ? "Desplegar el menú" : "Plegar el menú"}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-superficie-alta text-tenue transition-colors duration-200 hover:text-texto"
            >
              <Icono nombre="plegar" className="h-4 w-4" />
            </button>
          </div>

          {/* Acción principal: las oportunidades no se crean aquí, entran por
              la web, así que el botón grande lleva a lo que está sin responder. */}
          <Link
            href="/oportunidades"
            onClick={() => setAbierta(false)}
            title="Revisar solicitudes"
            className="boton barra-centrar w-full py-3 bajo:py-2"
          >
            {contadores.sinResponder > 0 ? (
              <span className="cifra flex h-5 min-w-5 items-center justify-center rounded-full bg-lima px-1.5 text-[0.7rem] font-semibold text-sobre-lima">
                {contadores.sinResponder}
              </span>
            ) : (
              <Icono nombre="bandeja" className="h-4 w-4 shrink-0" />
            )}
            <span className="barra-texto">
              {contadores.sinResponder > 0 ? "Revisar solicitudes" : "Abrir tablero"}
            </span>
          </Link>

          <form
            role="search"
            onSubmit={(evento) => {
              evento.preventDefault();
              const texto = campo.current?.value.trim() ?? "";
              setAbierta(false);
              router.push(
                texto ? `/clientes?q=${encodeURIComponent(texto)}` : "/clientes",
              );
            }}
            className="barra-texto relative mt-3 bajo:mt-2"
          >
            <Icono
              nombre="buscar"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tenue"
            />
            <input
              ref={campo}
              type="search"
              name="q"
              placeholder="Buscar cliente"
              aria-label="Buscar cliente"
              className="h-10 w-full rounded-xl bajo:h-9 bg-superficie-alta pl-9 pr-12 text-sm outline-none transition-shadow duration-200 placeholder:text-tenue focus:ring-2 focus:ring-texto/10"
            />
            <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md bg-superficie px-1.5 py-0.5 font-sans text-[0.65rem] text-tenue">
              Ctrl K
            </kbd>
          </form>

          <nav className="mt-4 min-h-0 space-y-4 overflow-y-auto bajo:mt-3 bajo:space-y-3 enano:space-y-2">
            {grupos.map((grupo, indice) => (
              <div key={grupo.titulo ?? indice}>
                {grupo.titulo && (
                  <p className="barra-texto etiqueta mb-1 px-3 text-tenue">
                    {grupo.titulo}
                  </p>
                )}
                <ul className="space-y-0.5">
                  {grupo.enlaces.map((enlace) => {
                    // «Personas» (/equipo) no se enciende en sus subpáginas
                    // hermanas, que tienen enlace propio.
                    const activo =
                      enlace.href === "/"
                        ? ruta === "/"
                        : enlace.href === "/equipo"
                          ? ruta === "/equipo" ||
                            (ruta.startsWith("/equipo/") &&
                              !ruta.startsWith("/equipo/ausencias") &&
                              !ruta.startsWith("/equipo/fichajes"))
                          : ruta.startsWith(enlace.href);
                    const cuenta = enlace.contador
                      ? contadores[enlace.contador]
                      : null;

                    return (
                      <li key={enlace.href}>
                        <Link
                          href={enlace.href}
                          onClick={() => setAbierta(false)}
                          aria-current={activo ? "page" : undefined}
                          title={enlace.texto}
                          className={`${FILA} ${
                            activo
                              ? "bg-texto font-medium text-fondo"
                              : "text-texto/80 hover:bg-superficie-alta hover:text-texto"
                          }`}
                        >
                          <Icono
                            nombre={enlace.icono}
                            className="h-[18px] w-[18px] shrink-0"
                          />
                          <span className="barra-texto flex-1 truncate">
                            {enlace.texto}
                          </span>
                          {cuenta !== null && cuenta > 0 && (
                            <span
                              className={`barra-texto cifra rounded-full px-1.5 text-[0.7rem] font-semibold ${
                                activo
                                  ? "bg-lima text-sobre-lima"
                                  : "bg-superficie-alta text-tenue"
                              }`}
                            >
                              {cuenta}
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

          <div className="mt-auto shrink-0 space-y-0.5 pt-4 bajo:pt-3">
            <Link
              href="/ayuda"
              onClick={() => setAbierta(false)}
              aria-current={ruta.startsWith("/ayuda") ? "page" : undefined}
              title="Ayuda y soporte"
              className={`${FILA} ${
                ruta.startsWith("/ayuda")
                  ? "bg-texto font-medium text-fondo"
                  : "text-texto/80 hover:bg-superficie-alta hover:text-texto"
              }`}
            >
              <Icono nombre="ayuda" className="h-[18px] w-[18px] shrink-0" />
              <span className="barra-texto flex-1">Ayuda y soporte</span>
            </Link>

            <a
              href={URL_WEB}
              title="Ver la web"
              className={`${FILA} text-texto/80 hover:bg-superficie-alta hover:text-texto`}
            >
              <Icono nombre="enlace" className="h-[18px] w-[18px] shrink-0" />
              <span className="barra-texto flex-1">Ver la web</span>
            </a>

            <div className="barra-centrar flex items-center gap-3 border-t border-borde px-1 pt-3 !mt-2 bajo:pt-2">
              <span
                title={email}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bajo:h-8 bajo:w-8 bg-texto text-xs font-semibold text-fondo"
              >
                {iniciales || "·"}
              </span>
              <span className="barra-texto min-w-0 flex-1">
                <span className="block truncate text-sm font-medium leading-tight">
                  {nombre}
                </span>
                <span className="block truncate text-xs text-tenue">Propietario</span>
              </span>
              <span className="barra-texto flex items-center">
                <SelectorTema />
                <form action={cerrarSesion}>
                  <button
                    type="submit"
                    title="Cerrar sesión"
                    aria-label="Cerrar sesión"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-tenue transition-colors duration-200 hover:bg-superficie-alta hover:text-acento"
                  >
                    <Icono nombre="salir" className="h-4 w-4" />
                  </button>
                </form>
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
