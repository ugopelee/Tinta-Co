"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { Icono, type NombreIcono } from "@/components/Icono";
import { SelectorTema } from "@/components/SelectorTema";

type Seccion = { texto: string; icono: NombreIcono; hijo?: string };

const SECCIONES: { prefijo: string; seccion: Seccion }[] = [
  { prefijo: "/citas", seccion: { texto: "Citas", icono: "calendario" } },
  {
    prefijo: "/clientes/",
    seccion: { texto: "Clientes", icono: "personas", hijo: "Ficha" },
  },
  { prefijo: "/clientes", seccion: { texto: "Clientes", icono: "personas" } },
  { prefijo: "/facturacion", seccion: { texto: "Facturación", icono: "euro" } },
  { prefijo: "/cuentas", seccion: { texto: "Cuentas", icono: "llave" } },
];

function seccionDe(ruta: string): Seccion {
  const encontrada = SECCIONES.find((opcion) => ruta.startsWith(opcion.prefijo));
  return encontrada?.seccion ?? { texto: "Resumen", icono: "panel" };
}

export function BarraSuperior() {
  const ruta = usePathname();
  const router = useRouter();
  const campo = useRef<HTMLInputElement>(null);
  const seccion = seccionDe(ruta);

  // El atajo que anuncia la tecla del campo tiene que existir de verdad.
  useEffect(() => {
    function alPulsar(evento: KeyboardEvent) {
      if (evento.key === "k" && (evento.metaKey || evento.ctrlKey)) {
        evento.preventDefault();
        campo.current?.focus();
        campo.current?.select();
      }
    }

    window.addEventListener("keydown", alPulsar);
    return () => window.removeEventListener("keydown", alPulsar);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-borde bg-fondo/85 px-4 backdrop-blur lg:px-6">
      <nav
        aria-label="Migas de pan"
        className="flex min-w-0 items-center gap-2 text-sm"
      >
        <Link
          href="/"
          className="flex items-center gap-2 text-tenue transition-colors duration-200 hover:text-texto"
        >
          <Icono nombre="casa" className="h-4 w-4" />
          <span className="hidden sm:inline">Estudio</span>
        </Link>

        <span aria-hidden className="text-borde">
          /
        </span>

        <span className="flex items-center gap-2 truncate">
          <Icono nombre={seccion.icono} className="h-4 w-4 text-tenue" />
          {seccion.hijo ? (
            <Link
              href="/clientes"
              className="text-tenue transition-colors duration-200 hover:text-texto"
            >
              {seccion.texto}
            </Link>
          ) : (
            <span>{seccion.texto}</span>
          )}
        </span>

        {seccion.hijo && (
          <>
            <span aria-hidden className="text-borde">
              /
            </span>
            <span className="truncate">{seccion.hijo}</span>
          </>
        )}
      </nav>

      <form
        role="search"
        onSubmit={(evento) => {
          evento.preventDefault();
          const texto = campo.current?.value.trim() ?? "";
          router.push(texto ? `/clientes?q=${encodeURIComponent(texto)}` : "/clientes");
        }}
        className="relative ml-auto hidden md:block"
      >
        <Icono
          nombre="buscar"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tenue"
        />
        <input
          ref={campo}
          type="search"
          name="q"
          placeholder="Buscar cliente…"
          aria-label="Buscar cliente"
          className="h-9 w-56 rounded-lg border border-borde bg-superficie pl-9 pr-14 text-sm outline-none transition-colors duration-200 placeholder:text-tenue focus:border-tenue lg:w-72"
        />
        <kbd
          aria-hidden
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded border border-borde px-1.5 py-0.5 font-sans text-[0.65rem] text-tenue"
        >
          ⌘K
        </kbd>
      </form>

      <div className="ml-auto flex items-center gap-2 md:ml-0">
        <Link
          href="/clientes"
          aria-label="Buscar cliente"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-borde text-tenue transition-colors duration-200 hover:bg-superficie-alta hover:text-texto md:hidden"
        >
          <Icono nombre="buscar" className="h-[17px] w-[17px]" />
        </Link>
        <SelectorTema />
      </div>
    </header>
  );
}
