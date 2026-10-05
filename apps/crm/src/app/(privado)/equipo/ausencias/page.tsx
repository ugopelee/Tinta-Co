import type { Metadata } from "next";
import Link from "next/link";
import { crearClienteServidor } from "@tinta/compartido/supabase/servidor";
import { estadosVacaciones } from "@tinta/compartido/estudio";
import type { Empleado, SolicitudVacaciones } from "@tinta/compartido/tipos";
import { Avatar } from "@/components/Avatar";
import { Encabezado } from "@/components/Encabezado";
import { PastillaColor } from "@/components/PastillaColor";
import { RespuestaVacaciones } from "@/components/RespuestaVacaciones";
import { diasLaborables, fechaCorta, hoyMadrid, saldoVacaciones } from "@/lib/equipo";

export const metadata: Metadata = { title: "Vacaciones" };

const FILTROS = [
  { id: "pendiente", texto: "Por responder" },
  { id: "proximas", texto: "Próximas aprobadas" },
  { id: "todas", texto: "Todas" },
] as const;

/**
 * Solicitudes de vacaciones del equipo. Las piden los empleados desde su
 * portal; aquí se aprueban o rechazan, viendo cuántos días les quedan.
 */
export default async function Ausencias({ searchParams }: PageProps<"/equipo/ausencias">) {
  const { filtro: parametro } = await searchParams;
  const filtro = FILTROS.find((opcion) => opcion.id === parametro) ?? FILTROS[0];

  const supabase = await crearClienteServidor();
  const [{ data: solicitudesData }, { data: empleadosData }] = await Promise.all([
    supabase.from("vacaciones").select("*").order("desde", { ascending: true }),
    supabase.from("empleados").select("*"),
  ]);

  const solicitudes = (solicitudesData ?? []) as SolicitudVacaciones[];
  const empleados = new Map(((empleadosData ?? []) as Empleado[]).map((e) => [e.id, e]));
  const hoy = hoyMadrid();

  const filtrar = (id: (typeof FILTROS)[number]["id"]) =>
    id === "pendiente"
      ? solicitudes.filter((s) => s.estado === "pendiente")
      : id === "proximas"
        ? solicitudes.filter((s) => s.estado === "aprobada" && s.hasta >= hoy)
        : [...solicitudes].reverse();

  const visibles = filtrar(filtro.id);
  const fuera = solicitudes.filter((s) => s.estado === "aprobada" && s.desde <= hoy && s.hasta >= hoy);

  return (
    <div className="max-w-5xl">
      <Encabezado
        miga="Equipo · ausencias"
        titulo="Vacaciones"
        nota="Cada persona pide sus días desde su portal. Solo cuentan los laborables (de lunes a viernes)."
      >
        {fuera.length > 0 && (
          <span className="chip-lima">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-sobre-lima" />
            {fuera.length} de vacaciones hoy
          </span>
        )}
      </Encabezado>

      <nav aria-label="Filtrar solicitudes" className="segmentos mb-3 !bg-superficie">
        {FILTROS.map((opcion) => (
          <Link
            key={opcion.id}
            href={opcion.id === "pendiente" ? "/equipo/ausencias" : `/equipo/ausencias?filtro=${opcion.id}`}
            aria-current={opcion.id === filtro.id ? "page" : undefined}
            className="segmento"
          >
            {opcion.texto}
            <span className="cifra text-xs opacity-60">{filtrar(opcion.id).length}</span>
          </Link>
        ))}
      </nav>

      {visibles.length === 0 ? (
        <p className="tarjeta p-8 text-center text-sm text-tenue">
          {filtro.id === "pendiente" ? "No hay nada por responder." : "Ninguna solicitud en este filtro."}
        </p>
      ) : (
        <ul className="tarjeta space-y-2 p-3">
          {visibles.map((solicitud) => {
            const empleado = empleados.get(solicitud.empleado_id);
            const definicion = estadosVacaciones.find((e) => e.id === solicitud.estado)!;
            const saldo = saldoVacaciones(
              solicitudes.filter((s) => s.empleado_id === solicitud.empleado_id),
              Number(solicitud.desde.slice(0, 4)),
            );
            const dias = diasLaborables(solicitud.desde, solicitud.hasta);

            return (
              <li key={solicitud.id} className="fila grid gap-3 px-4 py-3">
                <div className="flex flex-wrap items-center gap-3">
                  {empleado && <Avatar nombre={empleado.nombre} foto={empleado.foto_url} className="h-10 w-10 text-xs" />}
                  <span className="min-w-0 flex-1">
                    <Link
                      href={`/equipo/${solicitud.empleado_id}`}
                      className="block truncate text-sm font-semibold underline-offset-4 hover:underline"
                    >
                      {empleado?.nombre ?? "Empleado"}
                    </Link>
                    <span className="block text-xs text-tenue">
                      {fechaCorta(solicitud.desde)} – {fechaCorta(solicitud.hasta)} · {dias}{" "}
                      {dias === 1 ? "día" : "días"} · le quedan {saldo.quedan} de {saldo.total}
                    </span>
                  </span>
                  <PastillaColor nombre={definicion.nombre} color={definicion.color} />
                </div>

                {solicitud.motivo && <p className="text-sm text-tenue">«{solicitud.motivo}»</p>}
                {solicitud.estado === "pendiente" ? (
                  <RespuestaVacaciones id={solicitud.id} />
                ) : (
                  solicitud.respuesta && <p className="text-xs text-tenue">Respuesta: {solicitud.respuesta}</p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
