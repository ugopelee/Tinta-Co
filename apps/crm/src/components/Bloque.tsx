import Link from "next/link";
import type { ReactNode } from "react";
import { Icono, type NombreIcono } from "@/components/Icono";

/**
 * La caja que se repite en todo el panel: cabecera con icono, título y, si
 * hace falta, un enlace a la vista completa. `ajustado` quita el relleno del
 * cuerpo para que las tablas lleguen al borde.
 */
export function Bloque({
  icono,
  titulo,
  nota,
  accion,
  ajustado = false,
  children,
}: {
  icono: NombreIcono;
  titulo: string;
  nota?: string;
  accion?: { href: string; texto: string };
  ajustado?: boolean;
  children: ReactNode;
}) {
  return (
    <section className="tarjeta flex flex-col overflow-hidden">
      <div
        className={`flex flex-wrap items-center justify-between gap-3 px-5 ${
          ajustado ? "border-b border-borde py-3.5" : "pb-4 pt-5"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <Icono nombre={icono} className="h-[17px] w-[17px] text-tenue" />
          <div>
            <h2 className="text-[0.9375rem] font-medium leading-tight">
              {titulo}
            </h2>
            {nota && <p className="mt-0.5 text-xs text-tenue">{nota}</p>}
          </div>
        </div>

        {accion && (
          <Link href={accion.href} className="boton-fantasma group">
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
