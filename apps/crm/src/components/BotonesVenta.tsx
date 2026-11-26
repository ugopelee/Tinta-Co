"use client";

import { confirmar } from "@/lib/confirmar";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { EstadoVenta } from "@tinta/compartido/estudio";
import { cambiarEstadoVenta, facturarVenta } from "@/app/acciones-ventas";

/**
 * Acciones de una venta que ya no es presupuesto; las del presupuesto viven en
 * el editor para guardar antes lo que haya en pantalla.
 */
export function BotonesVenta({ id, estado }: { id: string; estado: Exclude<EstadoVenta, "presupuesto"> }) {
  const router = useRouter();
  const [ocupado, iniciar] = useTransition();
  const [error, setError] = useState("");

  async function cambiar(nuevo: "confirmada" | "cancelada" | "presupuesto", aviso?: string) {
    if (
      aviso &&
      !(await confirmar({
        titulo: aviso,
        aceptar: "Continuar",
        cancelar: "Volver",
        peligro: nuevo === "cancelada",
      }))
    )
      return;
    iniciar(async () => {
      const resultado = await cambiarEstadoVenta(id, nuevo);
      setError(resultado.ok ? "" : resultado.mensaje);
      if (resultado.ok) router.refresh();
    });
  }

  async function facturar() {
    const seguro = await confirmar({
      titulo: "¿Emitir la factura?",
      texto: "La venta ya no se podrá modificar.",
      aceptar: "Emitir factura",
    });
    if (!seguro) return;
    iniciar(async () => {
      const resultado = await facturarVenta(id);
      if (resultado.ok) router.push(`/facturacion/${resultado.facturaId}`);
      else setError(resultado.mensaje);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
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
      {estado === "confirmada" && (
        <button
          type="button"
          disabled={ocupado}
          onClick={() => cambiar("cancelada", "¿Cancelar esta venta?")}
          className="boton-fantasma"
        >
          Cancelar
        </button>
      )}
      {error && (
        <span role="alert" className="text-sm text-acento">
          {error}
        </span>
      )}
    </div>
  );
}
