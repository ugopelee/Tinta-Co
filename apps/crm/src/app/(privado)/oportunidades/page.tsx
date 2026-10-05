import type { Metadata } from "next";
import Link from "next/link";
import { crearClienteServidor } from "@tinta/compartido/supabase/servidor";
import {
  tiposOportunidad,
  type FamiliaOportunidad,
  type TipoOportunidad,
} from "@tinta/compartido/estudio";
import type { Cita } from "@tinta/compartido/tipos";
import { BandejaPropuestas } from "@/components/BandejaPropuestas";
import { Kanban, type CitaTablero } from "@/components/Kanban";
import { Encabezado } from "@/components/Encabezado";

export const metadata: Metadata = { title: "Oportunidades" };

const FAMILIAS: { id: FamiliaOportunidad; titulo: string; descripcion: string }[] = [
  {
    id: "encargo",
    titulo: "Encargos",
    descripcion: "Citas y eventos: se agendan y se cobran.",
  },
  {
    id: "propuesta",
    titulo: "Propuestas",
    descripcion: "Proveedores, colaboraciones y demás: se conversan.",
  },
];

/**
 * Todo lo que entra por la web, en dos bandejas: quien quiere tatuarse
 * (tablero por estados) y quien quiere hacer negocio con el estudio (lista
 * de mensajes). Son la misma tabla, pero se trabajan de forma distinta.
 */
export default async function Oportunidades({
  searchParams,
}: {
  searchParams: Promise<{ vista?: string; tipo?: string }>;
}) {
  const { vista: vistaPedida, tipo: tipoPedido } = await searchParams;
  const tipo = tiposOportunidad.find((opcion) => opcion.id === tipoPedido);

  // El tipo manda: un enlace antiguo a ?tipo=evento sigue cayendo en encargos.
  const familia: FamiliaOportunidad =
    tipo?.familia ?? (vistaPedida === "propuestas" ? "propuesta" : "encargo");

  const supabase = await crearClienteServidor();

  const { data, error } = await supabase
    .from("citas")
    .select("*, disenos(nombre)")
    .order("posicion", { ascending: false });

  const todas = (data ?? []) as CitaTablero[];
  const familiaDe = (cita: Cita) =>
    tiposOportunidad.find((opcion) => opcion.id === cita.tipo)?.familia ?? "encargo";

  const deLaFamilia = todas.filter((cita) => familiaDe(cita) === familia);
  const visibles = tipo ? deLaFamilia.filter((cita) => cita.tipo === tipo.id) : deLaFamilia;

  const rutaFamilia = (id: FamiliaOportunidad) =>
    id === "propuesta" ? "/oportunidades?vista=propuestas" : "/oportunidades";

  const filtros: { id: TipoOportunidad | undefined; texto: string; cuantas: number; href: string }[] = [
    { id: undefined, texto: "Todas", cuantas: deLaFamilia.length, href: rutaFamilia(familia) },
    ...tiposOportunidad
      .filter((opcion) => opcion.familia === familia)
      .map((opcion) => ({
        id: opcion.id,
        texto: opcion.plural,
        cuantas: deLaFamilia.filter((cita) => cita.tipo === opcion.id).length,
        href: `/oportunidades?tipo=${opcion.id}`,
      })),
  ];

  return (
    <>
      <Encabezado
        miga="Estudio · tablero"
        titulo="Oportunidades"
        nota="Todo lo que llega desde la web: gente que quiere tatuarse y gente que quiere trabajar con el estudio."
      />

      <nav aria-label="Bandeja" className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {FAMILIAS.map((opcion) => {
          const activa = opcion.id === familia;
          const suyas = todas.filter((cita) => familiaDe(cita) === opcion.id);
          const nuevas = suyas.filter((cita) => cita.estado === "solicitada").length;

          return (
            <Link
              key={opcion.id}
              href={rutaFamilia(opcion.id)}
              aria-current={activa ? "page" : undefined}
              className={`group flex items-start justify-between gap-4 rounded-[1.25rem] p-5 transition-[background-color,transform] duration-150 ease-out active:scale-[0.99] ${
                activa ? "bg-texto text-fondo" : "tarjeta hover:bg-superficie-alta"
              }`}
            >
              <span className="min-w-0">
                <span className="flex items-center gap-2.5">
                  <span className="text-base font-semibold tracking-tight">{opcion.titulo}</span>
                  {nuevas > 0 && (
                    <span className="cifra rounded-full bg-lima px-2 py-0.5 text-[0.7rem] font-semibold text-sobre-lima">
                      {nuevas} {nuevas === 1 ? "nueva" : "nuevas"}
                    </span>
                  )}
                </span>
                <span className={`mt-1 block text-sm ${activa ? "text-fondo/60" : "text-tenue"}`}>
                  {opcion.descripcion}
                </span>
              </span>
              <span className="titular cifra text-[2rem] leading-none">{suyas.length}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Filtrar por tipo" className="segmentos flex-wrap !bg-superficie">
          {filtros.map((filtro) => {
            const activo = filtro.id === tipo?.id;
            return (
              <Link
                key={filtro.texto}
                href={filtro.href}
                aria-current={activo ? "page" : undefined}
                className="segmento"
              >
                {filtro.texto}
                <span className={`cifra text-xs ${activo ? "text-fondo/60" : "text-tenue"}`}>
                  {filtro.cuantas}
                </span>
              </Link>
            );
          })}
        </nav>
        <p className="text-xs text-tenue">
          {familia === "encargo"
            ? "Arrastra una tarjeta o usa su desplegable para cambiar el estado."
            : "Responde por email y marca en qué punto está cada conversación."}
        </p>
      </div>

      {error ? (
        <p className="tarjeta p-8 text-center text-sm text-tenue">
          No se han podido cargar las oportunidades.
        </p>
      ) : familia === "encargo" ? (
        // La key reinicia el estado optimista al cambiar de filtro.
        <Kanban key={tipo?.id ?? "encargos"} citas={visibles} />
      ) : (
        <BandejaPropuestas key={tipo?.id ?? "propuestas"} propuestas={visibles} />
      )}
    </>
  );
}
