"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { estadosCita, type EstadoCita } from "@tinta/compartido/estudio";
import { Icono } from "@/components/Icono";

/** Lo mínimo de cada cita para calcular la cartera en el navegador. */
export type ResumenCita = {
  creada: string;
  estado: EstadoCita;
  importe: number | null;
  pagado: boolean;
};

const RANGOS = [
  { id: "hoy", texto: "Hoy", dias: 1 },
  { id: "semana", texto: "7 días", dias: 7 },
  { id: "mes", texto: "30 días", dias: 30 },
] as const;

type Rango = (typeof RANGOS)[number]["id"];

const euros = (valor: number) =>
  valor.toLocaleString("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });

/**
 * Cabecera de indicadores con el selector de periodo y el embudo de estados.
 * El filtro se resuelve aquí y no en el servidor: son cuatro sumas sobre una
 * lista que ya ha viajado, y así el cambio de periodo es instantáneo.
 */
export function Cartera({ citas }: { citas: ResumenCita[] }) {
  const [rango, setRango] = useState<Rango>("semana");

  const { total, solicitadas, confirmadas, ingresos } = useMemo(() => {
    const dias = RANGOS.find((opcion) => opcion.id === rango)!.dias;
    const desde = new Date();
    desde.setHours(0, 0, 0, 0);
    desde.setDate(desde.getDate() - (dias - 1));

    const dentro = citas.filter((cita) => new Date(cita.creada) >= desde);

    return {
      total: dentro.length,
      solicitadas: dentro.filter((cita) => cita.estado === "solicitada").length,
      confirmadas: dentro.filter((cita) => cita.estado === "confirmada").length,
      ingresos: dentro
        .filter((cita) => cita.pagado)
        .reduce((suma, cita) => suma + (cita.importe ?? 0), 0),
    };
  }, [citas, rango]);

  // El embudo mira todas las citas: con un periodo corto se quedaría vacío y
  // dejaría de contar la historia que tiene que contar.
  const embudo = estadosCita.map((estado) => ({
    ...estado,
    cuantas: citas.filter((cita) => cita.estado === estado.id).length,
  }));

  const realizadas = embudo.find((tramo) => tramo.id === "realizada")?.cuantas ?? 0;
  const tasa = citas.length ? Math.round((realizadas / citas.length) * 100) : 0;

  return (
    <section className="tarjeta p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold tracking-tight">Cartera</h2>

        <div role="group" aria-label="Periodo" className="segmentos">
          {RANGOS.map((opcion) => (
            <button
              key={opcion.id}
              type="button"
              onClick={() => setRango(opcion.id)}
              aria-pressed={rango === opcion.id}
              className="segmento !px-3 !py-1 !text-xs"
            >
              {opcion.texto}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <Indicador
          etiqueta="Oportunidades nuevas"
          valor={String(total)}
          nota={`${citas.length} en total`}
          destacado
        />
        <Indicador
          etiqueta="Solicitudes"
          valor={String(solicitadas)}
          nota="por responder"
        />
        <Indicador
          etiqueta="Confirmadas"
          valor={String(confirmadas)}
          nota="con hueco reservado"
        />
        <Indicador
          etiqueta="Cobrado"
          valor={euros(ingresos)}
          nota="en el periodo"
        />
      </div>

      <div className="fila mt-2 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium">Embudo de oportunidades</p>
          <p className="flex items-center gap-3 text-xs text-tenue">
            <span>Tasa de realización {tasa}%</span>
            <Link
              href="/oportunidades"
              className="group flex items-center gap-1 font-medium text-texto transition-opacity hover:opacity-70"
            >
              Abrir
              <Icono
                nombre="flecha"
                className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5"
              />
            </Link>
          </p>
        </div>

        <div className="mt-3 flex gap-1.5">
          {embudo.map((tramo) => (
            <div
              key={tramo.id}
              className="h-2.5 rounded-full transition-all duration-500"
              style={{
                // Un tramo vacío conserva un hilo de ancho para que la escala
                // de cuatro estados se siga leyendo entera.
                flexGrow: tramo.cuantas || 0.15,
                background: tramo.cuantas
                  ? tramo.color
                  : "var(--borde)",
              }}
            />
          ))}
        </div>

        <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {embudo.map((tramo) => (
            <li key={tramo.id}>
              <p className="titular cifra text-lg leading-none">
                {tramo.cuantas}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-tenue">
                <span
                  aria-hidden
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: tramo.color }}
                />
                {tramo.nombre}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Indicador({
  etiqueta,
  valor,
  nota,
  destacado = false,
}: {
  etiqueta: string;
  valor: string;
  nota: string;
  destacado?: boolean;
}) {
  return (
    <article
      className={`rounded-[0.875rem] p-4 ${
        destacado ? "bg-texto text-fondo" : "bg-superficie-alta"
      }`}
    >
      <p className={`text-[0.8125rem] ${destacado ? "text-fondo/70" : "text-tenue"}`}>
        {etiqueta}
      </p>
      <p className="titular cifra mt-2 truncate text-[1.75rem] leading-none">
        {valor}
      </p>
      <p className={`mt-2 text-xs ${destacado ? "text-fondo/60" : "text-tenue"}`}>
        {nota}
      </p>
    </article>
  );
}
