import Link from "next/link";
import { crearClienteServidor } from "@tinta/compartido/supabase/servidor";
import { estadosCita, tiposActividad, tiposEncargo } from "@tinta/compartido/estudio";
import type { Actividad, Cita, Consentimiento } from "@tinta/compartido/tipos";
import { estaAlDia, estadoConsentimiento, ultimosPorCliente } from "@/lib/consentimientos";
import { Bloque } from "@/components/Bloque";
import { Cartera, type ResumenCita } from "@/components/Cartera";
import { GraficoCitas, type PuntoMes } from "@/components/GraficoCitas";
import { Medidor } from "@/components/Medidor";
import { PanelAtencion, type Aviso } from "@/components/PanelAtencion";
import { Encabezado } from "@/components/Encabezado";
import { TarjetaProximaCita } from "@/components/TarjetaProximaCita";
import { Icono } from "@/components/Icono";

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

const DIA = 24 * 60 * 60 * 1000;

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

/** «Jueves 1 de octubre», en hora de Madrid aunque el servidor esté en otra zona. */
function tituloDeHoy() {
  const texto = new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Europe/Madrid",
  });
  // es-ES escribe «jueves, 1 de octubre»: la coma sobra en un titular.
  return (texto.charAt(0).toUpperCase() + texto.slice(1)).replace(",", "");
}

const diasDesde = (valor: string) =>
  Math.max(0, Math.floor((Date.now() - new Date(valor).getTime()) / DIA));

/** Lo que de verdad está esperando una decisión, ordenado por gravedad. */
function avisosDe(citas: Cita[], firmas: Map<string, Consentimiento>): Aviso[] {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const avisos: Aviso[] = [];

  const paradas = citas.filter(
    (cita) => cita.estado === "solicitada" && diasDesde(cita.created_at) >= 3,
  );
  if (paradas.length) {
    avisos.push({
      nivel: "alta",
      texto: `${paradas.length} ${paradas.length === 1 ? "solicitud lleva" : "solicitudes llevan"} más de 3 días sin respuesta`,
    });
  }

  const pasadas = citas.filter(
    (cita) =>
      cita.estado === "confirmada" &&
      cita.fecha_deseada &&
      new Date(cita.fecha_deseada) < hoy,
  );
  if (pasadas.length) {
    avisos.push({
      nivel: "alta",
      texto: `${pasadas.length} ${pasadas.length === 1 ? "oportunidad ya pasó" : "oportunidades ya pasaron"} y siguen como confirmadas`,
    });
  }

  const sinCobrar = citas.filter(
    (cita) => cita.estado === "realizada" && !cita.pagado,
  );
  if (sinCobrar.length) {
    avisos.push({
      nivel: "media",
      texto: `${sinCobrar.length} ${sinCobrar.length === 1 ? "oportunidad realizada" : "oportunidades realizadas"} sin marcar el cobro`,
    });
  }

  const sinFecha = citas.filter(
    (cita) => cita.estado === "confirmada" && !cita.fecha_deseada,
  );
  if (sinFecha.length) {
    avisos.push({
      nivel: "media",
      texto: `${sinFecha.length} ${sinFecha.length === 1 ? "oportunidad confirmada" : "oportunidades confirmadas"} sin fecha cerrada`,
    });
  }

  // Tatuar sin consentimiento vigente no es un descuido de agenda: va primero.
  const sinConsentimiento = citas.filter(
    (cita) =>
      cita.estado === "confirmada" &&
      cita.cliente_id &&
      !estaAlDia(estadoConsentimiento(firmas.get(cita.cliente_id))),
  );
  if (sinConsentimiento.length) {
    avisos.unshift({
      nivel: "alta",
      texto: `${sinConsentimiento.length} ${sinConsentimiento.length === 1 ? "cita confirmada no tiene" : "citas confirmadas no tienen"} consentimiento vigente`,
    });
  }

  return avisos;
}

