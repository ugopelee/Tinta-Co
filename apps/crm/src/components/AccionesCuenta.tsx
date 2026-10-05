"use client";

import { useState, useTransition } from "react";
import { crearCuentaEmpleado, restablecerClave } from "@/app/acciones-equipo";
import { TarjetaCredenciales } from "@/components/TarjetaCredenciales";
import type { Credenciales } from "@/lib/equipo";

/** Crear la cuenta (si falló en el alta) o darle una contraseña nueva. */
export function AccionesCuenta({ empleadoId, tieneCuenta }: { empleadoId: string; tieneCuenta: boolean }) {
  const [credenciales, setCredenciales] = useState<Credenciales | null>(null);
  const [error, setError] = useState("");
  const [ocupado, iniciar] = useTransition();

  function ejecutar() {
    if (tieneCuenta && !window.confirm("¿Generar una contraseña nueva? La actual dejará de funcionar.")) return;

    iniciar(async () => {
      setError("");
      const resultado = tieneCuenta ? await restablecerClave(empleadoId) : await crearCuentaEmpleado(empleadoId);
      if (resultado.ok) setCredenciales(resultado.credenciales);
      else setError(resultado.mensaje);
    });
  }

  return (
    <div className="space-y-3">
      <button type="button" onClick={ejecutar} disabled={ocupado} className="boton-fantasma">
        {ocupado ? "Generando…" : tieneCuenta ? "Nueva contraseña" : "Crear cuenta del CRM"}
      </button>
      {error && (
        <p role="alert" className="text-sm text-acento">
          {error}
        </p>
      )}
      {credenciales && <TarjetaCredenciales credenciales={credenciales} />}
    </div>
  );
}
