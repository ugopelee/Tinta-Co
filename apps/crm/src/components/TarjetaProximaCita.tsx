import Link from "next/link";
import { tiposEvento } from "@tinta/compartido/estudio";
import type { Cita } from "@tinta/compartido/tipos";
import { Icono } from "@/components/Icono";
import { Pastilla } from "@/components/Pastilla";

/** Cuánto ha avanzado la cita dentro del flujo del tablero. */
const AVANCE: Record<string, number> = {
  solicitada: 25,
  confirmada: 65,
  realizada: 100,
  cancelada: 0,
};

const PASOS = ["Solicitada", "Confirmada", "Realizada"];

/**
 * La pieza de cabecera del panel: la cita que toca de verdad, con su estado,
 * lo que ha avanzado y los tres datos que se preguntan antes de sentarse a
 * tatuar. Si no hay ninguna por delante, la tarjeta lo dice y no se esconde.
 */
export function TarjetaProximaCita({ cita }: { cita: Cita | null }) {
  const avance = cita ? (AVANCE[cita.estado] ?? 0) : 0;
  const fecha = cita?.fecha_deseada ? new Date(cita.fecha_deseada) : null;

  return (
    <section className="tarjeta p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold tracking-tight">Próxima oportunidad</h2>
          {cita && (
            <span className="insignia !bg-superficie-alta text-tenue">
              {cita.tipo === "evento" ? "Evento" : "Cita"} {cita.id.slice(0, 4).toUpperCase()}
            </span>
          )}
        </div>
        {cita && <Pastilla estado={cita.estado} />}
      </div>

      {cita ? (
        <>
          <div className="fila mt-4 flex items-center gap-4 p-4">
            {/* Bloque de fecha a la izquierda, como la hora en una lista de
                llegadas: es lo primero que se mira. */}
            <div className="flex w-14 shrink-0 flex-col items-center rounded-xl bg-superficie py-2">
              <span className="etiqueta text-tenue">
                {fecha
                  ? fecha.toLocaleDateString("es-ES", { month: "short" }).replace(".", "")
                  : "—"}
              </span>
              <span className="titular cifra text-2xl leading-none">
                {fecha ? fecha.getDate() : "?"}
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <p className="titular truncate text-xl">{cita.nombre}</p>
              <p className="mt-0.5 truncate text-sm text-tenue">
                {cita.tipo === "evento"
                  ? (tiposEvento.find((opcion) => opcion.id === cita.tipo_evento)?.nombre ??
                    "Evento")
                  : (cita.estilo_interes ?? "Estilo por definir")}{" "}
                · {cita.email}
              </p>
            </div>

            <Link
              href={cita.cliente_id ? `/clientes/${cita.cliente_id}` : "/oportunidades"}
              aria-label="Abrir la ficha"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-texto text-fondo transition-opacity duration-200 hover:opacity-85"
            >
              <Icono nombre="diagonal" className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-4">
            <div className="flex gap-1">
              {PASOS.map((paso, indice) => (
                <div
                  key={paso}
                  className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${
                    avance >= [25, 65, 100][indice] ? "bg-texto" : "bg-superficie-alta"
                  }`}
                />
              ))}
            </div>
            <div className="mt-1.5 flex justify-between text-xs text-tenue">
              {PASOS.map((paso) => (
                <span key={paso}>{paso}</span>
              ))}
            </div>
          </div>

          <dl className="mt-4 grid grid-cols-3 gap-2">
            {cita.tipo === "evento" ? (
              <Dato titulo="Lugar" valor={cita.lugar ?? "Por decidir"} />
            ) : (
              <Dato titulo="Zona" valor={cita.zona_cuerpo ?? "Por decidir"} />
            )}
            <Dato titulo="Importe" valor={cita.importe ? `${cita.importe} €` : "Sin cerrar"} />
            <Dato
              titulo="Fecha"
              valor={
                fecha
                  ? fecha.toLocaleDateString("es-ES", { day: "numeric", month: "long" })
                  : "Sin fecha"
              }
            />
          </dl>
        </>
      ) : (
        <div className="fila mt-4 p-5">
          <p className="font-semibold">No hay nada por delante</p>
          <p className="mt-1 text-sm text-tenue">
            Cuando alguien reserve desde la web, aparecerá aquí con su estado y su fecha.
          </p>
        </div>
      )}
    </section>
  );
}

function Dato({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="fila px-3.5 py-3">
      <dt className="text-xs text-tenue">{titulo}</dt>
      <dd className="mt-0.5 truncate text-sm font-medium">{valor}</dd>
    </div>
  );
}
