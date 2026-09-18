"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { estadosCita, type EstadoCita } from "@tinta/compartido/estudio";
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
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {estadosCita.map((columna) => (
          <div
            key={columna.id}
            className="rounded-xl border border-borde bg-superficie p-5"
          >
            <div className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: columna.color }}
              />
              <p className="text-xs uppercase tracking-widest text-tenue">
                {columna.nombre}
              </p>
            </div>
            <p className="mt-3 titular text-3xl">
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

      <div className="grid gap-5 lg:grid-cols-4">
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
              className={`flex min-h-40 flex-col gap-3 rounded-xl border p-4 transition-colors duration-200 ${
                columnaActiva === columna.id
                  ? "border-acento bg-superficie-alta"
                  : "border-borde bg-superficie/50"
              }`}
            >
              <header className="flex items-center justify-between">
                <h2 className="text-sm font-medium">{columna.nombre}</h2>
                <span className="text-xs text-tenue">{deLaColumna.length}</span>
              </header>

              {deLaColumna.length === 0 && (
                <p className="rounded-lg border border-dashed border-borde px-3 py-6 text-center text-xs text-tenue">
                  Sin citas
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
  const referencia = cita.disenos?.nombre ?? cita.estilo_interes;

  return (
    <article
      draggable
      onDragStart={(evento) => {
        evento.dataTransfer.setData("text/plain", cita.id);
        evento.dataTransfer.effectAllowed = "move";
        onArrastrar(cita.id);
      }}
      onDragEnd={() => onArrastrar(null)}
      className={`cursor-grab rounded-lg border border-borde bg-superficie-alta p-4 transition-all duration-200 hover:border-acento/60 active:cursor-grabbing ${
        arrastrando ? "opacity-40" : ""
      }`}
    >
      <p className="font-medium">{cita.nombre}</p>
      <p className="mt-1 truncate text-xs text-tenue">{cita.email}</p>

      {referencia && (
        <p className="mt-3 text-sm text-acento-suave">{referencia}</p>
      )}

      <dl className="mt-3 space-y-1 text-xs text-tenue">
        {cita.zona_cuerpo && <dd>{cita.zona_cuerpo}</dd>}
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
          Estado de la cita de {cita.nombre}
        </label>
        <select
          id={`estado-${cita.id}`}
          value={cita.estado}
          onChange={(evento) =>
            onCambiarEstado(evento.target.value as EstadoCita)
          }
          className="rounded border border-borde bg-superficie px-2 py-1 text-xs text-tenue outline-none focus:border-acento"
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
