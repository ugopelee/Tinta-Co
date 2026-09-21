import type { Metadata } from "next";
import { crearClienteServidor } from "@tinta/compartido/supabase/servidor";
import { metodosPago, type Cita } from "@tinta/compartido/tipos";
import { Bloque } from "@/components/Bloque";
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
    <div className="px-4 py-6 lg:px-6 lg:py-7">
      <header className="mb-6">
        <h1 className="titular text-xl lg:text-[1.375rem]">
          {euros(totalCobrado)} cobrados
        </h1>
        <p className="mt-1 text-sm text-tenue">
          De {cobradas.length} {cobradas.length === 1 ? "cita" : "citas"} a{" "}
          {clientesPagadores}{" "}
          {clientesPagadores === 1 ? "cliente" : "clientes"} distintos.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <TarjetaIndicador
          icono="euro"
          etiqueta="Total cobrado"
          valor={totalCobrado}
          sufijo="€"
          variacion={null}
          nota="histórico"
        />
        <TarjetaIndicador
          icono="reloj"
          etiqueta="Pendiente de cobro"
          valor={porCobrar}
          sufijo="€"
          variacion={null}
          nota="citas comprometidas"
          subirEsMalo
        />
        <TarjetaIndicador
          icono="tarjeta"
          etiqueta="Ticket medio"
          valor={ticketMedio}
          sufijo="€"
          variacion={null}
          nota="por cita cobrada"
        />
        <TarjetaIndicador
          icono="personas"
          etiqueta="Clientes que han pagado"
          valor={clientesPagadores}
          variacion={null}
          nota="distintos"
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.7fr_1fr]">
        <Bloque
          icono="grafico"
          titulo="Facturación por mes"
          nota="Lo cobrado se imputa al mes del cobro"
        >
          <GraficoFacturacion datos={serie} />
        </Bloque>

        <Bloque icono="tarjeta" titulo="Por método de pago">
          {porMetodo.length === 0 ? (
            <p className="py-6 text-sm text-tenue">Todavía no hay cobros.</p>
          ) : (
            <ul className="space-y-4 pt-1">
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
        </Bloque>
      </div>

      <div className="mt-4">
        <Bloque
          icono="euro"
          titulo="Cobros"
          nota="Toca el importe para cambiarlo y el estado para marcar el cobro"
          ajustado
        >
          {citas.length === 0 ? (
            <p className="px-5 py-8 text-sm text-tenue">Todavía no hay citas.</p>
          ) : (
            <TablaCobros citas={citas} />
          )}
        </Bloque>
      </div>
    </div>
  );
}
