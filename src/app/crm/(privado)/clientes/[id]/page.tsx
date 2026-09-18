import Link from "next/link";
import { notFound } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";
import { estadosCita, tiposActividad } from "@/config/estudio";
import type { Actividad, Cita, Cliente } from "@/lib/tipos";
import { FormularioActividad } from "@/components/crm/FormularioActividad";

export default async function FichaCliente({
  params,
}: PageProps<"/crm/clientes/[id]">) {
  const { id } = await params;
  const supabase = await crearClienteServidor();

  const [{ data: cliente }, { data: citas }, { data: actividades }] =
    await Promise.all([
      supabase.from("clientes").select("*").eq("id", id).maybeSingle(),
      supabase
        .from("citas")
        .select("*")
        .eq("cliente_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("actividades")
        .select("*")
        .eq("cliente_id", id)
        .order("fecha", { ascending: false }),
    ]);

  if (!cliente) notFound();

  const ficha = cliente as Cliente;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <Link
        href="/crm"
        className="enlace-sutil text-sm text-tenue transition-colors hover:text-texto"
      >
        ← Volver al tablero
      </Link>

      <header className="mt-6 border-b border-borde pb-8">
        <h1 className="titular text-4xl">{ficha.nombre}</h1>
        <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm text-tenue">
          <a
            href={`mailto:${ficha.email}`}
            className="enlace-sutil transition-colors hover:text-texto"
          >
            {ficha.email}
          </a>
          {ficha.telefono && (
            <a
              href={`tel:${ficha.telefono.replace(/\s/g, "")}`}
              className="enlace-sutil transition-colors hover:text-texto"
            >
              {ficha.telefono}
            </a>
          )}
          <span>
            Cliente desde{" "}
            {new Date(ficha.created_at).toLocaleDateString("es-ES", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>
        {ficha.notas && (
          <p className="mt-4 text-sm leading-relaxed text-tenue">{ficha.notas}</p>
        )}
      </header>

      <Citas citas={(citas ?? []) as Cita[]} />

      <section className="mt-12">
        <h2 className="titular text-2xl">Historial</h2>

        <div className="mt-6 rounded-xl border border-borde bg-superficie p-6">
          <FormularioActividad clienteId={ficha.id} />
        </div>

        <Historial actividades={(actividades ?? []) as Actividad[]} />
      </section>
    </div>
  );
}

function Citas({ citas }: { citas: Cita[] }) {
  return (
    <section className="mt-12">
      <h2 className="titular text-2xl">Citas</h2>

      {citas.length === 0 ? (
        <p className="mt-4 text-sm text-tenue">Sin citas registradas.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {citas.map((cita) => {
            const estado = estadosCita.find(
              (opcion) => opcion.id === cita.estado,
            );

            return (
              <li
                key={cita.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-borde bg-superficie px-5 py-4"
              >
                <div>
                  <p className="text-sm">
                    {cita.estilo_interes ?? "Sin estilo indicado"}
                    {cita.zona_cuerpo && (
                      <span className="text-tenue"> · {cita.zona_cuerpo}</span>
                    )}
                  </p>
                  <p className="mt-1 text-xs text-tenue">
                    Solicitada el{" "}
                    {new Date(cita.created_at).toLocaleDateString("es-ES")}
                    {cita.fecha_deseada &&
                      ` · fecha deseada ${new Date(
                        cita.fecha_deseada,
                      ).toLocaleDateString("es-ES")}`}
                  </p>
                  {cita.mensaje && (
                    <p className="mt-2 max-w-xl text-sm leading-relaxed text-tenue">
                      {cita.mensaje}
                    </p>
                  )}
                </div>

                <span
                  className="shrink-0 rounded-full px-3 py-1 text-xs"
                  style={{
                    color: estado?.color,
                    border: `1px solid ${estado?.color}55`,
                  }}
                >
                  {estado?.nombre}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function Historial({ actividades }: { actividades: Actividad[] }) {
  if (actividades.length === 0) {
    return (
      <p className="mt-8 text-sm text-tenue">
        Todavía no hay nada en el historial de este cliente.
      </p>
    );
  }

  return (
    <ol className="mt-8 border-l border-borde">
      {actividades.map((actividad) => (
        <li key={actividad.id} className="relative pb-8 pl-8">
          <span className="absolute left-0 top-1.5 h-2 w-2 -translate-x-1/2 rounded-full bg-acento" />

          <div className="flex flex-wrap items-baseline gap-x-3">
            <p className="font-medium">{actividad.titulo}</p>
            <span className="text-xs uppercase tracking-widest text-tenue">
              {tiposActividad.find((tipo) => tipo.id === actividad.tipo)?.nombre}
            </span>
          </div>

          <p className="mt-1 text-xs text-tenue">
            {new Date(actividad.fecha).toLocaleDateString("es-ES", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>

          {actividad.descripcion && (
            <p className="mt-2 text-sm leading-relaxed text-tenue">
              {actividad.descripcion}
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}
