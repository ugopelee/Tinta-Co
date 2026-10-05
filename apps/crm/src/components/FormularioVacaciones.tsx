"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { formularioInicial } from "@tinta/compartido/formularios";
import { pedirVacaciones } from "@/app/acciones-equipo";
import { claseCampo } from "@/components/FormularioAlta";
import { diasLaborables, hoyMadrid } from "@/lib/equipo";

function Enviar() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="boton !px-4 !py-2">
      {pending ? "Enviando…" : "Pedir vacaciones"}
    </button>
  );
}

/** Solicitud de vacaciones del propio empleado: nace pendiente. */
export function FormularioVacaciones({ disponibles }: { disponibles: number }) {
  const hoy = hoyMadrid();
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [vuelta, setVuelta] = useState(0);
  const [resultado, accion] = useActionState(async (anterior: typeof formularioInicial, datos: FormData) => {
    const respuesta = await pedirVacaciones(anterior, datos);
    if (respuesta.estado === "ok") {
      setDesde("");
      setHasta("");
      setVuelta((n) => n + 1);
    }
    return respuesta;
  }, formularioInicial);

  const dias = desde && hasta && hasta >= desde ? diasLaborables(desde, hasta) : 0;

  return (
    <form key={vuelta} action={accion} className="fila grid gap-3 p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-xs text-tenue">
          Desde
          <input
            type="date"
            name="desde"
            required
            min={hoy}
            value={desde}
            onChange={(evento) => setDesde(evento.target.value)}
            className={claseCampo}
          />
        </label>
        <label className="grid gap-1 text-xs text-tenue">
          Hasta
          <input
            type="date"
            name="hasta"
            required
            min={desde || hoy}
            value={hasta}
            onChange={(evento) => setHasta(evento.target.value)}
            className={claseCampo}
          />
        </label>
      </div>
      <label className="grid gap-1 text-xs text-tenue">
        Motivo (opcional)
        <input name="motivo" placeholder="Viaje, asuntos propios…" className={claseCampo} />
      </label>

      <p className={`text-xs ${dias > disponibles ? "text-acento" : "text-tenue"}`}>
        {dias > 0
          ? `${dias} ${dias === 1 ? "día laborable" : "días laborables"} · te quedan ${disponibles} disponibles`
          : `Te quedan ${disponibles} días disponibles este año`}
      </p>

      {resultado.estado !== "inicial" && (
        <p
          role={resultado.estado === "error" ? "alert" : "status"}
          className={`text-sm ${resultado.estado === "error" ? "text-acento" : "text-tenue"}`}
        >
          {resultado.mensaje}
        </p>
      )}

      <div>
        <Enviar />
      </div>
    </form>
  );
}
