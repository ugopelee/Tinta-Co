import type { Metadata } from "next";
import Link from "next/link";
import { crearClienteServidor } from "@tinta/compartido/supabase/servidor";
import { tiposEncargo, tiposEvento } from "@tinta/compartido/estudio";
import { metodosPago, type Cita } from "@tinta/compartido/tipos";
import { Bloque } from "@/components/Bloque";
import { Encabezado } from "@/components/Encabezado";
import { BarrasEstilos, DonutMetodos, type Porcion } from "@/components/GraficosInforme";
import { Icono } from "@/components/Icono";
import { TarjetaIndicador } from "@/components/TarjetaIndicador";
import { anterior, meses, siguiente, trimestreDe } from "@/lib/trimestres";

export const metadata: Metadata = { title: "Informes" };

type Fila = Cita & { disenos: { nombre: string } | null };

const euros = (valor: number) =>
  valor.toLocaleString("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

const importe = (cita: Cita) => Number(cita.importe ?? 0);

/** Suma por una clave y ordena de mayor a menor; lo vacío va a «Sin indicar». */
function agrupar(citas: Cita[], clave: (cita: Cita) => string | null | undefined): Porcion[] {
  const totales = new Map<string, number>();
  for (const cita of citas) {
    const nombre = clave(cita) || "Sin indicar";
    totales.set(nombre, (totales.get(nombre) ?? 0) + importe(cita));
  }
  return [...totales.entries()]
    .map(([nombre, total]) => ({ nombre, total }))
    .filter((porcion) => porcion.total > 0)
    .sort((a, b) => b.total - a.total);
}

/**
 * Lo que la gestoría y el propio estudio preguntan cada trimestre. Todo sale
 * de la columna de cobro de cada cita: lo cobrado se imputa a la fecha del
 * cobro, igual que en Facturación, para que las cifras cuadren entre vistas.
 */
export default async function Informes({ searchParams }: PageProps<"/informes">) {
  const { t: parametro } = await searchParams;
  const t = trimestreDe(parametro);
  const previo = anterior(t);

  const supabase = await crearClienteServidor();
  const [{ data: cobrosData }, { data: pedidosData }] = await Promise.all([
    supabase
      .from("citas")
      .select("*, disenos(nombre)")
      .in("tipo", tiposEncargo)
      .eq("pagado", true)
      .gte("fecha_cobro", previo.desde)
      .lt("fecha_cobro", t.hasta),
    // La demanda se mide por cuándo se pidió, no por cuándo se cobró.
    supabase
      .from("citas")
      .select("diseno_id, disenos(nombre)")
      .not("diseno_id", "is", null)
      .gte("created_at", t.desde)
      .lt("created_at", t.hasta),
  ]);

  const todos = (cobrosData ?? []) as Fila[];
  const cobros = todos.filter((cita) => cita.fecha_cobro! >= t.desde);
  const cobrosPrevios = todos.filter((cita) => cita.fecha_cobro! < t.desde);

  const cobrado = cobros.reduce((suma, cita) => suma + importe(cita), 0);
  const cobradoPrevio = cobrosPrevios.reduce((suma, cita) => suma + importe(cita), 0);
  const variacion = cobradoPrevio ? Math.round(((cobrado - cobradoPrevio) / cobradoPrevio) * 100) : null;
  const ticket = cobros.length ? Math.round(cobrado / cobros.length) : 0;

  const porCliente = agrupar(cobros, (cita) => cita.nombre).slice(0, 5);
  const clientesDistintos = new Set(cobros.map((cita) => cita.cliente_id ?? cita.email)).size;

  const porMetodo = agrupar(
    cobros,
    (cita) => metodosPago.find((metodo) => metodo.id === cita.metodo_pago)?.nombre,
  );

  const porEstilo = agrupar(cobros, (cita) =>
    cita.tipo === "evento"
      ? `Evento · ${tiposEvento.find((evento) => evento.id === cita.tipo_evento)?.nombre ?? "otro"}`
      : cita.estilo_interes,
  ).slice(0, 6);

  const porMes = meses(t).map((mes) => ({
    ...mes,
    total: cobros
      .filter((cita) => cita.fecha_cobro!.startsWith(mes.clave))
      .reduce((suma, cita) => suma + importe(cita), 0),
  }));
  const maximoMes = Math.max(1, ...porMes.map((mes) => mes.total));

  const pedidos = new Map<string, number>();
  for (const fila of (pedidosData ?? []) as unknown as { disenos: { nombre: string } | null }[]) {
    const nombre = fila.disenos?.nombre;
    if (nombre) pedidos.set(nombre, (pedidos.get(nombre) ?? 0) + 1);
  }
  const masPedidos = [...pedidos.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <>
      <Encabezado
        miga="Caja · informes"
        titulo={`${t.numero}.º trimestre ${t.anio}`}
        nota={`De ${t.nombre}. Lo cobrado cuenta por la fecha del cobro, igual que en Facturación.`}
      >
        <nav aria-label="Cambiar de trimestre" className="segmentos !bg-superficie">
          <Link href={`/informes?t=${previo.clave}`} aria-label="Trimestre anterior" className="segmento !px-2.5">
            <Icono nombre="flecha" className="h-4 w-4 rotate-180" />
          </Link>
          <Link href="/informes" className="segmento">
            Actual
          </Link>
          <Link href={`/informes?t=${siguiente(t).clave}`} aria-label="Trimestre siguiente" className="segmento !px-2.5">
            <Icono nombre="flecha" className="h-4 w-4" />
          </Link>
        </nav>

        {/* Un enlace normal con `download`: el navegador guarda el archivo sin
            salir del panel. */}
        <a href={`/informes/exportar?t=${t.clave}`} download className="boton">
          <Icono nombre="descargar" className="h-4 w-4" />
          Descargar CSV
        </a>
      </Encabezado>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <TarjetaIndicador
          icono="euro"
          etiqueta="Cobrado"
          valor={cobrado}
          sufijo="€"
          variacion={variacion}
          nota={`vs. ${euros(cobradoPrevio)} el trimestre anterior`}
        />
        <TarjetaIndicador icono="tarjeta" etiqueta="Cobros" valor={cobros.length} variacion={null} nota="citas y eventos cobrados" />
        <TarjetaIndicador icono="grafico" etiqueta="Ticket medio" valor={ticket} sufijo="€" variacion={null} nota="por cobro" />
        <TarjetaIndicador icono="personas" etiqueta="Clientes" valor={clientesDistintos} variacion={null} nota="distintos que han pagado" />
      </div>

      <div className="mt-3 grid grid-cols-1 items-start gap-3 xl:grid-cols-2">
        <Bloque titulo="Por método de pago" nota="Cómo ha entrado el dinero">
          <DonutMetodos datos={porMetodo} />
        </Bloque>

        <Bloque titulo="Por estilo" nota="Qué trabajo deja más en caja">
          <BarrasEstilos datos={porEstilo} />
        </Bloque>

        <Bloque titulo="Mes a mes" nota="Cobrado en cada mes del trimestre">
          <ul className="space-y-2">
            {porMes.map((mes) => (
              <li key={mes.clave} className="fila px-4 py-3">
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-medium capitalize">{mes.nombre}</span>
                  <span className="cifra font-medium">{euros(mes.total)}</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-superficie">
                  <div
                    className="h-full rounded-full bg-texto transition-[width] duration-700"
                    style={{ width: `${(mes.total / maximoMes) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Bloque>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
          <Bloque titulo="Mejores clientes" nota="Por lo cobrado en el trimestre">
            {porCliente.length === 0 ? (
              <p className="fila px-4 py-6 text-center text-sm text-tenue">Nadie todavía.</p>
            ) : (
              <ol className="space-y-2">
                {porCliente.map((cliente, indice) => (
                  <li key={cliente.nombre} className="fila flex items-center gap-3 px-3 py-2.5 text-sm">
                    <span
                      className={`cifra flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                        indice === 0 ? "bg-lima text-sobre-lima" : "bg-superficie"
                      }`}
                    >
                      {indice + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-medium">{cliente.nombre}</span>
                    <span className="cifra">{euros(cliente.total)}</span>
                  </li>
                ))}
              </ol>
            )}
          </Bloque>

          <Bloque titulo="Flash más pedidos" nota="Solicitudes del trimestre por diseño">
            {masPedidos.length === 0 ? (
              <p className="fila px-4 py-6 text-center text-sm text-tenue">Ningún flash pedido.</p>
            ) : (
              <ol className="space-y-2">
                {masPedidos.map(([nombre, veces]) => (
                  <li key={nombre} className="fila flex items-center gap-3 px-3 py-2.5 text-sm">
                    <span className="min-w-0 flex-1 truncate font-medium">{nombre}</span>
                    <span className="insignia cifra">
                      {veces} {veces === 1 ? "vez" : "veces"}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </Bloque>
        </div>
      </div>
    </>
  );
}
