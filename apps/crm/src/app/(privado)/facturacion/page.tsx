import Link from "next/link";
import type { Metadata } from "next";
import { crearClienteServidor } from "@tinta/compartido/supabase/servidor";
import { estadosFactura, tiposEncargo } from "@tinta/compartido/estudio";
import { metodosPago, type Cita, type Factura } from "@tinta/compartido/tipos";
import { Bloque } from "@/components/Bloque";
import {
  GraficoFacturacion,
  type MesFacturado,
} from "@/components/GraficoFacturacion";
import { TarjetaIndicador } from "@/components/TarjetaIndicador";
import { TablaCobros } from "@/components/TablaCobros";
import { Encabezado } from "@/components/Encabezado";
import { PastillaColor } from "@/components/PastillaColor";
import { euros } from "@/lib/importes";
import { fecha } from "@/lib/fechas";

export const metadata: Metadata = { title: "Facturación" };

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/** Las facturas que se listan; las cifras de arriba cuentan todas. */
const FACTURAS_VISIBLES = 50;

/** Cifras grandes de caja y gráfico: sin céntimos. Las facturas usan `euros`, exacto. */
const eurosSinCentimos = (valor: number) =>
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

  const [{ data }, { data: facturasDatos, count: totalFacturas }, { data: resumenDatos, error: errorResumen }] = await Promise.all([
    supabase.from("citas").select("*").in("tipo", tiposEncargo).order("created_at", { ascending: false }),
    supabase
      .from("facturas")
      .select("*, clientes(nombre)", { count: "exact" })
      .order("fecha_emision", { ascending: false })
      .order("numero", { ascending: false })
      .limit(FACTURAS_VISIBLES),
    supabase.rpc("resumen_facturacion").single(),
  ]);

  // Si falla, las cifras de factura se muestran como no disponibles: un 0 € parecería un dato real.
  if (errorResumen) console.error("No se ha podido cargar el resumen de facturación", errorResumen);

  const facturas = (facturasDatos ?? []) as (Factura & { clientes: { nombre: string } | null })[];
  // Todas las cifras en una consulta agregada en la base, no sobre las filas traídas.
  const resumen = resumenDatos as {
    facturado: number;
    cobrado: number;
    pendiente: number;
    vencidas: number;
    base_facturada: number;
    gastos_validados: number;
    base_gastos: number;
  } | null;
  const vencidas = resumen?.vencidas ?? 0;
  // El IVA no es ingreso ni gasto: el resultado se calcula sobre las bases.
  const resultado = resumen ? Math.round((Number(resumen.base_facturada) - Number(resumen.base_gastos)) * 100) / 100 : null;

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
        titulo={`${eurosSinCentimos(totalCobrado)} cobrados`}
        nota={`De ${cobradas.length} ${cobradas.length === 1 ? "oportunidad" : "oportunidades"} a ${clientesPagadores} ${clientesPagadores === 1 ? "cliente" : "clientes"} distintos.`}
      >
        {porCobrar > 0 && (
          <span className="chip-lima cifra">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-sobre-lima" />
            {eurosSinCentimos(porCobrar)} por cobrar
          </span>
        )}
      </Encabezado>

      <h2 className="etiqueta mb-2 text-tenue">Facturas</h2>
      <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <TarjetaIndicador icono="documento" etiqueta="Facturado" valor={resumen ? Number(resumen.facturado) : null} sufijo="€" variacion={null} nota="facturas no anuladas, con IVA" />
        <TarjetaIndicador icono="bien" etiqueta="Facturas cobradas" valor={resumen ? Number(resumen.cobrado) : null} sufijo="€" variacion={null} nota="importe cobrado" />
        <TarjetaIndicador
          icono="reloj"
          etiqueta="Facturas pendientes de cobro"
          valor={resumen ? Number(resumen.pendiente) : null}
          sufijo="€"
          variacion={null}
          nota={vencidas ? `${vencidas} ${vencidas === 1 ? "vencida" : "vencidas"}` : "emitidas, ninguna vencida"}
          subirEsMalo
        />
        <TarjetaIndicador icono="tarjeta" etiqueta="Gastos validados" valor={resumen ? Number(resumen.gastos_validados) : null} sufijo="€" variacion={null} nota="facturas de proveedores" subirEsMalo />
        <TarjetaIndicador icono="grafico" etiqueta="Resultado (sin IVA)" valor={resultado} sufijo="€" variacion={null} nota="base facturada menos base de gastos" />
      </div>

      <div className="mb-3">
        <Bloque icono="documento" titulo="Facturas" nota={
            (totalFacturas ?? 0) > facturas.length
              ? `Las ${facturas.length} más recientes de ${totalFacturas}. Se crean desde Ventas.`
              : "Se crean desde Ventas, al facturar una venta confirmada"
          } ajustado>
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
                    const estado = estadosFactura.find((e) => e.id === factura.estado) ?? estadosFactura[0];
                    return (
                      <tr key={factura.id} className="border-b border-borde last:border-0">
                        <td className="cifra px-5 py-3 font-semibold">{factura.numero}</td>
                        <td className="px-3 py-3">{factura.clientes?.nombre ?? "Cliente eliminado"}</td>
                        <td className="px-3 py-3 text-tenue">{fecha(factura.fecha_emision)}</td>
                        <td className="cifra px-3 py-3 text-right font-medium">{euros(Number(factura.total))}</td>
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

      <h2 className="etiqueta mb-2 text-tenue">Cobros de citas</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <TarjetaIndicador
          icono="euro"
          etiqueta="Cobrado en citas"
          valor={totalCobrado}
          sufijo="€"
          variacion={null}
          nota="histórico"
        />
        <TarjetaIndicador
          icono="reloj"
          etiqueta="Citas por cobrar"
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
                        {eurosSinCentimos(fila.total)} · {porcentaje}%
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
