"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { formularioInicial } from "@tinta/compartido/formularios";
import { registrarConsentimiento } from "@/app/acciones";
import { Icono } from "@/components/Icono";

const claseCampo =
  "w-full rounded-xl bg-superficie px-3 py-2 text-sm outline-none ring-1 ring-borde transition-shadow duration-200 placeholder:text-tenue/70 focus:ring-2 focus:ring-texto/30";

function Guardar() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="boton !px-4 !py-2">
      {pending ? "Guardando…" : "Registrar consentimiento"}
    </button>
  );
}

function Casilla({ nombre, texto, onChange }: { nombre: string; texto: string; onChange?: (valor: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm">
      <input
        type="checkbox"
        name={nombre}
        onChange={(evento) => onChange?.(evento.target.checked)}
        className="h-4 w-4 accent-[var(--texto)]"
      />
      {texto}
    </label>
  );
}

/**
 * Alta de una ficha de salud. Se abre plegada: en la ficha del cliente lo
 * primero que hay que ver es el estado, no un formulario.
 */
export function FormularioConsentimiento({
  clienteId,
  citas,
  abierto: abiertoInicial = false,
}: {
  clienteId: string;
  citas: { id: string; texto: string }[];
  abierto?: boolean;
}) {
  const [abierto, setAbierto] = useState(abiertoInicial);
  const [menor, setMenor] = useState(false);
  // Se pliega al guardar bien, desde la propia acción y no con un efecto.
  const [resultado, accion] = useActionState(
    async (anterior: typeof formularioInicial, datos: FormData) => {
      const respuesta = await registrarConsentimiento(anterior, datos);
      if (respuesta.estado === "ok") setAbierto(false);
      return respuesta;
    },
    formularioInicial,
  );
  const hoy = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" }).format(new Date());

  if (!abierto) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => setAbierto(true)} className="boton !px-4 !py-2">
          <Icono nombre="mas" className="h-4 w-4" />
          Nueva firma
        </button>
        {resultado.estado === "ok" && <p className="text-sm text-tenue">{resultado.mensaje}</p>}
      </div>
    );
  }

  return (
    <form action={accion} className="fila grid gap-3 p-4">
      <input type="hidden" name="cliente_id" value={clienteId} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-xs text-tenue">
          Fecha de firma
          <input type="date" name="fecha_firma" required defaultValue={hoy} max={hoy} className={claseCampo} />
        </label>
        <label className="grid gap-1 text-xs text-tenue">
          Para la cita
          <select name="cita_id" defaultValue="" className={claseCampo}>
            <option value="">General (sin cita concreta)</option>
            {citas.map((cita) => (
              <option key={cita.id} value={cita.id}>
                {cita.texto}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="grid gap-1 text-xs text-tenue">
        Alergias
        <input name="alergias" placeholder="Látex, níquel, pigmentos rojos…" className={claseCampo} />
      </label>
      <label className="grid gap-1 text-xs text-tenue">
        Medicación actual
        <input name="medicacion" placeholder="Anticoagulantes, isotretinoína, antibióticos…" className={claseCampo} />
      </label>
      <label className="grid gap-1 text-xs text-tenue">
        Enfermedades o condiciones de la piel
        <input name="condiciones" placeholder="Diabetes, hemofilia, epilepsia, psoriasis, queloides…" className={claseCampo} />
      </label>

      <div className="flex flex-wrap gap-x-6 gap-y-2 py-1">
        <Casilla nombre="embarazo" texto="Embarazo o lactancia" />
        <Casilla nombre="menor" texto="Es menor de edad" onChange={setMenor} />
      </div>

      {menor && (
        <label className="grid gap-1 text-xs text-tenue">
          Tutor legal que firma
          <input name="tutor" required placeholder="Nombre, DNI y parentesco" className={claseCampo} />
        </label>
      )}

      <label className="grid gap-1 text-xs text-tenue">
        Notas
        <textarea name="notas" rows={2} className={`${claseCampo} resize-none`} />
      </label>

      <div className="rounded-xl bg-superficie px-3 py-2.5">
        <Casilla nombre="firmado" texto="El cliente ha firmado el consentimiento informado (en papel o en tableta)" />
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
  );
}
