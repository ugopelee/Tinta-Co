import Link from "next/link";
import type { ReactNode } from "react";
import { Icono, type NombreIcono } from "@/components/Icono";

/**
 * La caja que se repite en todo el panel: título en negrita con su nota
 * gris debajo y, si hace falta, un enlace a la vista completa. `ajustado`
 * quita el relleno del cuerpo para que las tablas lleguen al borde.
 * `plegable` la convierte en un desplegable cerrado: solo se ve la cabecera
 * hasta que se pulsa.
 */
export function Bloque({
  titulo,
  nota,
  accion,
  ajustado = false,
  plegable = false,
  children,
}: {
  /** Se conserva por compatibilidad; la cabecera ya no pinta icono. */
  icono?: NombreIcono;
  titulo: string;
  nota?: string;
  accion?: { href: string; texto: string };
  ajustado?: boolean;
  plegable?: boolean;
  children: ReactNode;
}) {
  const textos = (
    <div className="min-w-0">
      <h2 className="text-base font-semibold leading-tight tracking-tight">
        {titulo}
      </h2>
      {nota && <p className="mt-1 text-[0.8125rem] text-tenue">{nota}</p>}
    </div>
  );
  const cuerpo = <div className={ajustado ? "" : "px-5 pb-5"}>{children}</div>;

  if (plegable) {
    return (
      <details className="tarjeta group overflow-hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5 group-open:pb-4 [&::-webkit-details-marker]:hidden">
          {textos}
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-superficie-alta text-tenue transition-colors duration-200 group-hover:text-texto">
            <Icono
              nombre="desplegar"
              className="h-4 w-4 transition-transform duration-300 group-open:rotate-180"
            />
          </span>
        </summary>
        {cuerpo}
      </details>
    );
  }

  return (
    <section className="tarjeta flex flex-col overflow-hidden">
      <div
        className={`flex flex-wrap items-start justify-between gap-3 px-5 pt-5 ${
          ajustado ? "pb-3" : "pb-4"
        }`}
      >
        {textos}

        {accion && (
          <Link
            href={accion.href}
            className="group inline-flex items-center gap-1.5 rounded-full bg-superficie-alta px-3 py-1.5 text-[0.8125rem] font-medium transition-colors duration-200 hover:bg-borde"
          >
            {accion.texto}
            <Icono
              nombre="flecha"
              className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5"
            />
          </Link>
        )}
      </div>

      {cuerpo}
    </section>
  );
}
