import type { Metadata } from "next";
import { crearClienteServidor } from "@tinta/compartido/supabase/servidor";
import { metodosPago, type Cita } from "@tinta/compartido/tipos";
import {
  GraficoFacturacion,
  type MesFacturado,
} from "@/components/GraficoFacturacion";
import { TarjetaIndicador } from "@/components/TarjetaIndicador";
import { TablaCobros } from "@/components/TablaCobros";

export const metadata: Metadata = { title: "Facturación" };

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

const euros = (valor: number) =>
  valor.toLocaleString("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });

/**
 * Lo cobrado se imputa al mes del cobro; lo pendiente, al mes de la cita.
 * Mezclar ambos criterios daría un total que no cuadra con la caja.
 */
function porMes(citas: Cita[]): MesFacturado[] {
  const hoy = new Date();
  const meses: MesFacturado[] = [];

  for (let atras = 5; atras >= 0; atras--) {
    const referencia = new Date(hoy.getFullYear(), hoy.getMonth() - atras, 1);

    const delMes = (fecha: string | null) => {
      if (!fecha) return false;
      const dato = new Date(fecha);
      return (
        dato.getFullYear() === referencia.getFullYear() &&
        dato.getMonth() === referencia.getMonth()
      );
    };

    const cobrado = citas
      .filter((cita) => cita.pagado && delMes(cita.fecha_cobro))
      .reduce((suma, cita) => suma + Number(cita.importe ?? 0), 0);

    const pendiente = citas
      .filter((cita) => !cita.pagado && delMes(cita.created_at))
      .reduce((suma, cita) => suma + Number(cita.importe ?? 0), 0);

    meses.push({ etiqueta: MESES[referencia.getMonth()], cobrado, pendiente });
  }

  return meses;
}

export default async function Facturacion() {
  const supabase = await crearClienteServidor();

  const { data } = await supabase
    .from("citas")
    .select("*")
    .order("created_at", { ascending: false });

  const citas = (data ?? []) as Cita[];
  const cobradas = citas.filter((cita) => cita.pagado);

  const totalCobrado = cobradas.reduce(
    (suma, cita) => suma + Number(cita.importe ?? 0),
    0,
  );

  // Pendiente real: solo lo que ya se ha comprometido, no las solicitudes.
  const porCobrar = citas
    .filter(
      (cita) =>
        !cita.pagado &&
        (cita.estado === "confirmada" || cita.estado === "realizada"),
    )
    .reduce((suma, cita) => suma + Number(cita.importe ?? 0), 0);

  const ticketMedio = cobradas.length
    ? Math.round(totalCobrado / cobradas.length)
    : 0;

  const clientesPagadores = new Set(
    cobradas.map((cita) => cita.cliente_id ?? cita.email),
  ).size;

  const serie = porMes(citas);

  const porMetodo = metodosPago
    .map((metodo) => ({
      nombre: metodo.nombre,
      total: cobradas
        .filter((cita) => cita.metodo_pago === metodo.id)
        .reduce((suma, cita) => suma + Number(cita.importe ?? 0), 0),
    }))
    .filter((fila) => fila.total > 0)
    .sort((a, b) => b.total - a.total);

  return (
    <div className="px-5 py-6 lg:px-8 lg:py-8">
      <header className="mb-7">
        <p className="etiqueta text-tenue">Facturación</p>
        <h1 className="titular mt-2 text-2xl lg:text-3xl">
          {euros(totalCobrado)} cobrados
        </h1>
        <p className="mt-2 text-sm text-tenue">
          De {cobradas.length} {cobradas.length === 1 ? "cita" : "citas"} a{" "}
          {clientesPagadores}{" "}
          {clientesPagadores === 1 ? "cliente" : "clientes"} distintos.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <TarjetaIndicador
          etiqueta="Total cobrado"
          valor={totalCobrado}
          sufijo="€"
          serie={serie.map((mes) => mes.cobrado)}
          color="#57a86f"
          variacion={null}
          nota="histórico"
        />
        <TarjetaIndicador
          etiqueta="Pendiente de cobro"
          valor={porCobrar}
          sufijo="€"
          serie={serie.map((mes) => mes.pendiente)}
          color="#bd8a2e"
          variacion={null}
          nota="citas comprometidas"
        />
        <TarjetaIndicador
          etiqueta="Ticket medio"
          valor={ticketMedio}
          sufijo="€"
          serie={serie.map((mes) => mes.cobrado)}
          color="#5b8dd9"
          variacion={null}
          nota="por cita cobrada"
        />
        <TarjetaIndicador
          etiqueta="Clientes que han pagado"
          valor={clientesPagadores}
          serie={serie.map((mes) => (mes.cobrado > 0 ? 1 : 0))}
          color="#c2452f"
          variacion={null}
          nota="distintos"
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.7fr_1fr]">
        <section className="rounded-xl border border-borde bg-superficie p-5 lg:p-6">
          <div className="mb-5">
            <h2 className="text-base font-medium">Facturación por mes</h2>
            <p className="mt-1 text-xs text-tenue">
              Lo cobrado se imputa al mes del cobro
            </p>
          </div>
          <GraficoFacturacion datos={serie} />
        </section>

        <section className="rounded-xl border border-borde bg-superficie p-5 lg:p-6">
          <h2 className="text-base font-medium">Por método de pago</h2>

          {porMetodo.length === 0 ? (
            <p className="mt-5 text-sm text-tenue">Todavía no hay cobros.</p>
          ) : (
            <ul className="mt-5 space-y-4">
              {porMetodo.map((fila) => {
                const porcentaje = Math.round((fila.total / totalCobrado) * 100);
                return (
                  <li key={fila.nombre}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span>{fila.nombre}</span>
                      <span className="cifra text-tenue">
                        {euros(fila.total)} · {porcentaje}%
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-superficie-alta">
                      <div
                        className="h-full rounded-full bg-acento transition-[width] duration-700"
                        style={{ width: `${porcentaje}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <section className="mt-4 overflow-hidden rounded-xl border border-borde bg-superficie">
        <div className="border-b border-borde px-5 py-4">
          <h2 className="text-base font-medium">Cobros</h2>
          <p className="mt-1 text-xs text-tenue">
            Toca el importe para cambiarlo y el estado para marcar el cobro.
          </p>
        </div>

        {citas.length === 0 ? (
          <p className="px-5 py-8 text-sm text-tenue">Todavía no hay citas.</p>
        ) : (
          <TablaCobros citas={citas} />
        )}
      </section>
    </div>
  );
}
