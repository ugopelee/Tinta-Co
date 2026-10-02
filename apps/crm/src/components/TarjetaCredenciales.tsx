"use client";

import { useState } from "react";
import { Icono } from "@/components/Icono";
import type { Credenciales } from "@/lib/equipo";

/**
 * Usuario y contraseña de una cuenta recién creada. La contraseña no se
 * guarda en claro en ningún sitio: si se pierde, se genera otra.
 */
export function TarjetaCredenciales({ credenciales, nombre }: { credenciales: Credenciales; nombre?: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(`Usuario: ${credenciales.usuario}\nContraseña: ${credenciales.clave}`);
      setCopiado(true);
    } catch {
      setCopiado(false);
    }
  }

  return (
    <div className="rounded-[1.25rem] bg-texto p-5 text-fondo">
      <div className="flex items-center gap-2 text-[0.8125rem] text-fondo/60">
        <Icono nombre="llave" className="h-4 w-4" />
        Acceso al CRM{nombre ? ` de ${nombre}` : ""}
      </div>

      <dl className="mt-3 grid gap-2 sm:grid-cols-2">
        <div className="rounded-[0.875rem] bg-fondo/10 px-4 py-3">
          <dt className="text-xs text-fondo/60">Usuario</dt>
          <dd className="mt-0.5 break-all font-mono text-sm">{credenciales.usuario}</dd>
        </div>
        <div className="rounded-[0.875rem] bg-fondo/10 px-4 py-3">
          <dt className="text-xs text-fondo/60">Contraseña</dt>
          <dd className="mt-0.5 font-mono text-sm tracking-wide">{credenciales.clave}</dd>
        </div>
      </dl>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={copiar}
          className="inline-flex items-center gap-1.5 rounded-full bg-lima px-3.5 py-1.5 text-xs font-medium text-sobre-lima"
        >
          <Icono nombre={copiado ? "hecho" : "copiar"} className="h-3.5 w-3.5" />
          {copiado ? "Copiado" : "Copiar"}
        </button>
        <p className="text-xs text-fondo/60">
          Apúntala ahora: no se vuelve a mostrar. Entra en este mismo CRM y verá su portal.
        </p>
      </div>
    </div>
  );
}
