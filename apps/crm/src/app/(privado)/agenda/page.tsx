import type { Metadata } from "next";
import Link from "next/link";
import { estadosCita, estudio, tiposEncargo, tiposEvento } from "@tinta/compartido/estudio";
import { crearClienteServidor } from "@tinta/compartido/supabase/servidor";
import type { Cita, Consentimiento } from "@tinta/compartido/tipos";
import { estaAlDia, estadoConsentimiento, ultimosPorCliente } from "@/lib/consentimientos";
import { Bloque } from "@/components/Bloque";
import { Encabezado } from "@/components/Encabezado";
import { Icono } from "@/components/Icono";

export const metadata: Metadata = { title: "Agenda" };

const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MAX_POR_DIA = 3;

/** Los días que el estudio cierra van rayados: se ven vacíos a propósito. */
const RAYADO = {
  backgroundImage:
    "repeating-linear-gradient(135deg, var(--superficie-alta) 0 5px, transparent 5px 10px)",
};

const abiertos: readonly number[] = estudio.contacto.diasAbiertos;

/** «2026-10-01» de hoy en Madrid, aunque el servidor viva en otra zona. */
function hoyEnMadrid() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" }).format(new Date());
}

/** Fechas como texto «AAAA-MM-DD»: sin horas no hay zonas que las muevan. */
const clave = (anio: number, mes: number, dia: number) =>
  `${anio}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;

const diaDeLaSemana = (fecha: string) => new Date(`${fecha}T12:00:00Z`).getUTCDay();

function mesPedido(valor: string | string[] | undefined, hoy: string) {
  const texto = typeof valor === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(valor) ? valor : hoy.slice(0, 7);
  const [anio, mes] = texto.split("-").map(Number);
  return { anio, mes: mes - 1 };
}

const desplazar = (anio: number, mes: number, pasos: number) => {
  const fecha = new Date(Date.UTC(anio, mes + pasos, 1));
  return `${fecha.getUTCFullYear()}-${String(fecha.getUTCMonth() + 1).padStart(2, "0")}`;
};

const colorDe = (estado: string) =>
  estadosCita.find((opcion) => opcion.id === estado)?.color ?? "var(--tenue)";

const descripcion = (cita: Cita) =>
  cita.tipo === "evento"
    ? (tiposEvento.find((opcion) => opcion.id === cita.tipo_evento)?.nombre ?? "Evento")
    : (cita.estilo_interes ?? "Estilo por decidir");

const enlaceDe = (cita: Cita) =>
  cita.cliente_id ? `/clientes/${cita.cliente_id}` : "/oportunidades";

/**
 * Calendario de encargos por la fecha que pidió cada cliente. No guarda nada
 * propio: es otra forma de mirar la misma tabla que el tablero. Las
 * canceladas no ocupan hueco, así que no se pintan.
 */
export default async function Agenda({ searchParams }: PageProps<"/agenda">) {
  const { mes: parametroMes } = await searchParams;
  const hoy = hoyEnMadrid();
  const { anio, mes } = mesPedido(parametroMes, hoy);

  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("citas")
    .select("*")
    .in("tipo", tiposEncargo)
    .neq("estado", "cancelada")
    .order("fecha_deseada", { ascending: true });

  const citas = (data ?? []) as Cita[];

  // Para marcar en «Próximas» a quien vendrá sin consentimiento vigente.
  const { data: datosFirmas } = await supabase.from("consentimientos").select("*");
  const firmas = ultimosPorCliente((datosFirmas ?? []) as Consentimiento[]);
  const sinConsentimiento = (cita: Cita) =>
    Boolean(cita.cliente_id) && !estaAlDia(estadoConsentimiento(firmas.get(cita.cliente_id!)));
  const conFecha = citas.filter((cita) => cita.fecha_deseada);

  const porDia = new Map<string, Cita[]>();
  for (const cita of conFecha) {
    const dia = cita.fecha_deseada!.slice(0, 10);
    porDia.set(dia, [...(porDia.get(dia) ?? []), cita]);
  }

  // Rejilla de lunes a domingo: se rellena con los días de los meses
  // vecinos hasta completar semanas enteras.
  const primero = new Date(Date.UTC(anio, mes, 1));
  const huecoInicial = (primero.getUTCDay() + 6) % 7;
  const diasMes = new Date(Date.UTC(anio, mes + 1, 0)).getUTCDate();
  const celdas = Math.ceil((huecoInicial + diasMes) / 7) * 7;

  const dias = Array.from({ length: celdas }, (_, indice) => {
    const fecha = new Date(Date.UTC(anio, mes, indice - huecoInicial + 1));
    const texto = clave(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate());
    return {
      texto,
      numero: fecha.getUTCDate(),
      delMes: fecha.getUTCMonth() === mes,
      cerrado: !abiertos.includes(fecha.getUTCDay()),
      citas: porDia.get(texto) ?? [],
    };
  });

  const enEsteMes = dias.filter((dia) => dia.delMes).reduce((suma, dia) => suma + dia.citas.length, 0);

  const proximas = conFecha
    .filter((cita) => cita.fecha_deseada!.slice(0, 10) >= hoy && cita.estado !== "realizada")
    .slice(0, 6);

  const sinFecha = citas.filter(
    (cita) => !cita.fecha_deseada && (cita.estado === "confirmada" || cita.estado === "solicitada"),
  );

  const enDiaCerrado = conFecha.filter(
    (cita) =>
      cita.estado !== "realizada" &&
      cita.fecha_deseada!.slice(0, 10) >= hoy &&
      !abiertos.includes(diaDeLaSemana(cita.fecha_deseada!.slice(0, 10))),
  );

  const nombreMes = `${new Date(Date.UTC(anio, mes, 15)).toLocaleDateString("es-ES", {
    month: "long",
    timeZone: "UTC",
  })} ${anio}`;

  return (
    <>
      <Encabezado
        miga="Estudio · agenda"
        titulo={nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)}
        nota={`${enEsteMes} ${enEsteMes === 1 ? "encargo" : "encargos"} con fecha este mes. Abierto: ${estudio.contacto.horario.toLowerCase()}.`}
      >
        {/* Navegación de meses: misma píldora que el selector de fecha de la
            referencia, con «Hoy» en negro. */}
        <nav aria-label="Cambiar de mes" className="segmentos !bg-superficie">
          <Link
            href={`/agenda?mes=${desplazar(anio, mes, -1)}`}
            aria-label="Mes anterior"
            className="segmento !px-2.5"
          >
            <Icono nombre="flecha" className="h-4 w-4 rotate-180" />
          </Link>
          <Link
            href="/agenda"
            aria-current={hoy.startsWith(clave(anio, mes, 1).slice(0, 7)) ? "page" : undefined}
            className="segmento"
          >
            Hoy
          </Link>
          <Link
            href={`/agenda?mes=${desplazar(anio, mes, 1)}`}
            aria-label="Mes siguiente"
            className="segmento !px-2.5"
          >
            <Icono nombre="flecha" className="h-4 w-4" />
          </Link>
        </nav>
      </Encabezado>

      <div className="grid items-start gap-3 xl:grid-cols-[1fr_21rem]">
        <section className="tarjeta overflow-hidden p-3">
          <ul className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 px-2 pt-1 text-[0.8125rem] text-tenue">
            {estadosCita
              .filter((estado) => estado.id !== "cancelada")
              .map((estado) => (
                <li key={estado.id} className="flex items-center gap-1.5">
                  <span
                    aria-hidden
                    className="h-2.5 w-2.5 rounded-full border-2"
                    style={{ borderColor: estado.color }}
                  />
                  {estado.nombre}
                </li>
              ))}
            <li className="flex items-center gap-1.5">
              <span aria-hidden className="h-3 w-3 rounded-[4px] ring-1 ring-borde" style={RAYADO} />
              Estudio cerrado
            </li>
          </ul>

          <div className="overflow-x-auto">
            <div className="grid min-w-[42rem] grid-cols-7 gap-1.5">
              {DIAS_SEMANA.map((dia) => (
                <p key={dia} className="etiqueta px-2 pb-1 text-tenue">
                  {dia}
                </p>
              ))}

              {dias.map((dia) => {
                const esHoy = dia.texto === hoy;
                const visibles = dia.citas.slice(0, MAX_POR_DIA);
                const resto = dia.citas.length - visibles.length;

                return (
                  <div
                    key={dia.texto}
                    className={`flex min-h-28 flex-col gap-1 rounded-[0.875rem] p-1.5 ${
                      dia.cerrado ? "" : "bg-superficie-alta"
                    } ${dia.delMes ? "" : "opacity-40"}`}
                    style={dia.cerrado ? RAYADO : undefined}
                  >
                    <span
                      className={`cifra flex h-7 w-7 items-center justify-center rounded-full text-[0.8125rem] font-medium ${
                        esHoy ? "bg-texto text-fondo" : dia.cerrado ? "text-tenue" : ""
                      }`}
                    >
                      {dia.numero}
                    </span>

                    {visibles.map((cita) => (
                      <Link
                        key={cita.id}
                        href={enlaceDe(cita)}
                        title={`${cita.nombre} · ${descripcion(cita)}`}
                        className="flex items-center gap-1.5 rounded-lg bg-superficie px-1.5 py-1 text-xs font-medium transition-shadow duration-200 hover:shadow-[0_2px_10px_rgb(0_0_0/0.08)]"
                      >
                        <span
                          aria-hidden
                          className="h-2 w-2 shrink-0 rounded-full border-2"
                          style={{ borderColor: colorDe(cita.estado) }}
                        />
                        <span className="truncate">{cita.nombre}</span>
                      </Link>
                    ))}

                    {resto > 0 && (
                      <span className="px-1.5 text-[0.7rem] text-tenue">+{resto} más</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <div className="space-y-3">
          {enDiaCerrado.length > 0 && (
            <section className="rounded-[1.25rem] bg-texto p-5 text-fondo">
              <div className="flex items-center gap-2 text-[0.8125rem] text-fondo/60">
                <Icono nombre="aviso" className="h-4 w-4" />
                Revisa la fecha
              </div>
              <p className="titular mt-2 text-lg leading-snug">
                {enDiaCerrado.length}{" "}
                {enDiaCerrado.length === 1 ? "encargo cae" : "encargos caen"} en día cerrado
              </p>
              <ul className="mt-3 space-y-1.5 text-sm text-fondo/80">
                {enDiaCerrado.slice(0, 4).map((cita) => (
                  <li key={cita.id} className="flex justify-between gap-3">
                    <span className="truncate">{cita.nombre}</span>
                    <span className="cifra shrink-0 text-fondo/60">
                      {new Date(`${cita.fecha_deseada!.slice(0, 10)}T12:00:00Z`).toLocaleDateString("es-ES", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        timeZone: "UTC",
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <Bloque titulo="Próximas" nota="Lo que viene a partir de hoy">
            {proximas.length === 0 ? (
              <p className="fila px-4 py-6 text-center text-sm text-tenue">
                No hay nada con fecha por delante.
              </p>
            ) : (
              <ul className="space-y-2">
                {proximas.map((cita) => {
                  const fecha = new Date(`${cita.fecha_deseada!.slice(0, 10)}T12:00:00Z`);
                  return (
                    <li key={cita.id}>
                      <Link href={enlaceDe(cita)} className="fila flex items-center gap-3 px-3 py-2.5">
                        <span className="flex w-11 shrink-0 flex-col items-center rounded-xl bg-superficie py-1">
                          <span className="etiqueta !text-[0.6rem] text-tenue">
                            {fecha
                              .toLocaleDateString("es-ES", { month: "short", timeZone: "UTC" })
                              .replace(".", "")}
                          </span>
                          <span className="titular cifra text-lg leading-none">
                            {fecha.getUTCDate()}
                          </span>
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold">{cita.nombre}</span>
                          <span className="block truncate text-xs text-tenue">{descripcion(cita)}</span>
                        </span>
                        {sinConsentimiento(cita) && (
                          <span
                            title="Sin consentimiento vigente"
                            className="shrink-0 rounded-full bg-acento/10 px-2 py-0.5 text-[0.7rem] font-medium text-acento"
                          >
                            Sin firma
                          </span>
                        )}
                        <span
                          aria-hidden
                          title={cita.estado}
                          className="h-2.5 w-2.5 shrink-0 rounded-full border-2"
                          style={{ borderColor: colorDe(cita.estado) }}
                        />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Bloque>

          <Bloque
            titulo="Sin fecha"
            nota={
              sinFecha.length
                ? `${sinFecha.length} ${sinFecha.length === 1 ? "encargo abierto" : "encargos abiertos"} sin día cerrado`
                : "Todo lo abierto tiene día"
            }
            accion={sinFecha.length ? { href: "/oportunidades", texto: "Tablero" } : undefined}
          >
            {sinFecha.length === 0 ? (
              <p className="fila px-4 py-6 text-center text-sm text-tenue">Nada pendiente de fecha.</p>
            ) : (
              <ul className="space-y-2">
                {sinFecha.slice(0, 5).map((cita) => (
                  <li key={cita.id}>
                    <Link href={enlaceDe(cita)} className="fila flex items-center gap-3 px-4 py-2.5">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{cita.nombre}</span>
                        <span className="block truncate text-xs text-tenue">{descripcion(cita)}</span>
                      </span>
                      <span className="insignia">
                        {estadosCita.find((estado) => estado.id === cita.estado)?.nombre}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Bloque>
        </div>
      </div>
    </>
  );
}
