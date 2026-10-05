"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { equipo } from "@tinta/compartido/estudio";
import { altaEmpleado } from "@/app/acciones-equipo";
import { Icono } from "@/components/Icono";
import { TarjetaCredenciales } from "@/components/TarjetaCredenciales";
import { altaInicial, hoyMadrid } from "@/lib/equipo";

export const claseCampo =
  "w-full rounded-xl bg-superficie px-3 py-2 text-sm outline-none ring-1 ring-borde transition-shadow duration-200 placeholder:text-tenue/70 focus:ring-2 focus:ring-texto/30";

function Guardar() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="boton !px-4 !py-2">
      {pending ? "Dando de alta…" : "Dar de alta y crear su cuenta"}
    </button>
  );
}

/**
 * Alta de una persona del equipo. Al guardar se crean solas su checklist de
 * incorporación y su cuenta del CRM; la contraseña se enseña aquí una vez.
 */
export function FormularioAlta() {
  const [abierto, setAbierto] = useState(false);
  const [vista, setVista] = useState<string | null>(null);
  // `key` en el formulario lo vacía tras un alta correcta sin tocar el DOM.
  const [vuelta, setVuelta] = useState(0);
  const [resultado, accion] = useActionState(
    async (anterior: typeof altaInicial, datos: FormData) => {
      const respuesta = await altaEmpleado(anterior, datos);
      if (respuesta.estado === "ok") {
        setAbierto(false);
        setVista(null);
        setVuelta((n) => n + 1);
      }
      return respuesta;
    },
    altaInicial,
  );

  return (
    <div className="mb-3 space-y-3">
      {resultado.estado === "ok" && (
        <div className="space-y-3">
          <p className="tarjeta flex flex-wrap items-center gap-3 px-5 py-4 text-sm">
            <Icono nombre="bien" className="h-4 w-4 text-verde" />
            <span className="flex-1">{resultado.mensaje}</span>
            {resultado.empleadoId && (
              <Link href={`/equipo/${resultado.empleadoId}`} className="font-medium underline-offset-4 hover:underline">
                Ver su ficha
              </Link>
            )}
          </p>
          {resultado.credenciales && <TarjetaCredenciales credenciales={resultado.credenciales} />}
        </div>
      )}

      {!abierto ? (
        <button type="button" onClick={() => setAbierto(true)} className="boton !px-4 !py-2">
          <Icono nombre="alta" className="h-4 w-4" />
          Nueva persona
        </button>
      ) : (
        <form key={vuelta} action={accion} className="tarjeta grid gap-4 p-5">
          <div className="flex flex-wrap items-center gap-4">
            <label className="group relative cursor-pointer" title="Foto">
              {vista ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={vista} alt="" className="h-20 w-20 rounded-full object-cover" />
              ) : (
                <span className="flex h-20 w-20 items-center justify-center rounded-full bg-superficie-alta text-tenue transition-colors group-hover:text-texto">
                  <Icono nombre="camara" className="h-6 w-6" />
                </span>
              )}
              <input
                type="file"
                name="foto"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                onChange={(evento) => {
                  const archivo = evento.target.files?.[0];
                  setVista(archivo ? URL.createObjectURL(archivo) : null);
                }}
              />
            </label>
            <div className="text-sm">
              <p className="font-medium">Foto de la ficha</p>
              <p className="text-xs text-tenue">PNG, JPG o WebP, hasta 2 MB. Opcional.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-xs text-tenue">
              Nombre y apellidos
              <input name="nombre" required autoComplete="off" className={claseCampo} />
            </label>
            <label className="grid gap-1 text-xs text-tenue">
              Email (será su usuario del CRM)
              <input type="email" name="email" required autoComplete="off" className={claseCampo} />
            </label>
            <label className="grid gap-1 text-xs text-tenue">
              Puesto
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
              Fecha de alta
              <input type="date" name="fecha_alta" defaultValue={hoyMadrid()} required className={claseCampo} />
            </label>
          </div>

          <p className="fila px-4 py-3 text-xs leading-relaxed text-tenue">
            Al guardar se crea su checklist de incorporación ({equipo.incorporacion.length} tareas) y una cuenta
            del CRM con su email y una contraseña nueva, que verás una sola vez.
          </p>

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
