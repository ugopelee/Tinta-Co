"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { EstadoVenta } from "@tinta/compartido/estudio";
import { cambiarEstadoVenta, facturarVenta } from "@/app/acciones-ventas";

/** Acciones de una venta según su estado; la base de datos vuelve a validar cada paso. */
export function BotonesVenta({ id, estado }: { id: string; estado: EstadoVenta }) {
  const router = useRouter();
  const [ocupado, iniciar] = useTransition();
  const [error, setError] = useState("");

  function cambiar(nuevo: "confirmada" | "cancelada" | "presupuesto", aviso?: string) {
    if (aviso && !window.confirm(aviso)) return;
    iniciar(async () => {
      const resultado = await cambiarEstadoVenta(id, nuevo);
      setError(resultado.ok ? "" : resultado.mensaje);
      if (resultado.ok) router.refresh();
    });
  }

  function facturar() {
    if (!window.confirm("Se emitirá la factura y la venta ya no se podrá modificar. ¿Continuar?")) return;
    iniciar(async () => {
      const resultado = await facturarVenta(id);
      if (resultado.ok) router.push(`/facturacion/${resultado.facturaId}`);
      else setError(resultado.mensaje);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {estado === "presupuesto" && (
        <button type="button" disabled={ocupado} onClick={() => cambiar("confirmada")} className="boton !px-4 !py-2">
          Confirmar venta
        </button>
      )}
      {estado === "confirmada" && (
        <button type="button" disabled={ocupado} onClick={facturar} className="boton !px-4 !py-2">
          Crear factura
        </button>
      )}
      {(estado === "confirmada" || estado === "cancelada") && (
        <button type="button" disabled={ocupado} onClick={() => cambiar("presupuesto")} className="boton-fantasma">
          Volver a presupuesto
        </button>
      )}
      {(estado === "presupuesto" || estado === "confirmada") && (
        <button
          type="button"
          disabled={ocupado}
          onClick={() => cambiar("cancelada", "¿Cancelar esta venta?")}
          className="boton-fantasma"
        >
          Cancelar
        </button>
      )}
      {error && <span className="text-sm text-acento">{error}</span>}
    </div>
  );
}
