import type { Metadata } from "next";
import Link from "next/link";
import { crearClienteServidor } from "@tinta/compartido/supabase/servidor";
import type { Cita, Cliente, Consentimiento } from "@tinta/compartido/tipos";
import { Encabezado } from "@/components/Encabezado";
import { Icono } from "@/components/Icono";
import { PastillaConsentimiento } from "@/components/PastillaConsentimiento";
import {
  VIGENCIA_MESES,
  caducidad,
  estaAlDia,
  estadoConsentimiento,
  ultimosPorCliente,
  type EstadoConsentimiento,
} from "@/lib/consentimientos";

export const metadata: Metadata = { title: "Consentimientos" };

const FILTROS: { id: string; texto: string; estados: EstadoConsentimiento[] | null }[] = [
  { id: "todos", texto: "Todos", estados: null },
  { id: "pendientes", texto: "Por firmar", estados: ["sin-ficha", "sin-firmar", "caducado"] },
  { id: "caducan", texto: "Caducan pronto", estados: ["caduca"] },
  { id: "vigentes", texto: "Vigentes", estados: ["vigente"] },
];

const fechaCorta = (valor: string) =>
  new Date(`${valor.slice(0, 10)}T12:00:00Z`).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

/** Primero lo que impide tatuar, luego lo que caduca, al final lo que está bien. */
const ORDEN: Record<EstadoConsentimiento, number> = {
  "sin-ficha": 0,
  "sin-firmar": 1,
  caducado: 2,
  caduca: 3,
  vigente: 4,
};

/**
 * Consentimiento informado y ficha de salud de todos los clientes. Lo urgente
 * va arriba en negro: citas confirmadas cuya persona no tiene firma vigente.
 */
export default async function Consentimientos({ searchParams }: PageProps<"/consentimientos">) {
  const { filtro: parametro } = await searchParams;
  const filtro = FILTROS.find((opcion) => opcion.id === parametro) ?? FILTROS[0];

  const supabase = await crearClienteServidor();
  const [{ data: clientesData }, { data: firmasData }, { data: citasData }] = await Promise.all([
    supabase.from("clientes").select("*").order("nombre"),
    supabase.from("consentimientos").select("*"),
    supabase
      .from("citas")
      .select("*")
      .eq("estado", "confirmada")
      .not("cliente_id", "is", null)
      .order("fecha_deseada", { ascending: true, nullsFirst: false }),
  ]);

  const clientes = (clientesData ?? []) as Cliente[];
  const ultimos = ultimosPorCliente((firmasData ?? []) as Consentimiento[]);

  const filas = clientes
    .map((cliente) => {
      const ultimo = ultimos.get(cliente.id);
      return { cliente, ultimo, estado: estadoConsentimiento(ultimo) };
    })
    .sort((a, b) => ORDEN[a.estado] - ORDEN[b.estado] || a.cliente.nombre.localeCompare(b.cliente.nombre));

  const visibles = filtro.estados ? filas.filter((fila) => filtro.estados!.includes(fila.estado)) : filas;
  const cuenta = (estados: EstadoConsentimiento[] | null) =>
    estados ? filas.filter((fila) => estados.includes(fila.estado)).length : filas.length;

  const sinFirma = ((citasData ?? []) as Cita[]).filter(
    (cita) => !estaAlDia(estadoConsentimiento(ultimos.get(cita.cliente_id!))),
  );

  return (
    <>
      <Encabezado
        miga="Clientes · salud"
        titulo="Consentimientos"
        nota={`Consentimiento informado y ficha de salud. Se renuevan cada ${VIGENCIA_MESES} meses: la salud cambia y una firma vieja no protege a nadie.`}
      >
        <span className="chip-lima cifra">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-sobre-lima" />
          {cuenta(["vigente", "caduca"])} de {filas.length} al día
        </span>
      </Encabezado>

      {sinFirma.length > 0 && (
        <section className="mb-3 rounded-[1.25rem] bg-texto p-5 text-fondo">
          <div className="flex items-center gap-2 text-[0.8125rem] text-fondo/60">
            <Icono nombre="aviso" className="h-4 w-4" />
            Antes de tatuar
          </div>
          <h2 className="titular mt-2 text-lg leading-snug">
            {sinFirma.length} {sinFirma.length === 1 ? "cita confirmada no tiene" : "citas confirmadas no tienen"} consentimiento vigente
          </h2>
          <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {sinFirma.map((cita) => (
              <li key={cita.id}>
                <Link
                  href={`/clientes/${cita.cliente_id}`}
                  className="flex items-center gap-3 rounded-[0.875rem] bg-fondo/10 px-4 py-3 transition-colors duration-200 hover:bg-fondo/15"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{cita.nombre}</span>
                    <span className="block truncate text-xs text-fondo/60">
                      {cita.fecha_deseada ? fechaCorta(cita.fecha_deseada) : "Sin fecha"} ·{" "}
                      {cita.estilo_interes ?? (cita.tipo === "evento" ? "Evento" : "Cita")}
                    </span>
                  </span>
                  <span className="rounded-full bg-lima px-3 py-1 text-xs font-medium text-sobre-lima">
                    Registrar firma
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <nav aria-label="Filtrar clientes" className="segmentos mb-3 !bg-superficie">
        {FILTROS.map((opcion) => (
          <Link
            key={opcion.id}
            href={opcion.id === "todos" ? "/consentimientos" : `/consentimientos?filtro=${opcion.id}`}
            aria-current={opcion.id === filtro.id ? "page" : undefined}
            className="segmento"
          >
            {opcion.texto}
            <span className="cifra text-xs opacity-60">{cuenta(opcion.estados)}</span>
          </Link>
        ))}
      </nav>

      {visibles.length === 0 ? (
        <p className="tarjeta p-8 text-center text-sm text-tenue">Ningún cliente en este filtro.</p>
      ) : (
        <ul className="tarjeta space-y-2 p-3">
          {visibles.map(({ cliente, ultimo, estado }) => {
            const hayAvisos = Boolean(ultimo && (ultimo.alergias || ultimo.medicacion || ultimo.condiciones || ultimo.embarazo));

            return (
              <li key={cliente.id}>
                <Link href={`/clientes/${cliente.id}`} className="fila flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{cliente.nombre}</span>
                    <span className="block truncate text-xs text-tenue">
                      {ultimo
                        ? `Firmó el ${fechaCorta(ultimo.fecha_firma)} · vence el ${fechaCorta(caducidad(ultimo.fecha_firma))}`
                        : "Sin ficha de salud"}
                    </span>
                  </span>

                  {/* Solo se dice que hay algo a vigilar; el detalle, en la ficha. */}
                  {hayAvisos && (
                    <span className="flex items-center gap-1.5 rounded-full bg-amarillo/15 px-2.5 py-1 text-xs font-medium ring-1 ring-amarillo/40">
                      <Icono nombre="aviso" className="h-3.5 w-3.5" />
                      Ver salud
                    </span>
                  )}
                  <PastillaConsentimiento estado={estado} />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
