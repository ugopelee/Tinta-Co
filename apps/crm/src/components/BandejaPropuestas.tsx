"use client";

import { useOptimistic, useState, useTransition } from "react";
import {
  estadosCita,
  estudio,
  nombresEstadoPropuesta,
  tiposPropuesta,
  type EstadoCita,
} from "@tinta/compartido/estudio";
import type { Cita } from "@tinta/compartido/tipos";
import { moverCita } from "@/app/acciones";
import { Icono } from "@/components/Icono";

const URL_WEB = process.env.NEXT_PUBLIC_URL_WEB ?? "/";

/** «hoy», «ayer», «hace 5 días»; más allá de un mes, la fecha. */
function haceCuanto(fecha: string) {
  const dias = Math.floor((Date.now() - new Date(fecha).getTime()) / 86_400_000);
  if (dias <= 0) return "hoy";
  if (dias === 1) return "ayer";
  if (dias < 30) return `hace ${dias} días`;
  return new Date(fecha).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

/**
 * Las propuestas de negocio no se agendan ni se cobran: se leen, se contestan
 * y se cierran. Por eso no van en columnas sino en una bandeja, con el
 * mensaje a la vista y lo nuevo arriba.
 */
export function BandejaPropuestas({ propuestas }: { propuestas: Cita[] }) {
  const [visibles, aplicarCambio] = useOptimistic(
    propuestas,
    (actuales: Cita[], cambio: { id: string; estado: EstadoCita }) =>
      actuales.map((propuesta) =>
        propuesta.id === cambio.id ? { ...propuesta, estado: cambio.estado } : propuesta,
      ),
  );
  const [, iniciarTransicion] = useTransition();
  const [error, setError] = useState("");

  function cambiarEstado(propuesta: Cita, estado: EstadoCita) {
    if (propuesta.estado === estado) return;
    const posicion =
      Math.max(0, ...visibles.filter((otra) => otra.estado === estado).map((otra) => otra.posicion)) + 1;

    iniciarTransicion(async () => {
      aplicarCambio({ id: propuesta.id, estado });
      setError("");
      const resultado = await moverCita(propuesta.id, estado, posicion);
      if (!resultado.ok) setError(resultado.mensaje);
    });
  }

  if (visibles.length === 0) {
    return (
      <div className="tarjeta flex flex-col items-center px-6 py-16 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-full border border-borde text-tenue">
          <Icono nombre="nota" className="h-5 w-5" />
        </span>
        <p className="mt-4 text-sm">Todavía no ha llegado ninguna propuesta.</p>
        <p className="mt-1 max-w-sm text-sm text-tenue">
          Proveedores, artistas y marcas escriben desde la sección «Colabora» de la web.
        </p>
        <a
          href={`${URL_WEB}#colabora`}
          className="mt-5 rounded-full border border-borde px-4 py-1.5 text-sm text-tenue transition-colors hover:text-texto"
        >
          Ver la sección
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <p role="alert" className="text-sm text-acento-suave">
          {error}
        </p>
      )}

      {estadosCita.map((estado) => {
        const delGrupo = visibles
          .filter((propuesta) => propuesta.estado === estado.id)
          .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

        if (delGrupo.length === 0) return null;

        const filas = (
          <ul className="space-y-2">
            {delGrupo.map((propuesta) => (
              <Fila key={propuesta.id} propuesta={propuesta} onCambiarEstado={cambiarEstado} />
            ))}
          </ul>
        );

        const cabecera = (
          <span className="flex items-center gap-2.5 px-1">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ background: estado.color }} />
            <span className="etiqueta text-tenue">{nombresEstadoPropuesta[estado.id]}</span>
            <span className="cifra text-xs text-tenue">{delGrupo.length}</span>
          </span>
        );

        // Lo descartado se guarda por si vuelve, pero no estorba.
        return estado.id === "cancelada" ? (
          <details key={estado.id} className="group">
            <summary className="flex cursor-pointer list-none items-center gap-2 [&::-webkit-details-marker]:hidden">
              {cabecera}
              <span className="text-xs text-tenue transition-transform duration-200 group-open:rotate-90">›</span>
            </summary>
            <div className="mt-3">{filas}</div>
          </details>
        ) : (
          <section key={estado.id} className="space-y-3">
            {cabecera}
            {filas}
          </section>
        );
      })}
    </div>
  );
}

function Fila({
  propuesta,
  onCambiarEstado,
}: {
  propuesta: Cita;
  onCambiarEstado: (propuesta: Cita, estado: EstadoCita) => void;
}) {
  const tipo = tiposPropuesta.find((opcion) => opcion.id === propuesta.tipo);
  const nueva = propuesta.estado === "solicitada";
  const asunto = encodeURIComponent(`Tu propuesta a ${estudio.nombre}`);

  return (
    <li
      className={`tarjeta grid gap-4 p-4 md:grid-cols-[minmax(0,14rem)_minmax(0,1fr)_auto] md:items-start md:p-5 ${
        nueva ? "ring-2 ring-lima" : ""
      }`}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="etiqueta rounded-full border border-borde px-2 py-0.5 text-[0.6rem] text-tenue">
            {tipo?.nombre ?? "Propuesta"}
          </span>
          <span className="text-xs text-tenue">{haceCuanto(propuesta.created_at)}</span>
        </div>
        <p className="mt-2 truncate text-sm font-medium">{propuesta.nombre}</p>
        {propuesta.empresa && (
          <p className="truncate text-sm font-medium">{propuesta.empresa}</p>
        )}
      </div>

      <p className="line-clamp-3 whitespace-pre-line text-sm leading-relaxed text-tenue md:line-clamp-4">
        {propuesta.mensaje ?? "Sin mensaje."}
      </p>

      <div className="flex flex-wrap items-center gap-2 md:flex-col md:items-end">
        <a
          href={`mailto:${propuesta.email}?subject=${asunto}`}
          title={propuesta.email}
          className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs transition-[opacity,transform] duration-150 ease-out active:scale-[0.97] ${
            nueva ? "bg-texto text-fondo hover:opacity-90" : "border border-borde text-tenue hover:text-texto"
          }`}
        >
          Responder
          <Icono nombre="flecha" className="h-3.5 w-3.5" />
        </a>
        {propuesta.telefono && (
          <a
            href={`tel:${propuesta.telefono.replace(/\s/g, "")}`}
            className="cifra whitespace-nowrap text-xs text-tenue transition-colors hover:text-texto"
          >
            {propuesta.telefono}
          </a>
        )}

        <label className="sr-only" htmlFor={`estado-${propuesta.id}`}>
          Estado de la propuesta de {propuesta.nombre}
        </label>
        <select
          id={`estado-${propuesta.id}`}
          value={propuesta.estado}
          onChange={(evento) => onCambiarEstado(propuesta, evento.target.value as EstadoCita)}
          className="rounded-full border border-borde bg-superficie px-2.5 py-1 text-xs text-tenue outline-none focus:border-texto"
        >
          {estadosCita.map((estado) => (
            <option key={estado.id} value={estado.id}>
              {nombresEstadoPropuesta[estado.id]}
            </option>
          ))}
        </select>
      </div>
    </li>
  );
}
