import Link from "next/link";
import type { Metadata } from "next";
import { crearClienteServidor } from "@tinta/compartido/supabase/servidor";
import { estadosFactura, tiposEncargo } from "@tinta/compartido/estudio";
import { metodosPago, type Cita, type Factura, type FacturaProveedor } from "@tinta/compartido/tipos";
import { Bloque } from "@/components/Bloque";
import {
  GraficoFacturacion,
  type MesFacturado,
} from "@/components/GraficoFacturacion";
import { TarjetaIndicador } from "@/components/TarjetaIndicador";
import { TablaCobros } from "@/components/TablaCobros";
import { Encabezado } from "@/components/Encabezado";
import { PastillaColor } from "@/components/PastillaColor";
import { euros as eurosExactos } from "@/lib/importes";

export const metadata: Metadata = { title: "Facturación" };

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

const fecha = (valor: string) =>
  new Date(valor).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });

/** Suma de importes con dos decimales, sin restos de coma flotante. */
const sumar = (valores: number[]) =>
  Math.round(valores.reduce((suma, valor) => suma + Number(valor), 0) * 100) / 100;

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

  const [{ data }, { data: facturasDatos }, { data: gastosDatos }] = await Promise.all([
    supabase.from("citas").select("*").in("tipo", tiposEncargo).order("created_at", { ascending: false }),
    supabase
      .from("facturas")
      .select("*, clientes(nombre)")
      .order("fecha_emision", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase.from("facturas_proveedor").select("base, total").eq("estado", "validada"),
  ]);

  const facturas = (facturasDatos ?? []) as (Factura & { clientes: { nombre: string } | null })[];
  const gastos = (gastosDatos ?? []) as Pick<FacturaProveedor, "base" | "total">[];
  const hoyMadrid = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" }).format(new Date());

  // Una factura anulada no cuenta como ingreso; el IVA tampoco lo es.
  const vigentes = facturas.filter((f) => f.estado !== "anulada");
  const emitidas = facturas.filter((f) => f.estado === "emitida");
  const vencidas = emitidas.filter((f) => f.fecha_vencimiento < hoyMadrid);
  const facturado = sumar(vigentes.map((f) => f.total));
  const cobradoFacturas = sumar(facturas.filter((f) => f.estado === "cobrada").map((f) => f.total));
  const pendienteFacturas = sumar(emitidas.map((f) => f.total));
  const gastosValidados = sumar(gastos.map((g) => g.total));
  const resultado = sumar([...vigentes.map((f) => f.base), ...gastos.map((g) => -g.base)]);

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

      <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <TarjetaIndicador icono="documento" etiqueta="Facturado" valor={facturado} sufijo="€" variacion={null} nota="facturas no anuladas, con IVA" />
        <TarjetaIndicador icono="bien" etiqueta="Cobrado" valor={cobradoFacturas} sufijo="€" variacion={null} nota="facturas cobradas" />
        <TarjetaIndicador
          icono="reloj"
          etiqueta="Pendiente de cobro"
          valor={pendienteFacturas}
          sufijo="€"
          variacion={null}
          nota={vencidas.length ? `${vencidas.length} ${vencidas.length === 1 ? "vencida" : "vencidas"}` : "facturas emitidas, ninguna vencida"}
          subirEsMalo
        />
        <TarjetaIndicador icono="tarjeta" etiqueta="Gastos validados" valor={gastosValidados} sufijo="€" variacion={null} nota="facturas de proveedores" subirEsMalo />
        <TarjetaIndicador icono="grafico" etiqueta="Resultado (sin IVA)" valor={resultado} sufijo="€" variacion={null} nota="base facturada menos base de gastos" />
      </div>

      <div className="mb-3">
        <Bloque icono="documento" titulo="Facturas" nota="Se crean desde Ventas, al facturar una venta confirmada" ajustado>
          {facturas.length === 0 ? (
            <p className="px-5 py-8 text-sm text-tenue">Todavía no hay facturas.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[36rem] text-sm">
                <thead>
                  <tr className="etiqueta border-y border-borde text-left text-tenue">
                    <th className="px-5 py-2 font-medium">Número</th>
                    <th className="px-3 py-2 font-medium">Cliente</th>
                    <th className="px-3 py-2 font-medium">Fecha</th>
                    <th className="px-3 py-2 text-right font-medium">Total</th>
                    <th className="px-3 py-2 font-medium">Estado</th>
                    <th className="px-5 py-2 text-right font-medium">
                      <span className="sr-only">Detalle</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {facturas.map((factura) => {
                    const estado = estadosFactura.find((e) => e.id === factura.estado)!;
                    return (
                      <tr key={factura.id} className="border-b border-borde last:border-0">
                        <td className="cifra px-5 py-3 font-semibold">{factura.numero}</td>
                        <td className="px-3 py-3">{factura.clientes?.nombre ?? "Cliente eliminado"}</td>
                        <td className="px-3 py-3 text-tenue">{fecha(factura.fecha_emision)}</td>
                        <td className="cifra px-3 py-3 text-right font-medium">{eurosExactos(Number(factura.total))}</td>
                        <td className="px-3 py-3">
                          <PastillaColor nombre={estado.nombre} color={estado.color} />
                        </td>
                        <td className="px-5 py-3 text-right">
                          <Link href={`/facturacion/${factura.id}`} className="font-medium underline-offset-4 hover:underline">
                            Ver<span className="sr-only"> la factura {factura.numero}</span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Bloque>
      </div>

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
