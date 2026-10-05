"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { formularioInicial } from "@tinta/compartido/formularios";
import { subirNomina } from "@/app/acciones-equipo";
import { Icono } from "@/components/Icono";
import { claseCampo } from "@/components/FormularioAlta";

function Subir() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="boton !px-4 !py-2">
      <Icono nombre="subir" className="h-4 w-4" />
      {pending ? "Subiendo…" : "Subir nómina"}
    </button>
  );
}

/** Sube el PDF de un mes. El empleado lo ve y lo firma desde su portal. */
export function FormularioNomina({ empleadoId, mesSugerido }: { empleadoId: string; mesSugerido: string }) {
  const [vuelta, setVuelta] = useState(0);
  const [resultado, accion] = useActionState(async (anterior: typeof formularioInicial, datos: FormData) => {
    const respuesta = await subirNomina(anterior, datos);
    if (respuesta.estado === "ok") setVuelta((n) => n + 1);
    return respuesta;
  }, formularioInicial);

  return (
    <form key={vuelta} action={accion} className="fila grid gap-3 p-4">
      <input type="hidden" name="empleado_id" value={empleadoId} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[14rem_1fr]">
        <label className="grid gap-1 text-xs text-tenue">
          Mes
          <input type="month" name="periodo" required defaultValue={mesSugerido} className={claseCampo} />
        </label>
        <label className="grid gap-1 text-xs text-tenue">
          PDF de la nómina
          <input
            type="file"
            name="archivo"
            accept="application/pdf"
            required
            className={`${claseCampo} file:mr-3 file:rounded-full file:border-0 file:bg-superficie-alta file:px-3 file:py-1 file:text-xs file:font-medium`}
          />
        </label>
      </div>

      {resultado.estado !== "inicial" && (
        <p
          role={resultado.estado === "error" ? "alert" : undefined}
          className={`text-sm ${resultado.estado === "error" ? "text-acento" : "text-tenue"}`}
        >
          {resultado.mensaje}
        </p>
      )}

      <div>
        <Subir />
      </div>
    </form>
  );
}
