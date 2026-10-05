import type { Metadata } from "next";
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
import { Avatar } from "@/components/Avatar";
import { Bloque } from "@/components/Bloque";
import { BotonFichar } from "@/components/BotonFichar";
import { Checklist } from "@/components/Checklist";
import { Encabezado } from "@/components/Encabezado";
import { Estrellas } from "@/components/Estrellas";
import { FirmaNomina } from "@/components/FirmaNomina";
import { FormularioVacaciones } from "@/components/FormularioVacaciones";
import { Icono } from "@/components/Icono";
import { PastillaColor } from "@/components/PastillaColor";
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

export const metadata: Metadata = { title: "Mi portal" };

/**
 * Lo que un empleado hace en el CRM: fichar, ver su incorporación, pedir
 * vacaciones, consultar sus evaluaciones y firmar sus nóminas. Las políticas
 * RLS solo le devuelven sus propias filas.
 */
export default async function Portal() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: empleadoData } = await supabase.from("empleados").select("*").eq("perfil_id", user!.id).maybeSingle();

  if (!empleadoData || empleadoData.estado === "baja") {
    return (
      <p className="tarjeta p-8 text-center text-sm text-tenue">
        Tu cuenta no está vinculada a ninguna ficha activa del equipo. Habla con el estudio.
      </p>
    );
  }

  const empleado = empleadoData as Empleado;
  const [{ data: tareasData }, { data: fichajesData }, { data: vacacionesData }, { data: evaluacionesData }, { data: nominasData }] =
    await Promise.all([
      supabase.from("tareas_incorporacion").select("*").eq("empleado_id", empleado.id).order("orden"),
      supabase.from("fichajes").select("*").eq("empleado_id", empleado.id).order("entrada", { ascending: false }).limit(20),
      supabase.from("vacaciones").select("*").eq("empleado_id", empleado.id).order("desde", { ascending: false }),
      supabase.from("evaluaciones").select("*").eq("empleado_id", empleado.id).order("trimestre", { ascending: false }),
      supabase.from("nominas").select("*").eq("empleado_id", empleado.id).order("periodo", { ascending: false }),
    ]);

  const tareas = (tareasData ?? []) as TareaIncorporacion[];
  const fichajes = (fichajesData ?? []) as Fichaje[];
  const vacaciones = (vacacionesData ?? []) as SolicitudVacaciones[];
  const evaluaciones = (evaluacionesData ?? []) as Evaluacion[];
  const nominas = (nominasData ?? []) as Nomina[];

  const hoy = hoyMadrid();
  const abierto = fichajes.find((f) => !f.salida);
  const deHoy = fichajes.filter((f) => diaDe(f.entrada) === hoy);
  const minutosHoy = deHoy.reduce((t, f) => t + minutos(f), 0);
  const semana = fichajes.filter((f) => diaDe(f.entrada) >= lunesDe(hoy)).reduce((t, f) => t + minutos(f), 0);
  const saldo = saldoVacaciones(vacaciones);
  const porFirmar = nominas.filter((n) => !n.firmada_at).length;
  const estado = estadosEmpleado.find((e) => e.id === empleado.estado)!;

  return (
    <>
      <Encabezado
        miga={`${empleado.puesto}${empleado.departamento ? ` · ${empleado.departamento}` : ""}`}
        titulo={`Hola, ${empleado.nombre.split(" ")[0]}`}
        nota={porFirmar > 0 ? `Tienes ${porFirmar} ${porFirmar === 1 ? "nómina" : "nóminas"} por firmar.` : undefined}
      >
        <PastillaColor nombre={estado.nombre} color={estado.color} />
      </Encabezado>

      <section className="tarjeta mb-3 flex flex-wrap items-center gap-5 p-5">
        <Avatar nombre={empleado.nombre} foto={empleado.foto_url} className="h-16 w-16 text-base" />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-tenue">
            {abierto ? `Has entrado a las ${hora(abierto.entrada)}` : "Ahora mismo estás fuera"}
          </p>
          <p className="cifra mt-0.5 text-2xl font-semibold tracking-tight">{duracion(minutosHoy)} hoy</p>
          <p className="cifra text-xs text-tenue">{duracion(semana)} esta semana</p>
        </div>
        <BotonFichar dentro={Boolean(abierto)} />
      </section>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {empleado.estado === "incorporacion" && (
          <Bloque titulo="Tu incorporación" nota="El estudio va marcando lo suyo; lo tuyo lo marcas tú">
            <Checklist tareas={tareas} modo="empleado" />
          </Bloque>
        )}

        <Bloque titulo="Nóminas" nota="Ábrelas y fírmalas para confirmar que las has recibido">
          {nominas.length === 0 ? (
            <p className="fila px-4 py-6 text-center text-sm text-tenue">Todavía no tienes nóminas.</p>
          ) : (
            <ul className="space-y-2">
              {nominas.map((nomina) => (
                <li key={nomina.id} className="fila flex flex-wrap items-center gap-3 px-4 py-3">
                  <Icono nombre="documento" className="h-5 w-5 text-tenue" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{nombrePeriodo(nomina.periodo)}</span>
                    <span className="block text-xs text-tenue">
                      {nomina.firmada_at ? `Firmada el ${fechaCorta(nomina.firmada_at)}` : "Pendiente de tu firma"}
                    </span>
                  </span>
                  <a href={`/nominas/${nomina.id}`} target="_blank" rel="noopener" className="boton-fantasma">
                    Ver PDF
                  </a>
                  {nomina.firmada_at ? (
                    <PastillaColor {...estadosNomina.firmada} />
                  ) : (
                    <FirmaNomina nominaId={nomina.id} periodo={nombrePeriodo(nomina.periodo)} />
                  )}
                </li>
              ))}
            </ul>
          )}
        </Bloque>

        <Bloque titulo="Vacaciones" nota={`${saldo.usados} de ${saldo.total} días usados · te quedan ${saldo.quedan}`}>
          <FormularioVacaciones disponibles={saldo.quedan - saldo.pendientes} />
          {vacaciones.length > 0 && (
            <ul className="mt-3 space-y-2">
              {vacaciones.map((solicitud) => {
                const definicion = estadosVacaciones.find((e) => e.id === solicitud.estado)!;
                return (
                  <li key={solicitud.id} className="fila grid gap-1 px-4 py-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-medium">
                        {fechaCorta(solicitud.desde)} – {fechaCorta(solicitud.hasta)}
                        <span className="ml-2 text-xs font-normal text-tenue">
                          {diasLaborables(solicitud.desde, solicitud.hasta)} días
                        </span>
                      </span>
                      <PastillaColor nombre={definicion.nombre} color={definicion.color} />
                    </div>
                    {solicitud.respuesta && <p className="text-xs text-tenue">Respuesta: {solicitud.respuesta}</p>}
                  </li>
                );
              })}
            </ul>
          )}
        </Bloque>

        <Bloque titulo="Tus evaluaciones" nota="Una por trimestre, del 1 al 5">
          {evaluaciones.length === 0 ? (
            <p className="fila px-4 py-6 text-center text-sm text-tenue">Aún no tienes evaluaciones.</p>
          ) : (
            <ul className="space-y-2">
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

        <Bloque titulo="Tus fichajes" nota="Últimos registros">
          {fichajes.length === 0 ? (
            <p className="fila px-4 py-6 text-center text-sm text-tenue">Todavía no has fichado.</p>
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
      </div>
    </>
  );
}
