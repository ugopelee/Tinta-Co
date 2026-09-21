"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { metodosPago, type Cita, type MetodoPago } from "@tinta/compartido/tipos";
import { guardarCobro } from "@/app/acciones";
import { Pastilla } from "@/components/Pastilla";

type Cambio = {
  id: string;
  importe: number | null;
  pagado: boolean;
  metodo: MetodoPago | null;
};

const euros = (valor: number | null) =>
  valor === null
    ? "—"
    : valor.toLocaleString("es-ES", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
      });

export function TablaCobros({ citas }: { citas: Cita[] }) {
  const [visibles, aplicar] = useOptimistic(
    citas,
    (actuales: Cita[], cambio: Cambio) =>
      actuales.map((cita) =>
        cita.id === cambio.id
          ? {
              ...cita,
              importe: cambio.importe,
              pagado: cambio.pagado,
              metodo_pago: cambio.metodo,
            }
          : cita,
      ),
  );

  const [, iniciarTransicion] = useTransition();
  const [error, setError] = useState("");
  const [editando, setEditando] = useState<string | null>(null);

  function guardar(cambio: Cambio) {
    iniciarTransicion(async () => {
      aplicar(cambio);
      setError("");
      const resultado = await guardarCobro(cambio.id, cambio);
      if (!resultado.ok) setError(resultado.mensaje);
    });
  }

  return (
    <div>
      {error && (
        <p role="alert" className="border-b border-borde px-5 py-3 text-sm text-acento-suave">
          {error}
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[52rem] text-sm">
          <thead>
            <tr className="border-b border-borde text-left">
              {["Cliente", "Pieza", "Estado", "Importe", "Cobro", "Método"].map(
                (columna) => (
                  <th
                    key={columna}
                    className="etiqueta px-5 py-2.5 font-medium text-tenue"
                  >
                    {columna}
                  </th>
                ),
              )}
            </tr>
          </thead>

          <tbody>
            {visibles.map((cita) => (
              <tr
                key={cita.id}
                className="border-b border-borde/60 transition-colors duration-200 last:border-b-0 hover:bg-superficie-alta"
              >
                <td className="px-5 py-3">
                  {cita.cliente_id ? (
                    <Link href={`/clientes/${cita.cliente_id}`} className="enlace-sutil">
                      {cita.nombre}
                    </Link>
                  ) : (
                    cita.nombre
                  )}
                  <p className="mt-0.5 truncate text-xs text-tenue">{cita.email}</p>
                </td>

                <td className="px-5 py-3 text-tenue">
                  {cita.estilo_interes ?? "—"}
                </td>

                <td className="px-5 py-3">
                  <Pastilla estado={cita.estado} />
                </td>

                <td className="px-5 py-3">
                  {editando === cita.id ? (
                    <input
                      type="number"
                      min={0}
                      max={100000}
                      step={5}
                      autoFocus
                      defaultValue={cita.importe ?? ""}
                      onBlur={(evento) => {
                        const valor = evento.target.value.trim();
                        setEditando(null);
                        guardar({
                          id: cita.id,
                          importe: valor === "" ? null : Number(valor),
                          pagado: cita.pagado,
                          metodo: cita.metodo_pago,
                        });
                      }}
                      onKeyDown={(evento) => {
                        if (evento.key === "Enter") evento.currentTarget.blur();
                        if (evento.key === "Escape") setEditando(null);
                      }}
                      className="w-24 rounded-lg border border-acento bg-fondo px-2.5 py-1.5 text-sm outline-none"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEditando(cita.id)}
                      className="cifra rounded-lg border border-transparent px-2.5 py-1.5 transition-colors duration-200 hover:border-borde hover:bg-superficie"
                      title="Editar importe"
                    >
                      {euros(cita.importe)}
                    </button>
                  )}
                </td>

                <td className="px-5 py-3">
                  <button
                    type="button"
                    onClick={() =>
                      guardar({
                        id: cita.id,
                        importe: cita.importe,
                        pagado: !cita.pagado,
                        metodo: cita.pagado ? null : (cita.metodo_pago ?? "tarjeta"),
                      })
                    }
                    aria-pressed={cita.pagado}
                    className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-all duration-300 ${
                      cita.pagado
                        ? "border-[#57a86f]/40 bg-[#57a86f]/10 text-[#57a86f]"
                        : "border-borde text-tenue hover:border-tenue hover:text-texto"
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`h-1.5 w-1.5 rounded-full transition-colors duration-300 ${
                        cita.pagado ? "bg-[#57a86f]" : "bg-tenue"
                      }`}
                    />
                    {cita.pagado ? "Cobrado" : "Pendiente"}
                  </button>
                </td>

                <td className="px-5 py-3">
                  {cita.pagado ? (
                    <select
                      value={cita.metodo_pago ?? "tarjeta"}
                      onChange={(evento) =>
                        guardar({
                          id: cita.id,
                          importe: cita.importe,
                          pagado: true,
                          metodo: evento.target.value as MetodoPago,
                        })
                      }
                      aria-label={`Método de pago de ${cita.nombre}`}
                      className="rounded-lg border border-borde bg-superficie px-2.5 py-1.5 text-xs text-tenue outline-none transition-colors focus:border-acento"
                    >
                      {metodosPago.map((metodo) => (
                        <option key={metodo.id} value={metodo.id}>
                          {metodo.nombre}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-xs text-tenue/60">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
