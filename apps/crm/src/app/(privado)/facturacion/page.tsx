import type { Metadata } from "next";
import { crearClienteServidor } from "@tinta/compartido/supabase/servidor";
import { tiposEncargo } from "@tinta/compartido/estudio";
import { metodosPago, type Cita } from "@tinta/compartido/tipos";
import { Bloque } from "@/components/Bloque";
import {
  GraficoFacturacion,
  type MesFacturado,
} from "@/components/GraficoFacturacion";
import { TarjetaIndicador } from "@/components/TarjetaIndicador";
import { TablaCobros } from "@/components/TablaCobros";
import { Encabezado } from "@/components/Encabezado";

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
    .in("tipo", tiposEncargo)
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
    <>
      <Encabezado
        miga="Caja · facturación"
        titulo={`${euros(totalCobrado)} cobrados`}
        nota={`De ${cobradas.length} ${cobradas.length === 1 ? "oportunidad" : "oportunidades"} a ${clientesPagadores} ${clientesPagadores === 1 ? "cliente" : "clientes"} distintos.`}
      >
        {porCobrar > 0 && (
          <span className="chip-lima cifra">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-sobre-lima" />
            {euros(porCobrar)} por cobrar
          </span>
        )}
      </Encabezado>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
          nota="oportunidades comprometidas"
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

      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-[1.7fr_1fr]">
        <Bloque
          icono="grafico"
          titulo="Facturación por mes"
          nota="Lo cobrado se imputa al mes del cobro; lo pendiente, al de la cita"
        >
          <GraficoFacturacion datos={serie} />
        </Bloque>

        <Bloque icono="tarjeta" titulo="Por método de pago">
          {porMetodo.length === 0 ? (
            <p className="fila px-4 py-6 text-center text-sm text-tenue">Todavía no hay cobros.</p>
          ) : (
            <ul className="space-y-2">
              {porMetodo.map((fila) => {
                const porcentaje = Math.round((fila.total / totalCobrado) * 100);
                return (
                  <li key={fila.nombre} className="fila px-4 py-3">
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="font-medium">{fila.nombre}</span>
                      <span className="cifra text-tenue">
                        {euros(fila.total)} · {porcentaje}%
                      </span>
                    </div>
                    <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-superficie">
                      <div
                        className="h-full rounded-full bg-texto transition-[width] duration-700"
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

      <div className="mt-3">
        <Bloque
          icono="euro"
          titulo="Cobros"
          nota="Toca el importe para cambiarlo y el estado para marcar el cobro"
          ajustado
        >
          {citas.length === 0 ? (
            <p className="px-5 py-8 text-sm text-tenue">Todavía no hay oportunidades.</p>
          ) : (
            <TablaCobros citas={citas} />
          )}
        </Bloque>
      </div>
    </>
  );
}
