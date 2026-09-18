import Link from "next/link";
import { crearClienteServidor } from "@tinta/compartido/supabase/servidor";
import { estadosCita, tiposActividad } from "@tinta/compartido/estudio";
import type { Actividad, Cita } from "@tinta/compartido/tipos";
import { GraficoCitas, type PuntoMes } from "@/components/GraficoCitas";

const MESES = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

/** Últimos seis meses, incluido el actual, con su recuento de citas. */
function citasPorMes(citas: Cita[]): PuntoMes[] {
  const hoy = new Date();
  const meses: PuntoMes[] = [];

  for (let atras = 5; atras >= 0; atras--) {
    const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - atras, 1);
    const valor = citas.filter((cita) => {
      const creada = new Date(cita.created_at);
      return (
        creada.getFullYear() === fecha.getFullYear() &&
        creada.getMonth() === fecha.getMonth()
      );
    }).length;

    meses.push({ etiqueta: MESES[fecha.getMonth()], valor });
  }

  return meses;
}

export default async function Panel() {
  const supabase = await crearClienteServidor();

  const [{ data: datosCitas }, { count: totalClientes }, { data: datosActividades }] =
    await Promise.all([
      supabase.from("citas").select("*").order("created_at", { ascending: false }),
      supabase.from("clientes").select("*", { count: "exact", head: true }),
      supabase
        .from("actividades")
        .select("*")
        .order("fecha", { ascending: false })
        .limit(5),
    ]);

  const citas = (datosCitas ?? []) as Cita[];
  const actividades = (datosActividades ?? []) as Actividad[];

  const porEstado = (estado: string) =>
    citas.filter((cita) => cita.estado === estado).length;

  const hoy = new Date();
  const esteMes = citas.filter((cita) => {
    const creada = new Date(cita.created_at);
    return (
      creada.getFullYear() === hoy.getFullYear() &&
      creada.getMonth() === hoy.getMonth()
    );
  }).length;

  const realizadas = porEstado("realizada");
  const conversion = citas.length
    ? Math.round((realizadas / citas.length) * 100)
    : 0;

  const proximas = citas
    .filter(
      (cita) =>
        cita.estado === "confirmada" &&
        cita.fecha_deseada &&
        new Date(cita.fecha_deseada) >= new Date(hoy.toDateString()),
    )
    .sort((a, b) => (a.fecha_deseada! < b.fecha_deseada! ? -1 : 1))
    .slice(0, 5);

  return (
    <div className="px-6 py-8 lg:px-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="titular text-3xl">Panel</h1>
          <p className="mt-2 text-sm text-tenue">
            Resumen del estudio a{" "}
            {hoy.toLocaleDateString("es-ES", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <Link
          href="/citas"
          className="rounded-full border border-borde px-5 py-2.5 text-sm text-tenue transition-colors hover:border-acento hover:text-texto"
        >
          Ir al tablero
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Indicador etiqueta="Citas este mes" valor={esteMes} />
        <Indicador etiqueta="Sin responder" valor={porEstado("solicitada")} />
        <Indicador etiqueta="Confirmadas" valor={porEstado("confirmada")} />
        <Indicador etiqueta="Clientes" valor={totalClientes ?? 0} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <section className="rounded-xl border border-borde bg-superficie p-6">
          <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <h2 className="titular text-xl">Citas recibidas</h2>
              <p className="mt-1 text-sm text-tenue">Últimos seis meses</p>
            </div>
            <p className="etiqueta text-tenue">
              {realizadas} {realizadas === 1 ? "realizada" : "realizadas"} ·{" "}
              {conversion}% del total
            </p>
          </div>
          <GraficoCitas datos={citasPorMes(citas)} />
        </section>

        <section className="rounded-xl border border-borde bg-superficie p-6">
          <h2 className="titular text-xl">Reparto por estado</h2>
          <ul className="mt-6 space-y-4">
            {estadosCita.map((columna) => {
              const cantidad = porEstado(columna.id);
              const porcentaje = citas.length
                ? Math.round((cantidad / citas.length) * 100)
                : 0;

              return (
                <li key={columna.id}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="flex items-center gap-2">
                      <span
                        aria-hidden
                        className="h-2 w-2 rounded-full"
                        style={{ background: columna.color }}
                      />
                      {columna.nombre}
                    </span>
                    <span className="cifra text-tenue">
                      {cantidad} · {porcentaje}%
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-superficie-alta">
                    <div
                      className="h-full rounded-full transition-[width] duration-700"
                      style={{
                        width: `${porcentaje}%`,
                        background: columna.color,
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="rounded-xl border border-borde bg-superficie p-6">
          <h2 className="titular text-xl">Próximas citas confirmadas</h2>

          {proximas.length === 0 ? (
            <p className="mt-5 text-sm text-tenue">
              No hay ninguna cita confirmada por delante.
            </p>
          ) : (
            <ul className="mt-5 divide-y divide-borde">
              {proximas.map((cita) => (
                <li
                  key={cita.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm">{cita.nombre}</p>
                    <p className="mt-0.5 truncate text-xs text-tenue">
                      {cita.estilo_interes ?? "Sin estilo"}
                      {cita.zona_cuerpo && ` · ${cita.zona_cuerpo}`}
                    </p>
                  </div>
                  <span className="cifra shrink-0 text-sm text-acento-suave">
                    {new Date(cita.fecha_deseada!).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-borde bg-superficie p-6">
          <h2 className="titular text-xl">Última actividad</h2>

          {actividades.length === 0 ? (
            <p className="mt-5 text-sm text-tenue">
              Todavía no se ha registrado nada.
            </p>
          ) : (
            <ul className="mt-5 divide-y divide-borde">
              {actividades.map((actividad) => (
                <li key={actividad.id} className="flex gap-3 py-3">
                  <span
                    aria-hidden
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-acento"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm">{actividad.titulo}</p>
                    <p className="mt-0.5 text-xs text-tenue">
                      {tiposActividad.find((t) => t.id === actividad.tipo)?.nombre}
                      {" · "}
                      {new Date(actividad.fecha).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "long",
                      })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Indicador({ etiqueta, valor }: { etiqueta: string; valor: number }) {
  return (
    <div className="rounded-xl border border-borde bg-superficie p-5">
      <p className="etiqueta text-tenue">{etiqueta}</p>
      <p className="titular cifra mt-3 text-4xl">{valor}</p>
    </div>
  );
}
