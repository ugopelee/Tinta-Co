import type { ReactNode } from "react";

/**
 * Cabecera de cada vista: miga pequeña en gris, título grande y, a la
 * derecha, los controles propios de la página. Sustituye a la barra superior
 * común: así cada vista decide qué control merece estar arriba.
 */
export function Encabezado({
  miga,
  titulo,
  nota,
  children,
}: {
  miga: string;
  titulo: ReactNode;
  nota?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm text-tenue">{miga}</p>
        <h1 className="titular mt-0.5 text-[1.75rem] leading-tight lg:text-[2rem]">
          {titulo}
        </h1>
        {nota && <p className="mt-1.5 max-w-2xl text-sm text-tenue">{nota}</p>}
      </div>

      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </header>
  );
}
