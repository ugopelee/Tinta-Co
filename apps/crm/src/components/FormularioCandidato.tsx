"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { equipo } from "@tinta/compartido/estudio";
import { formularioInicial } from "@tinta/compartido/formularios";
import { crearCandidato } from "@/app/acciones-equipo";
import { claseCampo } from "@/components/FormularioAlta";
import { Icono } from "@/components/Icono";

function Guardar() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="boton !px-4 !py-2">
      <Icono nombre="subir" className="h-4 w-4" />
      {pending ? "Subiendo CV…" : "Abrir proceso"}
    </button>
  );
}

/** Nuevo proceso de admisión: datos de contacto, puesto al que opta y CV. */
export function FormularioCandidato() {
  const [abierto, setAbierto] = useState(false);
  const [vuelta, setVuelta] = useState(0);
  const [resultado, accion] = useActionState(async (anterior: typeof formularioInicial, datos: FormData) => {
    const respuesta = await crearCandidato(anterior, datos);
    if (respuesta.estado === "ok") {
      setAbierto(false);
      setVuelta((n) => n + 1);
    }
    return respuesta;
  }, formularioInicial);

  return (
    <div className="mb-3 space-y-3">
      {resultado.estado === "ok" && (
        <p className="tarjeta flex items-center gap-3 px-5 py-4 text-sm">
          <Icono nombre="bien" className="h-4 w-4 text-verde" />
          {resultado.mensaje}
        </p>
      )}

      {!abierto ? (
        <button type="button" onClick={() => setAbierto(true)} className="boton !px-4 !py-2">
          <Icono nombre="mas" className="h-4 w-4" />
          Nuevo candidato
        </button>
      ) : (
        <form key={vuelta} action={accion} className="tarjeta grid gap-4 p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-xs text-tenue">
              Nombre y apellidos
              <input name="nombre" required autoComplete="off" className={claseCampo} />
            </label>
            <label className="grid gap-1 text-xs text-tenue">
              Email (si se le contrata, será su usuario del CRM)
              <input type="email" name="email" required autoComplete="off" className={claseCampo} />
            </label>
            <label className="grid gap-1 text-xs text-tenue">
              Puesto al que opta
              <select name="puesto" required defaultValue="" className={claseCampo}>
                <option value="" disabled>
                  Elige un puesto
                </option>
                {equipo.puestos.map((puesto) => (
                  <option key={puesto}>{puesto}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-xs text-tenue">
              Departamento
              <select name="departamento" defaultValue={equipo.departamentos[0]} className={claseCampo}>
                {equipo.departamentos.map((departamento) => (
                  <option key={departamento}>{departamento}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-xs text-tenue">
              Teléfono
              <input type="tel" name="telefono" className={claseCampo} />
            </label>
            <label className="grid gap-1 text-xs text-tenue">
              CV en PDF (hasta 5 MB)
              <input
                type="file"
                name="cv"
                accept="application/pdf"
                required
                className={`${claseCampo} file:mr-3 file:rounded-full file:border-0 file:bg-superficie-alta file:px-3 file:py-1 file:text-xs file:font-medium`}
              />
            </label>
            <label className="grid gap-1 text-xs text-tenue sm:col-span-2">
              Notas
              <textarea name="notas" rows={2} className={claseCampo} />
            </label>
          </div>

          {resultado.estado === "error" && (
            <p role="alert" className="text-sm text-acento">
              {resultado.mensaje}
            </p>
          )}

          <div className="flex items-center gap-2">
            <Guardar />
            <button
              type="button"
              onClick={() => setAbierto(false)}
              className="rounded-full px-4 py-2 text-sm text-tenue transition-colors hover:text-texto"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
