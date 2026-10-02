import Link from "next/link";
import { Icono } from "@/components/Icono";

export type Aviso = { texto: string; nivel: "alta" | "media" };

const COLOR: Record<Aviso["nivel"], string> = {
  alta: "var(--acento)",
  media: "var(--amarillo)",
};

/**
 * Tarjeta invertida: el panel entero es del color del fondo menos esta, que
 * va del color del texto. Es el único bloque que pide hacer algo, y el
 * contraste lo dice antes de leerlo. Los avisos salen de los datos, no de
 * ninguna estimación.
 */
export function PanelAtencion({ avisos }: { avisos: Aviso[] }) {
  return (
    <section className="rounded-[1.25rem] bg-texto p-5 text-fondo">
      <div className="flex items-center gap-2 text-[0.8125rem] text-fondo/60">
        <Icono nombre="aviso" className="h-4 w-4" />
        Revisión del tablero
      </div>

      {avisos.length === 0 ? (
        <>
          <h2 className="titular mt-3 text-lg leading-snug">
            No hay nada pendiente de decidir
          </h2>
          <p className="mt-2 text-sm text-fondo/70">
            Ninguna solicitud sin responder, ninguna cita pasada sin cerrar y
            ningún cobro suelto.
          </p>
        </>
      ) : (
        <>
          <h2 className="titular mt-3 text-lg leading-snug">
            {avisos.length}{" "}
            {avisos.length === 1
              ? "cosa necesita una decisión"
              : "cosas necesitan una decisión"}
          </h2>

          <ul className="mt-4 space-y-2.5">
            {avisos.map((aviso) => (
              <li key={aviso.texto} className="flex items-start gap-2.5 text-sm">
                <span
                  aria-hidden
                  className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                  style={{ background: COLOR[aviso.nivel] }}
                />
                <span className="text-fondo/85">{aviso.texto}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      <Link
        href="/oportunidades"
        className="group mt-5 inline-flex items-center gap-2 rounded-full bg-lima px-4 py-2 text-sm font-medium text-sobre-lima transition-opacity duration-200 hover:opacity-90"
      >
        Revisar el tablero
        <Icono
          nombre="flecha"
          className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
        />
      </Link>
    </section>
  );
}
