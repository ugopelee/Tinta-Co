import type { Metadata } from "next";
import Link from "next/link";
import { crearClienteServidor } from "@tinta/compartido/supabase/servidor";
import { estadosEmpleado } from "@tinta/compartido/estudio";
import type { Empleado, Fichaje, Nomina, SolicitudVacaciones, TareaIncorporacion } from "@tinta/compartido/tipos";
import { Avatar } from "@/components/Avatar";
import { Encabezado } from "@/components/Encabezado";
import { FormularioAlta } from "@/components/FormularioAlta";
import { Icono } from "@/components/Icono";
import { PastillaColor } from "@/components/PastillaColor";
import { fechaCorta, hora } from "@/lib/equipo";

export const metadata: Metadata = { title: "Equipo" };

/**
 * Fichas del equipo. Arriba, en negro, lo que pide una decisión: vacaciones
 * por responder y nóminas sin firmar. Cada tarjeta dice si la persona está
 * dentro ahora y cómo va su incorporación.
 */
export default async function Equipo() {
  const supabase = await crearClienteServidor();
  const [{ data: empleadosData }, { data: tareasData }, { data: abiertosData }, { data: vacacionesData }, { data: nominasData }] =
    await Promise.all([
      supabase.from("empleados").select("*").order("estado").order("nombre"),
      supabase.from("tareas_incorporacion").select("*"),
      supabase.from("fichajes").select("*").is("salida", null),
      supabase.from("vacaciones").select("*").eq("estado", "pendiente"),
      supabase.from("nominas").select("*").is("firmada_at", null),
    ]);

  const empleados = (empleadosData ?? []) as Empleado[];
  const tareas = (tareasData ?? []) as TareaIncorporacion[];
  const dentro = new Map(((abiertosData ?? []) as Fichaje[]).map((f) => [f.empleado_id, f]));
  const pendientes = (vacacionesData ?? []) as SolicitudVacaciones[];
  const sinFirmar = (nominasData ?? []) as Nomina[];

  const activos = empleados.filter((e) => e.estado !== "baja");
  const deBaja = empleados.filter((e) => e.estado === "baja");

  return (
    <>
      <Encabezado
        miga="Equipo · recursos humanos"
        titulo="Personas"
        nota="Fichas del equipo, su incorporación, fichajes, vacaciones, evaluaciones y nóminas. Cada alta crea su cuenta del CRM."
      >
        <span className="chip-lima cifra">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-sobre-lima" />
          {dentro.size} de {activos.length} en el estudio
        </span>
      </Encabezado>

      {(pendientes.length > 0 || sinFirmar.length > 0) && (
        <section className="mb-3 grid grid-cols-1 gap-2 rounded-[1.25rem] bg-texto p-5 text-fondo sm:grid-cols-2">
          {pendientes.length > 0 && (
            <Link
              href="/equipo/ausencias"
              className="flex items-center gap-3 rounded-[0.875rem] bg-fondo/10 px-4 py-3 transition-colors duration-200 hover:bg-fondo/15"
            >
              <Icono nombre="ausencias" className="h-5 w-5" />
              <span className="flex-1 text-sm font-semibold">
                {pendientes.length} {pendientes.length === 1 ? "solicitud" : "solicitudes"} de vacaciones por responder
              </span>
              <span className="rounded-full bg-lima px-3 py-1 text-xs font-medium text-sobre-lima">Responder</span>
            </Link>
          )}
          {sinFirmar.length > 0 && (
            <div className="flex items-center gap-3 rounded-[0.875rem] bg-fondo/10 px-4 py-3">
              <Icono nombre="firma" className="h-5 w-5" />
              <span className="flex-1 text-sm font-semibold">
                {sinFirmar.length} {sinFirmar.length === 1 ? "nómina pendiente" : "nóminas pendientes"} de firma
              </span>
            </div>
          )}
        </section>
      )}

      <FormularioAlta />

      {activos.length === 0 ? (
        <p className="tarjeta p-8 text-center text-sm text-tenue">
          Todavía no hay nadie en el equipo. Pulsa «Nueva persona» para dar la primera alta.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {activos.map((empleado) => (
            <li key={empleado.id}>
              <TarjetaEmpleado
                empleado={empleado}
                tareas={tareas.filter((t) => t.empleado_id === empleado.id)}
                fichaje={dentro.get(empleado.id)}
              />
            </li>
          ))}
        </ul>
      )}

      {deBaja.length > 0 && (
        <details className="mt-6">
          <summary className="cursor-pointer list-none text-sm font-medium text-tenue hover:text-texto">
            De baja ({deBaja.length})
          </summary>
          <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {deBaja.map((empleado) => (
              <li key={empleado.id}>
                <TarjetaEmpleado empleado={empleado} tareas={[]} />
              </li>
            ))}
          </ul>
        </details>
      )}
    </>
  );
}

function TarjetaEmpleado({
  empleado,
  tareas,
  fichaje,
}: {
  empleado: Empleado;
  tareas: TareaIncorporacion[];
  fichaje?: Fichaje;
}) {
  const estado = estadosEmpleado.find((e) => e.id === empleado.estado)!;
  const hechas = tareas.filter((t) => t.hecha).length;

  return (
    <Link
      href={`/equipo/${empleado.id}`}
      className="tarjeta flex h-full gap-4 p-4 transition-shadow duration-200 hover:shadow-[0_0_0_2px_var(--borde)]"
    >
      <span className="relative">
        <Avatar nombre={empleado.nombre} foto={empleado.foto_url} className="h-16 w-16 text-base" />
        {fichaje && (
          <span
            title={`Dentro desde las ${hora(fichaje.entrada)}`}
            className="absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-superficie bg-verde"
          />
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-[0.9375rem] font-semibold">{empleado.nombre}</span>
        <span className="block truncate text-xs text-tenue">
          {empleado.puesto}
          {empleado.departamento && ` · ${empleado.departamento}`}
        </span>

        <span className="mt-2.5 flex flex-wrap items-center gap-2">
          <PastillaColor nombre={estado.nombre} color={estado.color} />
          {!empleado.perfil_id && empleado.estado !== "baja" && (
            <span className="insignia text-[0.7rem] text-acento">Sin cuenta</span>
          )}
        </span>

        {empleado.estado === "incorporacion" && tareas.length > 0 ? (
          <span className="mt-3 flex items-center gap-2">
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-superficie-alta">
              <span
                className="block h-full rounded-full bg-amarillo"
                style={{ width: `${(hechas / tareas.length) * 100}%` }}
              />
            </span>
            <span className="cifra text-[0.7rem] text-tenue">
              {hechas}/{tareas.length}
            </span>
          </span>
        ) : (
          <span className="mt-3 block text-xs text-tenue">
            {fichaje ? `Dentro desde las ${hora(fichaje.entrada)}` : `Alta el ${fechaCorta(empleado.fecha_alta)}`}
          </span>
        )}
      </span>
    </Link>
  );
}
