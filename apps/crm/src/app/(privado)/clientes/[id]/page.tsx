import { notFound } from "next/navigation";
import { crearClienteServidor } from "@tinta/compartido/supabase/servidor";
import { tiposActividad } from "@tinta/compartido/estudio";
import type { Actividad, Cita, Cliente } from "@tinta/compartido/tipos";
import { Bloque } from "@/components/Bloque";
import { FormularioActividad } from "@/components/FormularioActividad";
import { Pastilla } from "@/components/Pastilla";

const fecha = (valor: string, largo = false) =>
  new Date(valor).toLocaleDateString("es-ES", {
    day: "numeric",
    month: largo ? "long" : "short",
    year: "numeric",
  });

export default async function FichaCliente({
  params,
}: PageProps<"/clientes/[id]">) {
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
  const listaCitas = (citas ?? []) as Cita[];

  const iniciales =
    ficha.nombre
      .split(" ")
      .slice(0, 2)
      .map((parte) => parte[0]?.toUpperCase() ?? "")
      .join("") || "·";

  return (
    <div className="max-w-4xl px-4 py-6 lg:px-6 lg:py-7">
      <header className="tarjeta mb-4 p-5">
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-superficie-alta text-sm text-tenue">
            {iniciales}
          </span>

          <div className="min-w-0">
            <h1 className="titular truncate text-xl">{ficha.nombre}</h1>
            <p className="mt-0.5 text-xs text-tenue">
              Cliente desde {fecha(ficha.created_at, true)}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-borde pt-4 text-sm text-tenue">
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
            {listaCitas.length} {listaCitas.length === 1 ? "cita" : "citas"}
          </span>
        </div>

        {ficha.notas && (
          <p className="mt-4 text-sm leading-relaxed text-tenue">{ficha.notas}</p>
        )}
      </header>

      <Bloque
        icono="calendario"
        titulo="Citas"
        nota={`${listaCitas.length} en total`}
      >
        {listaCitas.length === 0 ? (
          <p className="py-4 text-sm text-tenue">Sin citas registradas.</p>
        ) : (
          <ul className="space-y-2 pt-1">
            {listaCitas.map((cita) => (
              <li
                key={cita.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-borde bg-fondo px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm">
                    {cita.estilo_interes ?? "Sin estilo indicado"}
                    {cita.zona_cuerpo && (
                      <span className="text-tenue"> · {cita.zona_cuerpo}</span>
                    )}
                  </p>
                  <p className="mt-1 text-xs text-tenue">
                    Solicitada el {fecha(cita.created_at)}
                    {cita.fecha_deseada &&
                      ` · fecha deseada ${fecha(cita.fecha_deseada)}`}
                  </p>
                  {cita.mensaje && (
                    <p className="mt-2 max-w-xl text-sm leading-relaxed text-tenue">
                      {cita.mensaje}
                    </p>
                  )}
                </div>

                <Pastilla estado={cita.estado} />
              </li>
            ))}
          </ul>
        )}
      </Bloque>

      <div className="mt-4">
        <Bloque icono="nota" titulo="Historial">
          <div className="rounded-lg border border-borde bg-fondo p-4">
            <FormularioActividad clienteId={ficha.id} />
          </div>

          <Historial actividades={(actividades ?? []) as Actividad[]} />
        </Bloque>
      </div>
    </div>
  );
}

function Historial({ actividades }: { actividades: Actividad[] }) {
  if (actividades.length === 0) {
    return (
      <p className="mt-5 text-sm text-tenue">
        Todavía no hay nada en el historial de este cliente.
      </p>
    );
  }

  return (
    <ol className="mt-6 border-l border-borde">
      {actividades.map((actividad) => (
        <li key={actividad.id} className="relative pb-6 pl-6 last:pb-0">
          <span className="absolute left-0 top-1.5 h-2 w-2 -translate-x-1/2 rounded-full bg-acento" />

          <div className="flex flex-wrap items-baseline gap-x-3">
            <p className="text-sm font-medium">{actividad.titulo}</p>
            <span className="etiqueta text-tenue">
              {tiposActividad.find((tipo) => tipo.id === actividad.tipo)?.nombre}
            </span>
          </div>

          <p className="mt-1 text-xs text-tenue">
            {fecha(actividad.fecha, true)}
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
