import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { crearClienteServidor } from "@tinta/compartido/supabase/servidor";
import { estadosEmpleado, estadosNomina, estadosVacaciones } from "@tinta/compartido/estudio";
import type {
  Empleado,
  Evaluacion,
  Fichaje,
  Nomina,
  SolicitudVacaciones,
  TareaIncorporacion,
} from "@tinta/compartido/tipos";
import { AccionesCuenta } from "@/components/AccionesCuenta";
import { Bloque } from "@/components/Bloque";
import { BotonBaja } from "@/components/BotonBaja";
import { CambiarFoto } from "@/components/CambiarFoto";
import { Checklist } from "@/components/Checklist";
import { Encabezado } from "@/components/Encabezado";
import { Estrellas } from "@/components/Estrellas";
import { FormularioEvaluacion } from "@/components/FormularioEvaluacion";
import { FormularioNomina } from "@/components/FormularioNomina";
import { Icono } from "@/components/Icono";
import { PastillaColor } from "@/components/PastillaColor";
import { RespuestaVacaciones } from "@/components/RespuestaVacaciones";
import {
  diaDe,
  diasLaborables,
  duracion,
  fechaCorta,
  hora,
  hoyMadrid,
  lunesDe,
  minutos,
  nombrePeriodo,
  saldoVacaciones,
} from "@/lib/equipo";
import { anterior, trimestreDe } from "@/lib/trimestres";

export const metadata: Metadata = { title: "Ficha del empleado" };

