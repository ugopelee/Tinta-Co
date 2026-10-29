"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import type { FacturaEntrante } from "@tinta/compartido/tipos";
import { quitarFacturaEntrante, reintentarFacturaEntrante } from "@/app/acciones-facturas";
import { Icono } from "@/components/Icono";

/** Cada cuánto se mira si el agente ha terminado mientras quedan facturas en cola. */
const SEGUNDOS_REFRESCO = 5;

function AccionesError({ id }: { id: string }) {
  const router = useRouter();
  const [ocupado, iniciar] = useTransition();
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState("");

  function ejecutar(accion: (id: string) => ReturnType<typeof quitarFacturaEntrante>) {
    iniciar(async () => {
      const resultado = await accion(id);
      if (!resultado.ok) return setError(resultado.mensaje);
      setError("");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" disabled={ocupado} onClick={() => ejecutar(reintentarFacturaEntrante)} className="boton !px-4 !py-2">
        Reintentar
      </button>
      {/* En dos pasos: quitar borra también el original subido. */}
      {confirmando ? (
        <>
          <button type="button" disabled={ocupado} onClick={() => ejecutar(quitarFacturaEntrante)} className="boton-fantasma text-acento">
            Sí, quitar
          </button>
          <button type="button" disabled={ocupado} onClick={() => setConfirmando(false)} className="boton-fantasma">
            Cancelar
          </button>
        </>
      ) : (
        <button type="button" disabled={ocupado} onClick={() => setConfirmando(true)} className="boton-fantasma">
          Quitar
        </button>
      )}
      {error && (
        <p role="alert" className="w-full text-sm text-acento">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Las facturas subidas que el agente aún no ha convertido en factura por
 * revisar. Mientras haya alguna esperando, la página se refresca sola: así
 * se ve cómo pasa de la cola a «Por revisar» sin recargar a mano.
 */
export function ColaFacturasEntrantes({ entrantes }: { entrantes: FacturaEntrante[] }) {
  const router = useRouter();
  const esperando = entrantes.some((e) => e.estado !== "error");

  useEffect(() => {
    if (!esperando) return;
    const temporizador = setInterval(() => router.refresh(), SEGUNDOS_REFRESCO * 1000);
    return () => clearInterval(temporizador);
  }, [esperando, router]);

  if (entrantes.length === 0) return null;

  return (
    <section aria-label="Facturas en cola" className="tarjeta mb-3 grid gap-2 p-5">
      <p className="font-semibold">En cola del agente</p>
      <ul className="grid gap-2">
        {entrantes.map((entrante) => (
          <li key={entrante.id} className="fila grid gap-2 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <Icono
                  nombre={entrante.estado === "error" ? "aviso" : "reloj"}
                  className={`h-4 w-4 shrink-0 ${entrante.estado === "error" ? "text-acento" : "text-tenue"}`}
                />
                <span className="min-w-0 truncate text-sm font-medium">{entrante.nombre_archivo}</span>
                <span className="text-sm text-tenue">
                  {entrante.estado === "pendiente" && "esperando al agente…"}
                  {entrante.estado === "leyendo" && "el agente la está leyendo…"}
                  {entrante.estado === "error" && "no se ha podido leer"}
                </span>
              </div>
              <a
                href={`/facturas-entrantes/${entrante.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium underline-offset-4 hover:underline"
              >
                Ver original
                <span className="sr-only"> de {entrante.nombre_archivo} (se abre en una pestaña nueva)</span>
              </a>
            </div>
            {entrante.estado === "error" && (
              <>
                <p className="text-sm text-acento">{entrante.motivo ?? "Error desconocido."}</p>
                <AccionesError id={entrante.id} />
              </>
            )}
          </li>
        ))}
      </ul>
      {esperando && (
        <p className="text-xs text-tenue">
          Si se quedan esperando, comprueba que el agente está en marcha (<code>python agente.py --vigilar</code>).
        </p>
      )}
    </section>
  );
}
