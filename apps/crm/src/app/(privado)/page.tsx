import Link from "next/link";
import { crearClienteServidor } from "@tinta/compartido/supabase/servidor";
import { estadosCita, tiposActividad } from "@tinta/compartido/estudio";
import type { Actividad, Cita } from "@tinta/compartido/tipos";
import { Bloque } from "@/components/Bloque";
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
    <div className="px-4 py-6 lg:px-6 lg:py-7">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="titular text-xl lg:text-[1.375rem]">
            {sinResponder > 0
              ? `Tienes ${sinResponder} ${sinResponder === 1 ? "solicitud" : "solicitudes"} por responder`
              : "Todo al día"}
          </h1>
          <p className="mt-1 text-sm text-tenue">
            {citas.length} {citas.length === 1 ? "cita" : "citas"} registradas ·{" "}
            {clientes.length} {clientes.length === 1 ? "cliente" : "clientes"}
          </p>
        </div>

        <Link
          href="/citas"
          className="group flex items-center gap-2 rounded-lg bg-acento px-4 py-2.5 text-sm font-medium text-white transition-opacity duration-200 hover:opacity-90"
        >
          Abrir tablero
          <Icono
            nombre="flecha"
            className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
          />
        </Link>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <TarjetaIndicador
          icono="calendario"
          etiqueta="Citas este mes"
          valor={esteMes}
          variacion={variacion(esteMes, mesAnterior)}
          nota="frente al mes anterior"
        />
        <TarjetaIndicador
          icono="reloj"
          etiqueta="Sin responder"
          valor={sinResponder}
          variacion={null}
          nota="esperando respuesta"
          subirEsMalo
        />
        <TarjetaIndicador
          icono="personas"
          etiqueta="Clientes"
          valor={clientes.length}
          variacion={variacion(
            serieClientes[serieClientes.length - 1],
            serieClientes[serieClientes.length - 2] ?? 0,
          )}
          nota="altas nuevas este mes"
        />
        <TarjetaIndicador
          icono="grafico"
          etiqueta="Tasa de realización"
          valor={conversion}
          sufijo="%"
          variacion={null}
          nota={`${realizadas} de ${citas.length} citas`}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.7fr_1fr]">
        <Bloque
          icono="grafico"
          titulo="Citas por mes"
          nota="Últimos seis meses, desglosadas por estado"
          accion={{ href: "/citas", texto: "Ver tablero" }}
        >
          <GraficoCitas datos={serie} />
        </Bloque>

        <Bloque icono="nota" titulo="Actividad reciente">
          {actividades.length === 0 ? (
            <p className="py-6 text-sm text-tenue">
              Todavía no se ha registrado nada.
            </p>
          ) : (
            <ul className="-mx-2 space-y-0.5">
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
        </Bloque>
      </div>

      <div className="mt-4">
        <Bloque
          icono="calendario"
          titulo="Próximas citas confirmadas"
          accion={{ href: "/citas", texto: "Ver todas" }}
          ajustado
        >
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
                          className="etiqueta px-5 py-2.5 font-medium text-tenue"
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
                      <td className="px-5 py-3">
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
                      <td className="px-5 py-3 text-tenue">
                        {cita.estilo_interes ?? "—"}
                      </td>
                      <td className="px-5 py-3 text-tenue">
                        {cita.zona_cuerpo ?? "—"}
                      </td>
                      <td className="cifra px-5 py-3 text-tenue">
                        {new Date(cita.fecha_deseada!).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "short",
                        })}
                      </td>
                      <td className="px-5 py-3">
                        <Pastilla estado={cita.estado} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Bloque>
      </div>
    </div>
  );
}
