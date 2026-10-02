import Link from "next/link";
import type { ReactNode } from "react";
import { Icono, type NombreIcono } from "@/components/Icono";

/**
 * La caja que se repite en todo el panel: título en negrita con su nota
 * gris debajo y, si hace falta, un enlace a la vista completa. `ajustado`
 * quita el relleno del cuerpo para que las tablas lleguen al borde.
 */
export function Bloque({
  titulo,
  nota,
  accion,
  ajustado = false,
  children,
}: {
  /** Se conserva por compatibilidad; la cabecera ya no pinta icono. */
  icono?: NombreIcono;
  titulo: string;
  nota?: string;
  accion?: { href: string; texto: string };
  ajustado?: boolean;
  children: ReactNode;
}) {
  return (
    <section className="tarjeta flex flex-col overflow-hidden">
      <div
        className={`flex flex-wrap items-start justify-between gap-3 px-5 pt-5 ${
          ajustado ? "pb-3" : "pb-4"
        }`}
      >
        <div className="min-w-0">
          <h2 className="text-base font-semibold leading-tight tracking-tight">
            {titulo}
          </h2>
          {nota && <p className="mt-1 text-[0.8125rem] text-tenue">{nota}</p>}
        </div>

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

      <div className={ajustado ? "" : "px-5 pb-5"}>{children}</div>
    </section>
  );
}
