import Link from "next/link";
import { crearClienteServidor } from "@tinta/compartido/supabase/servidor";
import { estadosCita, tiposActividad } from "@tinta/compartido/estudio";
import type { Actividad, Cita } from "@tinta/compartido/tipos";
import { GraficoCitas, type PuntoMes } from "@/components/GraficoCitas";
import { TarjetaIndicador } from "@/components/TarjetaIndicador";
import { Pastilla } from "@/components/Pastilla";
import { Icono } from "@/components/Icono";

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/** Últimos seis meses con el desglose por estado de cada uno. */
function porMes(citas: Cita[]): PuntoMes[] {
  const hoy = new Date();
  const meses: PuntoMes[] = [];

  for (let atras = 5; atras >= 0; atras--) {
    const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - atras, 1);
    const delMes = citas.filter((cita) => {
      const creada = new Date(cita.created_at);
      return (
        creada.getFullYear() === fecha.getFullYear() &&
        creada.getMonth() === fecha.getMonth()
      );
    });

    meses.push({
      etiqueta: MESES[fecha.getMonth()],
      valores: estadosCita.map(
        (estado) => delMes.filter((cita) => cita.estado === estado.id).length,
      ),
    });
  }

  return meses;
}

function variacion(actual: number, anterior: number) {
  if (anterior === 0) return actual === 0 ? 0 : null;
  return Math.round(((actual - anterior) / anterior) * 100);
}