export default async function FichaEmpleado({ params }: PageProps<"/equipo/[id]">) {
  const { id } = await params;
  const supabase = await crearClienteServidor();

  const [
    { data: empleadoData },
    { data: tareasData },
    { data: fichajesData },
    { data: vacacionesData },
    { data: evaluacionesData },
    { data: nominasData },
  ] = await Promise.all([
    supabase.from("empleados").select("*").eq("id", id).maybeSingle(),
    supabase.from("tareas_incorporacion").select("*").eq("empleado_id", id).order("orden"),
    supabase.from("fichajes").select("*").eq("empleado_id", id).order("entrada", { ascending: false }).limit(40),
    supabase.from("vacaciones").select("*").eq("empleado_id", id).order("desde", { ascending: false }),
    supabase.from("evaluaciones").select("*").eq("empleado_id", id).order("trimestre", { ascending: false }),
    supabase.from("nominas").select("*").eq("empleado_id", id).order("periodo", { ascending: false }),
  ]);

  if (!empleadoData) notFound();

  const empleado = empleadoData as Empleado;
  const tareas = (tareasData ?? []) as TareaIncorporacion[];
  const fichajes = (fichajesData ?? []) as Fichaje[];
  const vacaciones = (vacacionesData ?? []) as SolicitudVacaciones[];
  const evaluaciones = (evaluacionesData ?? []) as Evaluacion[];
  const nominas = (nominasData ?? []) as Nomina[];

  const estado = estadosEmpleado.find((e) => e.id === empleado.estado)!;
  const hoy = hoyMadrid();
  const lunes = lunesDe(hoy);
  const semana = fichajes.filter((f) => diaDe(f.entrada) >= lunes).reduce((total, f) => total + minutos(f), 0);
  const abierto = fichajes.find((f) => !f.salida);
  const saldo = saldoVacaciones(vacaciones);

  // El actual y los tres anteriores: se evalúa al cerrar cada trimestre.
  const actual = trimestreDe(undefined);
  const trimestres = [actual, anterior(actual), anterior(anterior(actual)), anterior(anterior(anterior(actual)))];
  const media = evaluaciones.length
    ? evaluaciones.reduce((total, e) => total + e.nota, 0) / evaluaciones.length
    : null;

  const mesPasado = new Date(`${hoy.slice(0, 7)}-01T12:00:00Z`);
  mesPasado.setUTCMonth(mesPasado.getUTCMonth() - 1);

  return (
    <div className="max-w-5xl">
      <Encabezado
        miga="Equipo · ficha"
        titulo={empleado.nombre}
        nota={`${empleado.puesto}${empleado.departamento ? ` · ${empleado.departamento}` : ""} · alta el ${fechaCorta(empleado.fecha_alta)}`}
      >
        <BotonBaja empleadoId={empleado.id} deBaja={empleado.estado === "baja"} />
      </Encabezado>

      <section className="tarjeta mb-3 flex flex-wrap items-start gap-5 p-5">
        <CambiarFoto empleadoId={empleado.id} nombre={empleado.nombre} foto={empleado.foto_url} />

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <PastillaColor nombre={estado.nombre} color={estado.color} />
            <a href={`mailto:${empleado.email}`} className="fila px-3 py-1.5 font-medium">
              {empleado.email}
            </a>
            {empleado.telefono && (
              <a href={`tel:${empleado.telefono.replace(/\s/g, "")}`} className="fila px-3 py-1.5 font-medium">
                {empleado.telefono}
              </a>
            )}
            {abierto && (
              <span className="chip-lima">
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-sobre-lima" />
                Dentro desde las {hora(abierto.entrada)}
              </span>
            )}
          </div>

          <div className="fila flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div className="text-sm">
              <p className="font-medium">Cuenta del CRM</p>
              <p className="text-xs text-tenue">
                {empleado.perfil_id
                  ? `Usuario: ${empleado.email} · entra en su portal para fichar, pedir vacaciones y firmar nóminas`
                  : "Todavía no tiene cuenta: créala para que pueda entrar a su portal."}
              </p>
            </div>
            <AccionesCuenta empleadoId={empleado.id} tieneCuenta={Boolean(empleado.perfil_id)} />
          </div>
        </div>
      </section>

      <div className="grid gap-3 lg:grid-cols-2">
        <Bloque
          titulo="Incorporación"
          nota={
            empleado.estado === "incorporacion"
              ? "Cuando todas estén hechas, pasará a Activo automáticamente"
              : "Checklist completada: ya está dentro del equipo"
          }
        >
          <Checklist tareas={tareas} modo="propietario" />
        </Bloque>

        <Bloque
          titulo="Fichajes"
          nota={`${duracion(semana)} esta semana · últimos registros`}
          accion={{ href: "/equipo/fichajes", texto: "Todos" }}
        >
          {fichajes.length === 0 ? (
            <p className="fila px-4 py-6 text-center text-sm text-tenue">Todavía no ha fichado.</p>
          ) : (
            <ul className="space-y-1.5">
              {fichajes.slice(0, 8).map((fichaje) => (
                <li key={fichaje.id} className="fila flex items-center justify-between gap-3 px-4 py-2 text-sm">
                  <span>{fechaCorta(diaDe(fichaje.entrada))}</span>
                  <span className="cifra text-tenue">
                    {hora(fichaje.entrada)} → {fichaje.salida ? hora(fichaje.salida) : "dentro"}
                  </span>
                  <span className="cifra w-24 text-right font-medium">{duracion(minutos(fichaje))}</span>
                </li>
              ))}
            </ul>
          )}
        </Bloque>

        <Bloque
          titulo="Vacaciones"
          nota={`${saldo.usados} de ${saldo.total} días usados este año · quedan ${saldo.quedan}${saldo.pendientes ? ` · ${saldo.pendientes} pendientes` : ""}`}
        >
          {vacaciones.length === 0 ? (
            <p className="fila px-4 py-6 text-center text-sm text-tenue">Sin solicitudes.</p>
          ) : (
            <ul className="space-y-2">
              {vacaciones.map((solicitud) => {
                const definicion = estadosVacaciones.find((e) => e.id === solicitud.estado)!;
                return (
                  <li key={solicitud.id} className="fila grid gap-2 px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-medium">
                        {fechaCorta(solicitud.desde)} – {fechaCorta(solicitud.hasta)}
                        <span className="ml-2 text-xs font-normal text-tenue">
                          {diasLaborables(solicitud.desde, solicitud.hasta)} días
                        </span>
                      </span>
                      <PastillaColor nombre={definicion.nombre} color={definicion.color} />
                    </div>
                    {solicitud.motivo && <p className="text-xs text-tenue">{solicitud.motivo}</p>}
                    {solicitud.estado === "pendiente" && <RespuestaVacaciones id={solicitud.id} />}
                    {solicitud.respuesta && <p className="text-xs text-tenue">Respuesta: {solicitud.respuesta}</p>}
                  </li>
                );
              })}
            </ul>
          )}
        </Bloque>

        <Bloque
          titulo="Evaluación trimestral"
          nota={media ? `Media ${media.toFixed(1)} sobre 5 en ${evaluaciones.length} trimestres` : "Del 1 al 5, una por trimestre"}
        >
          <FormularioEvaluacion
            empleadoId={empleado.id}
            trimestres={trimestres.map((t) => ({ clave: t.clave, nombre: t.nombre }))}
            evaluaciones={evaluaciones}
          />
          {evaluaciones.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {evaluaciones.map((evaluacion) => (
                <li key={evaluacion.id} className="fila grid gap-1 px-4 py-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-medium">{evaluacion.trimestre.replace("-T", " · T")}</span>
                    <Estrellas nota={evaluacion.nota} />
                  </div>
                  {evaluacion.comentario && <p className="text-xs text-tenue">{evaluacion.comentario}</p>}
                </li>
              ))}
            </ul>
          )}
        </Bloque>
      </div>

      <div className="mt-3">
        <Bloque titulo="Nóminas" nota="PDF mensual que el empleado firma desde su portal">
          <FormularioNomina empleadoId={empleado.id} mesSugerido={mesPasado.toISOString().slice(0, 7)} />

          {nominas.length > 0 && (
            <ul className="mt-3 space-y-2">
              {nominas.map((nomina) => (
                <li key={nomina.id} className="fila flex flex-wrap items-center gap-3 px-4 py-3">
                  <Icono nombre="documento" className="h-5 w-5 text-tenue" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{nombrePeriodo(nomina.periodo)}</span>
                    <span className="block text-xs text-tenue">
                      {nomina.firmada_at
                        ? `Firmada el ${fechaCorta(nomina.firmada_at)} a las ${hora(nomina.firmada_at)}`
                        : `Subida el ${fechaCorta(nomina.created_at)} · pendiente de firma`}
                    </span>
                  </span>
                  {nomina.firma && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={nomina.firma}
                      alt={`Firma de ${empleado.nombre}`}
                      className="h-10 rounded-lg bg-white px-2"
                    />
                  )}
                  <PastillaColor {...estadosNomina[nomina.firmada_at ? "firmada" : "pendiente"]} />
                  <a href={`/nominas/${nomina.id}`} target="_blank" rel="noopener" className="boton-fantasma">
                    Ver PDF
                  </a>
                </li>
              ))}
            </ul>
          )}
        </Bloque>
      </div>
    </div>
  );
}
