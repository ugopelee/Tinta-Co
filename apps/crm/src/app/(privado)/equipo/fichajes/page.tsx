import type { Metadata } from "next";
import Link from "next/link";
import { crearClienteServidor } from "@tinta/compartido/supabase/servidor";
import type { Empleado, Fichaje } from "@tinta/compartido/tipos";
import { Avatar } from "@/components/Avatar";
import { Bloque } from "@/components/Bloque";
import { Encabezado } from "@/components/Encabezado";
import { diaDe, duracion, fechaCorta, hora, hoyMadrid, lunesDe, minutos } from "@/lib/equipo";

export const metadata: Metadata = { title: "Fichajes" };

/**
 * Control horario: quién está dentro ahora, horas de la semana por persona y
 * el registro de entradas y salidas de los últimos 14 días. Los fichajes los
 * hace cada empleado desde su portal, con la hora del servidor.
 */
export default async function Fichajes() {
  const supabase = await crearClienteServidor();
  const hoy = hoyMadrid();
  const desde = new Date(`${hoy}T12:00:00Z`);
  desde.setUTCDate(desde.getUTCDate() - 14);

  const [{ data: empleadosData }, { data: fichajesData }] = await Promise.all([
    supabase.from("empleados").select("*").neq("estado", "baja").order("nombre"),
    supabase
      .from("fichajes")
      .select("*")
      .gte("entrada", desde.toISOString())
      .order("entrada", { ascending: false }),
  ]);

  const empleados = (empleadosData ?? []) as Empleado[];
  const fichajes = (fichajesData ?? []) as Fichaje[];
  const porId = new Map(empleados.map((e) => [e.id, e]));
  const lunes = lunesDe(hoy);

  const resumen = empleados.map((empleado) => {
    const suyos = fichajes.filter((f) => f.empleado_id === empleado.id);
    return {
      empleado,
      abierto: suyos.find((f) => !f.salida),
      hoy: suyos.filter((f) => diaDe(f.entrada) === hoy).reduce((t, f) => t + minutos(f), 0),
      semana: suyos.filter((f) => diaDe(f.entrada) >= lunes).reduce((t, f) => t + minutos(f), 0),
    };
  });

  const dentro = resumen.filter((fila) => fila.abierto).length;

  return (
    <div className="max-w-5xl">
      <Encabezado
        miga="Equipo · control horario"
        titulo="Fichajes"
        nota="Entradas y salidas del equipo. Cada persona ficha desde su portal y la hora la pone el servidor."
      >
        <span className="chip-lima cifra">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-sobre-lima" />
          {dentro} {dentro === 1 ? "persona dentro" : "personas dentro"}
        </span>
      </Encabezado>

      <div className="grid gap-3 lg:grid-cols-[1fr_1.3fr]">
        <Bloque titulo="Ahora" nota="Hoy y en lo que va de semana">
          {resumen.length === 0 ? (
            <p className="fila px-4 py-6 text-center text-sm text-tenue">No hay nadie en el equipo.</p>
          ) : (
            <ul className="space-y-2">
              {resumen.map(({ empleado, abierto, hoy: minutosHoy, semana }) => (
                <li key={empleado.id}>
                  <Link href={`/equipo/${empleado.id}`} className="fila flex items-center gap-3 px-4 py-2.5">
                    <span className="relative">
                      <Avatar nombre={empleado.nombre} foto={empleado.foto_url} className="h-9 w-9 text-xs" />
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-superficie-alta ${
                          abierto ? "bg-verde" : "bg-borde"
                        }`}
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{empleado.nombre}</span>
                      <span className="block text-xs text-tenue">
                        {abierto ? `Dentro desde las ${hora(abierto.entrada)}` : "Fuera"}
                      </span>
                    </span>
                    <span className="text-right">
                      <span className="cifra block text-sm font-medium">{duracion(minutosHoy)}</span>
                      <span className="cifra block text-xs text-tenue">{duracion(semana)} semana</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Bloque>

        <Bloque titulo="Registro" nota="Últimos 14 días" ajustado>
          {fichajes.length === 0 ? (
            <p className="mx-5 mb-5 fila px-4 py-6 text-center text-sm text-tenue">Sin fichajes todavía.</p>
          ) : (
            <div className="overflow-x-auto px-5 pb-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-tenue">
                    <th className="pb-2 font-medium">Persona</th>
                    <th className="pb-2 font-medium">Día</th>
                    <th className="pb-2 font-medium">Entrada</th>
                    <th className="pb-2 font-medium">Salida</th>
                    <th className="pb-2 text-right font-medium">Horas</th>
                  </tr>
                </thead>
                <tbody>
                  {fichajes.map((fichaje) => (
                    <tr key={fichaje.id} className="border-t border-borde">
                      <td className="py-2 pr-3">{porId.get(fichaje.empleado_id)?.nombre ?? "—"}</td>
                      <td className="py-2 pr-3 text-tenue">{fechaCorta(diaDe(fichaje.entrada))}</td>
                      <td className="cifra py-2 pr-3">{hora(fichaje.entrada)}</td>
                      <td className="cifra py-2 pr-3">
                        {fichaje.salida ? hora(fichaje.salida) : <span className="text-verde">Dentro</span>}
                      </td>
                      <td className="cifra py-2 text-right font-medium">{duracion(minutos(fichaje))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Bloque>
      </div>
    </div>
  );
}