export default async function Panel() {
  const supabase = await crearClienteServidor();

  const [{ data: datosCitas }, { data: datosClientes }, { data: datosActividades }] =
    await Promise.all([
      supabase.from("citas").select("*").order("created_at", { ascending: false }),
      supabase.from("clientes").select("id, created_at"),
      supabase
        .from("actividades")
        .select("*")
        .order("fecha", { ascending: false })
        .limit(6),
    ]);

  const citas = (datosCitas ?? []) as Cita[];
  const clientes = (datosClientes ?? []) as { id: string; created_at: string }[];
  const actividades = (datosActividades ?? []) as Actividad[];

  const serie = porMes(citas);
  const totalesMes = serie.map((mes) =>
    mes.valores.reduce((suma, valor) => suma + valor, 0),
  );

  const esteMes = totalesMes[totalesMes.length - 1];
  const mesAnterior = totalesMes[totalesMes.length - 2] ?? 0;

  const porEstado = (estado: string) =>
    citas.filter((cita) => cita.estado === estado).length;

  const realizadas = porEstado("realizada");
  const conversion = citas.length
    ? Math.round((realizadas / citas.length) * 100)
    : 0;

  const hoy = new Date();
  const serieClientes = serie.map((_, indice) => {
    const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - (5 - indice), 1);
    return clientes.filter((cliente) => {
      const alta = new Date(cliente.created_at);
      return (
        alta.getFullYear() === fecha.getFullYear() &&
        alta.getMonth() === fecha.getMonth()
      );
    }).length;
  });

  const proximas = citas
    .filter(
      (cita) =>
        cita.estado === "confirmada" &&
        cita.fecha_deseada &&
        new Date(cita.fecha_deseada) >= new Date(hoy.toDateString()),
    )
    .sort((a, b) => (a.fecha_deseada! < b.fecha_deseada! ? -1 : 1))
    .slice(0, 5);

  const sinResponder = porEstado("solicitada");

  return (
    <div className="px-5 py-6 lg:px-8 lg:py-8">
      <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="etiqueta text-tenue">Panel · Resumen</p>
          <h1 className="titular mt-2 text-2xl lg:text-3xl">
            {sinResponder > 0
              ? `Tienes ${sinResponder} ${sinResponder === 1 ? "solicitud" : "solicitudes"} por responder`
              : "Todo al día"}
          </h1>
        </div>

        <Link
          href="/citas"
          className="group flex items-center gap-2 rounded-lg border border-borde bg-superficie px-4 py-2.5 text-sm transition-all duration-300 hover:border-acento"
        >
          Abrir tablero
          <Icono
            nombre="flecha"
            className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
          />
        </Link>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <TarjetaIndicador
          etiqueta="Citas este mes"
          valor={esteMes}
          serie={totalesMes}
          color="#5b8dd9"
          variacion={variacion(esteMes, mesAnterior)}
          nota="vs mes anterior"
        />
        <TarjetaIndicador
          etiqueta="Sin responder"
          valor={sinResponder}
          serie={serie.map((mes) => mes.valores[0])}
          color="#bd8a2e"
          variacion={null}
          nota="esperando respuesta"
        />
        <TarjetaIndicador
          etiqueta="Clientes"
          valor={clientes.length}
          serie={serieClientes}
          color="#57a86f"
          variacion={variacion(
            serieClientes[serieClientes.length - 1],
            serieClientes[serieClientes.length - 2] ?? 0,
          )}
          nota="altas nuevas"
        />
        <TarjetaIndicador
          etiqueta="Tasa de realización"
          valor={conversion}
          sufijo="%"
          serie={serie.map((mes) => mes.valores[2])}
          color="#c2452f"
          variacion={null}
          nota={`${realizadas} de ${citas.length} citas`}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.7fr_1fr]">
        <section className="rounded-xl border border-borde bg-superficie p-5 lg:p-6">
          <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <h2 className="text-base font-medium">Citas por mes</h2>
              <p className="mt-1 text-xs text-tenue">
                Últimos seis meses, desglosadas por estado
              </p>
            </div>
            <p className="cifra titular text-2xl">{citas.length}</p>
          </div>

          <GraficoCitas datos={serie} />
        </section>

        <section className="rounded-xl border border-borde bg-superficie p-5 lg:p-6">
          <h2 className="text-base font-medium">Actividad reciente</h2>

          {actividades.length === 0 ? (
            <p className="mt-5 text-sm text-tenue">
              Todavía no se ha registrado nada.
            </p>
          ) : (
            <ul className="mt-5 space-y-1">
              {actividades.map((actividad) => (
                <li
                  key={actividad.id}
                  className="flex gap-3 rounded-lg p-2 transition-colors duration-200 hover:bg-superficie-alta"
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-borde bg-superficie-alta text-tenue">
                    <Icono nombre="nota" className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{actividad.titulo}</p>
                    <p className="mt-0.5 text-xs text-tenue">
                      {tiposActividad.find((t) => t.id === actividad.tipo)?.nombre}
                    </p>
                  </div>
                  <p className="shrink-0 text-xs text-tenue">
                    {new Date(actividad.fecha).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="mt-4 overflow-hidden rounded-xl border border-borde bg-superficie">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-borde px-5 py-4">
          <h2 className="text-base font-medium">Próximas citas confirmadas</h2>
          <Link
            href="/citas"
            className="enlace-sutil text-sm text-tenue transition-colors hover:text-texto"
          >
            Ver todas
          </Link>
        </div>

        {proximas.length === 0 ? (
          <p className="px-5 py-8 text-sm text-tenue">
            No hay ninguna cita confirmada por delante.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-sm">
              <thead>
                <tr className="border-b border-borde text-left">
                  {["Cliente", "Estilo", "Zona", "Fecha", "Estado"].map(
                    (columna) => (
                      <th
                        key={columna}
                        className="etiqueta px-5 py-3 font-normal text-tenue"
                      >
                        {columna}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {proximas.map((cita) => (
                  <tr
                    key={cita.id}
                    className="border-b border-borde/60 transition-colors duration-200 last:border-b-0 hover:bg-superficie-alta"
                  >
                    <td className="px-5 py-3.5">
                      {cita.cliente_id ? (
                        <Link
                          href={`/clientes/${cita.cliente_id}`}
                          className="enlace-sutil"
                        >
                          {cita.nombre}
                        </Link>
                      ) : (
                        cita.nombre
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-tenue">
                      {cita.estilo_interes ?? "—"}
                    </td>
                    <td className="px-5 py-3.5 text-tenue">
                      {cita.zona_cuerpo ?? "—"}
                    </td>
                    <td className="cifra px-5 py-3.5 text-tenue">
                      {new Date(cita.fecha_deseada!).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "short",
                      })}
                    </td>
                    <td className="px-5 py-3.5">
                      <Pastilla estado={cita.estado} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
