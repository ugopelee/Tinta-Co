import { notFound } from "next/navigation";
import { crearClienteServidor } from "@tinta/compartido/supabase/servidor";
import { tiposActividad, tiposEncargo, tiposEvento } from "@tinta/compartido/estudio";
import type { Actividad, Cita, Cliente, Consentimiento } from "@tinta/compartido/tipos";
import { Bloque } from "@/components/Bloque";
import { FormularioActividad } from "@/components/FormularioActividad";
import { Pastilla } from "@/components/Pastilla";
import { Encabezado } from "@/components/Encabezado";
import { FormularioConsentimiento } from "@/components/FormularioConsentimiento";
import { Icono } from "@/components/Icono";
import { PastillaConsentimiento } from "@/components/PastillaConsentimiento";
import { caducidad, estadoConsentimiento, estaAlDia } from "@/lib/consentimientos";

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

  const [{ data: cliente }, { data: citas }, { data: actividades }, { data: firmas }] =
    await Promise.all([
      supabase.from("clientes").select("*").eq("id", id).maybeSingle(),
      supabase
        .from("citas")
        .select("*")
        .eq("cliente_id", id)
        .in("tipo", tiposEncargo)
        .order("created_at", { ascending: false }),
      supabase
        .from("actividades")
        .select("*")
        .eq("cliente_id", id)
        .order("fecha", { ascending: false }),
      supabase
        .from("consentimientos")
        .select("*")
        .eq("cliente_id", id)
        .order("fecha_firma", { ascending: false })
        .order("created_at", { ascending: false }),
    ]);

  if (!cliente) notFound();

  const ficha = cliente as Cliente;
  const listaCitas = (citas ?? []) as Cita[];
  const consentimientos = (firmas ?? []) as Consentimiento[];
  const ultimo = consentimientos[0];
  const estado = estadoConsentimiento(ultimo);
  const abiertas = listaCitas.filter((cita) => cita.estado === "confirmada" || cita.estado === "solicitada");

  const iniciales =
    ficha.nombre
      .split(" ")
      .slice(0, 2)
      .map((parte) => parte[0]?.toUpperCase() ?? "")
      .join("") || "·";

  return (
    <div className="max-w-4xl">
      <Encabezado
        miga="Clientes · ficha"
        titulo={ficha.nombre}
        nota={`Cliente desde ${fecha(ficha.created_at, true)}`}
      />

      <section className="tarjeta mb-3 p-5">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="mr-2 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-texto text-sm font-semibold text-fondo">
            {iniciales}
          </span>
          <a href={`mailto:${ficha.email}`} className="fila px-3 py-1.5 font-medium">
            {ficha.email}
          </a>
          {ficha.telefono && (
            <a
              href={`tel:${ficha.telefono.replace(/\s/g, "")}`}
              className="fila px-3 py-1.5 font-medium"
            >
              {ficha.telefono}
            </a>
          )}
          <span className="chip-lima">
            {listaCitas.length} {listaCitas.length === 1 ? "oportunidad" : "oportunidades"}
          </span>
        </div>

        {ficha.notas && (
          <p className="mt-4 text-sm leading-relaxed text-tenue">{ficha.notas}</p>
        )}
      </section>

      <div className="mb-3">
        <Bloque
          titulo="Consentimiento y salud"
          nota={
            ultimo
              ? `Última firma el ${fecha(ultimo.fecha_firma, true)} · válida hasta el ${fecha(caducidad(ultimo.fecha_firma), true)}`
              : "Este cliente todavía no tiene ficha de salud"
          }
        >
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <PastillaConsentimiento estado={estado} />
            {!estaAlDia(estado) && abiertas.length > 0 && (
              <span className="text-sm text-acento">
                Tiene {abiertas.length} {abiertas.length === 1 ? "cita abierta" : "citas abiertas"}: pídele la firma antes de tatuar.
              </span>
            )}
          </div>

          {ultimo && <ResumenSalud consentimiento={ultimo} />}

          <div className="mt-4">
            <FormularioConsentimiento
              clienteId={ficha.id}
              abierto={!ultimo}
              citas={abiertas.map((cita) => ({
                id: cita.id,
                texto: `${cita.tipo === "evento" ? "Evento" : (cita.estilo_interes ?? "Cita")}${cita.fecha_deseada ? ` · ${fecha(cita.fecha_deseada)}` : ""}`,
              }))}
            />
          </div>

          {consentimientos.length > 1 && (
            <details className="mt-4 group">
              <summary className="cursor-pointer list-none text-sm font-medium text-tenue hover:text-texto">
                Firmas anteriores ({consentimientos.length - 1})
              </summary>
              <ul className="mt-2 space-y-1.5">
                {consentimientos.slice(1).map((anterior) => (
                  <li key={anterior.id} className="fila flex items-center justify-between gap-3 px-4 py-2 text-sm">
                    <span>{fecha(anterior.fecha_firma, true)}</span>
                    <span className="text-tenue">{anterior.firmado ? "Firmado" : "Sin firmar"}</span>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </Bloque>
      </div>

      <Bloque
        icono="calendario"
        titulo="Oportunidades"
        nota={`${listaCitas.length} en total`}
      >
        {listaCitas.length === 0 ? (
          <p className="fila px-4 py-6 text-center text-sm text-tenue">Sin oportunidades registradas.</p>
        ) : (
          <ul className="space-y-2">
            {listaCitas.map((cita) => (
              <li
                key={cita.id}
                className="fila flex flex-wrap items-start justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  {cita.tipo === "evento" ? (
                    <p className="text-sm">
                      {tiposEvento.find((opcion) => opcion.id === cita.tipo_evento)
                        ?.nombre ?? "Evento"}
                      {cita.lugar && (
                        <span className="text-tenue"> · {cita.lugar}</span>
                      )}
                      {cita.asistentes && (
                        <span className="text-tenue"> · {cita.asistentes} invitados</span>
                      )}
                    </p>
                  ) : (
                    <p className="text-sm">
                      {cita.estilo_interes ?? "Sin estilo indicado"}
                      {cita.zona_cuerpo && (
                        <span className="text-tenue"> · {cita.zona_cuerpo}</span>
                      )}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-tenue">
                    {cita.tipo === "evento" ? "Evento" : "Cita"} solicitada el{" "}
                    {fecha(cita.created_at)}
                    {cita.fecha_deseada &&
                      ` · ${cita.tipo === "evento" ? "fecha del evento" : "fecha deseada"} ${fecha(cita.fecha_deseada)}`}
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

      <div className="mt-3">
        <Bloque icono="nota" titulo="Historial">
          <div className="fila p-4">
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
          <span className="absolute left-0 top-1.5 h-2.5 w-2.5 -translate-x-1/2 rounded-full border-2 border-texto bg-superficie" />

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

/**
 * Lo que el artista tiene que saber antes de empezar, a la vista y sin
 * desplegar nada. Lo que hay que vigilar va marcado; lo vacío se dice.
 */
function ResumenSalud({ consentimiento }: { consentimiento: Consentimiento }) {
  const datos = [
    { titulo: "Alergias", valor: consentimiento.alergias },
    { titulo: "Medicación", valor: consentimiento.medicacion },
    { titulo: "Condiciones", valor: consentimiento.condiciones },
  ];
  const avisos = [
    consentimiento.embarazo && "Embarazo o lactancia",
    consentimiento.menor && `Menor · firma ${consentimiento.tutor}`,
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-2">
      <dl className="grid gap-2 sm:grid-cols-3">
        {datos.map((dato) => (
          <div
            key={dato.titulo}
            className={`rounded-[0.875rem] px-3.5 py-3 ${
              dato.valor ? "bg-amarillo/15 ring-1 ring-amarillo/40" : "bg-superficie-alta"
            }`}
          >
            <dt className="flex items-center gap-1.5 text-xs text-tenue">
              {dato.valor && <Icono nombre="aviso" className="h-3.5 w-3.5 text-texto" />}
              {dato.titulo}
            </dt>
            <dd className={`mt-0.5 text-sm ${dato.valor ? "font-medium" : "text-tenue"}`}>
              {dato.valor ?? "Nada indicado"}
            </dd>
          </div>
        ))}
      </dl>

      {avisos.length > 0 && (
        <p className="flex flex-wrap gap-2">
          {avisos.map((aviso) => (
            <span key={aviso} className="rounded-full bg-amarillo/15 px-3 py-1 text-xs font-medium ring-1 ring-amarillo/40">
              {aviso}
            </span>
          ))}
        </p>
      )}

      {consentimiento.notas && <p className="text-sm text-tenue">{consentimiento.notas}</p>}
    </div>
  );
}
