"use client";

import { confirmar } from "@/lib/confirmar";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { metodosPago, type MetodoPago } from "@tinta/compartido/tipos";
import { anularFactura, marcarFacturaCobrada } from "@/app/acciones-facturas";
import { claseCampo } from "@/components/FormularioAlta";

/** Acciones de una factura emitida; las demás ya no admiten cambios. */
export function BotonesFactura({ id }: { id: string }) {
  const router = useRouter();
  const [ocupado, iniciar] = useTransition();
  const [metodo, setMetodo] = useState<MetodoPago>("transferencia");
  const [motivo, setMotivo] = useState("");
  const [anulando, setAnulando] = useState(false);
  const [error, setError] = useState("");

  async function cobrar() {
    const seguro = await confirmar({
      titulo: "¿Marcar la factura como cobrada?",
      texto: "Se registra el cobro con fecha de hoy y la factura ya no se podrá modificar.",
      aceptar: "Marcar cobrada",
    });
    if (!seguro) return;
    iniciar(async () => {
      const resultado = await marcarFacturaCobrada(id, metodo);
      if (!resultado.ok) return setError(resultado.mensaje);
      // Con aviso de la cita la factura ya está cobrada: se refresca igualmente.
      setError(resultado.aviso ?? "");
      router.refresh();
    });
  }

  async function anular() {
    const seguro = await confirmar({
      titulo: "¿Anular la factura?",
      texto: "Quedará anulada y no se podrá deshacer.",
      aceptar: "Anular factura",
      peligro: true,
    });
    if (!seguro) return;
    iniciar(async () => {
      const resultado = await anularFactura(id, motivo);
      if (!resultado.ok) return setError(resultado.mensaje);
      setError("");
      router.refresh();
    });
  }

  return (
    <div className="tarjeta mb-3 grid gap-3 p-4 print:hidden">
      <div className="flex flex-wrap items-end gap-2">
        <label className="grid gap-1 text-sm">
          <span className="text-tenue">Método de pago</span>
          <select
            value={metodo}
            onChange={(e) => setMetodo(e.target.value as MetodoPago)}
            className={claseCampo}
            disabled={ocupado}
          >
            {metodosPago.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre}
              </option>
            ))}
          </select>
        </label>
        <button type="button" disabled={ocupado} onClick={cobrar} className="boton !px-4 !py-2">
          Marcar cobrada
        </button>
        {!anulando && (
          <button type="button" disabled={ocupado} onClick={() => setAnulando(true)} className="boton-fantasma">
            Anular
          </button>
        )}
      </div>

      {anulando && (
        <div className="grid gap-2">
          <label className="grid gap-1 text-sm">
            <span className="text-tenue">Motivo de la anulación</span>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={2}
              className={claseCampo}
              disabled={ocupado}
            />
          </label>
          <div className="flex gap-2">
            <button type="button" disabled={ocupado || !motivo.trim()} onClick={anular} className="boton !px-4 !py-2">
              Confirmar anulación
            </button>
            <button type="button" disabled={ocupado} onClick={() => setAnulando(false)} className="boton-fantasma">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm text-acento">
          {error}
        </p>
      )}
    </div>
  );
}
