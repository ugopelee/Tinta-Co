"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import {
  estadosCita,
  tiposEvento,
  type EstadoCita,
} from "@tinta/compartido/estudio";
import { moverCita } from "@/app/acciones";
import type { Cita } from "@tinta/compartido/tipos";

export type CitaTablero = Cita & {
  disenos: { nombre: string } | null;
};

export function Kanban({ citas }: { citas: CitaTablero[] }) {
  const [citasVisibles, aplicarMovimiento] = useOptimistic(
    citas,
    (actuales: CitaTablero[], cambio: { id: string; estado: EstadoCita }) =>
      actuales.map((cita) =>
        cita.id === cambio.id ? { ...cita, estado: cambio.estado } : cita,
      ),
  );

  const [, iniciarTransicion] = useTransition();
  const [arrastrando, setArrastrando] = useState<string | null>(null);
  const [columnaActiva, setColumnaActiva] = useState<EstadoCita | null>(null);
  const [error, setError] = useState("");

  function mover(cita: CitaTablero, estado: EstadoCita) {
    if (cita.estado === estado) return;

    const posicion =
      Math.max(
        0,
        ...citasVisibles
          .filter((otra) => otra.estado === estado)
          .map((otra) => otra.posicion),
      ) + 1;

    iniciarTransicion(async () => {
      aplicarMovimiento({ id: cita.id, estado });
      setError("");
      const resultado = await moverCita(cita.id, estado, posicion);
      if (!resultado.ok) setError(resultado.mensaje);
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {estadosCita.map((columna) => (
          <div key={columna.id} className="tarjeta p-5">
            <div className="flex items-center gap-2.5">
              <span
                aria-hidden
                className="h-2.5 w-2.5 rounded-full border-2"
                style={{ borderColor: columna.color }}
              />
              <p className="text-sm text-tenue">{columna.nombre}</p>
            </div>
            <p className="titular cifra mt-3 text-[2rem] leading-none">
              {citasVisibles.filter((cita) => cita.estado === columna.id).length}
            </p>
          </div>
        ))}
      </div>

      {error && (
        <p role="alert" className="text-sm text-acento-suave">
          {error}
        </p>
      )}

      <div className="grid gap-3 lg:grid-cols-4">
        {estadosCita.map((columna) => {
          const deLaColumna = citasVisibles
            .filter((cita) => cita.estado === columna.id)
            .sort((a, b) => b.posicion - a.posicion);

          return (
            <section
              key={columna.id}
              onDragOver={(evento) => {
                evento.preventDefault();
                setColumnaActiva(columna.id);
              }}
              onDragLeave={() => setColumnaActiva(null)}
              onDrop={(evento) => {
                evento.preventDefault();
                setColumnaActiva(null);
                const id = evento.dataTransfer.getData("text/plain");
                const cita = citasVisibles.find((otra) => otra.id === id);
                if (cita) mover(cita, columna.id);
              }}
              className={`tarjeta flex min-h-40 flex-col gap-2 p-3 transition-shadow duration-200 ${
                columnaActiva === columna.id ? "ring-2 ring-texto" : ""
              }`}
            >
              <header className="flex items-center gap-2 px-1 py-1">
                <span
                  aria-hidden
                  className="h-2.5 w-2.5 rounded-full border-2"
                  style={{ borderColor: columna.color }}
                />
                <h2 className="text-sm font-semibold">{columna.nombre}</h2>
                <span className="insignia cifra ml-auto !bg-superficie-alta text-tenue">
                  {deLaColumna.length}
                </span>
              </header>

              {deLaColumna.length === 0 && (
                <p className="rounded-[0.875rem] border border-dashed border-borde px-3 py-6 text-center text-xs text-tenue">
                  Vacío
                </p>
              )}

              {deLaColumna.map((cita) => (
                <Tarjeta
                  key={cita.id}
                  cita={cita}
                  arrastrando={arrastrando === cita.id}
                  onArrastrar={setArrastrando}
                  onCambiarEstado={(estado) => mover(cita, estado)}
                />
              ))}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function Tarjeta({
  cita,
  arrastrando,
  onArrastrar,
  onCambiarEstado,
}: {
  cita: CitaTablero;
  arrastrando: boolean;
  onArrastrar: (id: string | null) => void;
  onCambiarEstado: (estado: EstadoCita) => void;
}) {
  const esEvento = cita.tipo === "evento";
  const referencia = esEvento
    ? tiposEvento.find((opcion) => opcion.id === cita.tipo_evento)?.nombre ?? "Evento"
    : cita.disenos?.nombre ?? cita.estilo_interes;

  return (
    <article
      draggable
      onDragStart={(evento) => {
        evento.dataTransfer.setData("text/plain", cita.id);
        evento.dataTransfer.effectAllowed = "move";
        onArrastrar(cita.id);
      }}
      onDragEnd={() => onArrastrar(null)}
      className={`fila cursor-grab p-3.5 transition-all duration-200 hover:shadow-[0_4px_16px_rgb(0_0_0/0.06)] active:cursor-grabbing ${
        arrastrando ? "opacity-40" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold">{cita.nombre}</p>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[0.7rem] font-medium ${
            esEvento ? "bg-texto text-fondo" : "bg-superficie text-tenue"
          }`}
        >
          {esEvento ? "Evento" : "Cita"}
        </span>
      </div>
      <p className="mt-1 truncate text-xs text-tenue">{cita.email}</p>

      {referencia && (
        <p className="mt-2.5 text-sm font-medium">{referencia}</p>
      )}

      <dl className="mt-3 space-y-1 text-xs text-tenue">
        {cita.zona_cuerpo && <dd>{cita.zona_cuerpo}</dd>}
        {cita.lugar && <dd>{cita.lugar}</dd>}
        {cita.asistentes && (
          <dd>
            {cita.asistentes.toLocaleString("es-ES")} invitados
          </dd>
        )}
        {cita.fecha_deseada && (
          <dd>
            {new Date(cita.fecha_deseada).toLocaleDateString("es-ES", {
              day: "numeric",
              month: "long",
            })}
          </dd>
        )}
      </dl>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        {cita.cliente_id ? (
          <Link
            href={`/clientes/${cita.cliente_id}`}
            className="enlace-sutil whitespace-nowrap text-xs text-tenue transition-colors hover:text-texto"
          >
            Ver ficha
          </Link>
        ) : (
          <span className="whitespace-nowrap text-xs text-tenue/50">
            Sin ficha
          </span>
        )}

        {/* Alternativa al arrastre: táctil y accesible por teclado. */}
        <label className="sr-only" htmlFor={`estado-${cita.id}`}>
          Estado de la oportunidad de {cita.nombre}
        </label>
        <select
          id={`estado-${cita.id}`}
          value={cita.estado}
          onChange={(evento) =>
            onCambiarEstado(evento.target.value as EstadoCita)
          }
          className="rounded-full bg-superficie px-2.5 py-1 text-xs outline-none focus:ring-2 focus:ring-texto/15"
        >
          {estadosCita.map((columna) => (
            <option key={columna.id} value={columna.id}>
              {columna.nombre}
            </option>
          ))}
        </select>
      </div>
    </article>
  );
}