export default async function Panel() {
  const supabase = await crearClienteServidor();

  const [{ data: datosCitas }, { data: datosActividades }, { data: datosFirmas }] = await Promise.all([
    // Las propuestas de negocio no tienen fecha ni cobro: el panel es de encargos.
    supabase
      .from("citas")
      .select("*")
      .in("tipo", tiposEncargo)
      .order("created_at", { ascending: false }),
    supabase
      .from("actividades")
      .select("*")
      .order("fecha", { ascending: false })
      .limit(5),
    supabase.from("consentimientos").select("*"),
  ]);
  const firmas = ultimosPorCliente((datosFirmas ?? []) as Consentimiento[]);

  const citas = (datosCitas ?? []) as Cita[];
  const actividades = (datosActividades ?? []) as Actividad[];

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const proxima =
    citas
      .filter(
        (cita) =>
          cita.estado === "confirmada" &&
          cita.fecha_deseada &&
          new Date(cita.fecha_deseada) >= hoy,
      )
      .sort((a, b) => (a.fecha_deseada! < b.fecha_deseada! ? -1 : 1))[0] ??
    citas.find((cita) => cita.estado === "solicitada") ??
    null;

  // Primero lo que lleva más tiempo esperando: es lo que más quema.
  const atencion = citas
    .filter((cita) => cita.estado === "solicitada")
    .sort((a, b) => (a.created_at < b.created_at ? -1 : 1))
    .slice(0, 6);

  const realizadas = citas.filter((cita) => cita.estado === "realizada");
  const cobradas = realizadas.filter((cita) => cita.pagado);
  const cobrado = realizadas.length
    ? (cobradas.length / realizadas.length) * 100
    : 0;
  const pendiente = realizadas
    .filter((cita) => !cita.pagado)
    .reduce((suma, cita) => suma + (cita.importe ?? 0), 0);

  const resumen: ResumenCita[] = citas.map((cita) => ({
    creada: cita.created_at,
    estado: cita.estado,
    importe: cita.importe,
    pagado: cita.pagado,
  }));

  return (
    <>
      <Encabezado
        miga="Resumen · hoy"
        titulo={tituloDeHoy()}
      >
        {atencion.length > 0 && (
          <span className="chip-lima">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-sobre-lima" />
            {atencion.length} sin responder
          </span>
        )}
        <Link href="/oportunidades" className="boton group">
          Abrir tablero
          <Icono
            nombre="flecha"
            className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
          />
        </Link>
      </Encabezado>

      <div className="grid items-start gap-3 xl:grid-cols-[1.15fr_1fr]">
        <div className="space-y-3">
          <TarjetaProximaCita cita={proxima} />

          <Bloque
            icono="reloj"
            titulo="Necesitan atención"
            nota={
              atencion.length
                ? `${atencion.length} ${atencion.length === 1 ? "solicitud" : "solicitudes"} sin responder`
                : "Nada pendiente de contestar"
            }
            accion={{ href: "/oportunidades", texto: "Ver tablero" }}
            ajustado
          >
            {atencion.length === 0 ? (
              <p className="fila mx-5 mb-5 px-4 py-6 text-center text-sm text-tenue">
                Todas las solicitudes están contestadas.
              </p>
            ) : (
              <ul className="space-y-2 px-5 pb-5">
                {atencion.map((cita) => {
                  const espera = diasDesde(cita.created_at);

                  return (
                    <li key={cita.id}>
                      <Link
                        href={cita.cliente_id ? `/clientes/${cita.cliente_id}` : "/oportunidades"}
                        className="fila flex items-center gap-4 px-4 py-3"
                      >
                        {/* La espera va delante, en grande: es lo que ordena la lista. */}
                        <span className="w-12 shrink-0">
                          <span className="titular cifra block text-lg leading-none">
                            {espera === 0 ? "Hoy" : `${espera} d`}
                          </span>
                          <span className="text-[0.7rem] text-tenue">
                            {espera === 0 ? "entró" : "esperando"}
                          </span>
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold">
                            {cita.nombre}
                          </span>
                          <span className="block truncate text-xs text-tenue">
                            {cita.estilo_interes ?? "Estilo por decidir"} ·{" "}
                            {cita.zona_cuerpo ?? "zona por decidir"}
                          </span>
                        </span>

                        <span className="insignia hidden sm:inline-flex">
                          {cita.tipo === "evento" ? "Evento" : "Cita"}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Bloque>

          <Bloque
            icono="grafico"
            titulo="Oportunidades por mes"
            nota="Últimos seis meses, desglosadas por estado"
            accion={{ href: "/oportunidades", texto: "Ver tablero" }}
          >
            <GraficoCitas datos={porMes(citas)} />
          </Bloque>
        </div>

        <div className="space-y-3">
          <Cartera citas={resumen} />

          <PanelAtencion avisos={avisosDe(citas, firmas)} />

          <Medidor
            porcentaje={cobrado}
            etiqueta="de lo realizado ya está cobrado"
            pie={{
              texto: pendiente
                ? `${pendiente.toLocaleString("es-ES")} € por cobrar`
                : "Nada pendiente de cobro",
              detalle: `${cobradas.length}/${realizadas.length}`,
            }}
          />

          <Bloque
            icono="nota"
            titulo="Actividad reciente"
            accion={{ href: "/clientes", texto: "Ver clientes" }}
          >
            {actividades.length === 0 ? (
              <p className="fila px-4 py-6 text-center text-sm text-tenue">
                Todavía no se ha registrado nada.
              </p>
            ) : (
              <ul className="space-y-2">
                {actividades.map((actividad) => (
                  <li key={actividad.id} className="fila flex items-center gap-3 px-3 py-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-superficie">
                      <Icono nombre="nota" className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{actividad.titulo}</p>
                      <p className="mt-0.5 text-xs text-tenue">
                        {tiposActividad.find((t) => t.id === actividad.tipo)?.nombre}
                      </p>
                    </div>
                    <p className="insignia shrink-0 text-tenue">
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
      </div>
    </>
  );
}
