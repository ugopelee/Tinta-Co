import type { ReactNode } from "react";
import type { Boton as TipoBoton, Sitio } from "@tinta/compartido/web/esquema";
import { Marca as Simbolo } from "@tinta/compartido/marca";
import s from "./lamina.module.css";

/** Piezas comunes de Lámina: contenedor, encabezado con número de pieza, botones y marca. */

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export const lleno = (t: string | null | undefined): t is string => !!t && t.trim().length > 0;

export const esExterno = (destino: string) => /^(https?:)?\/\//i.test(destino.trim());

export const hayReserva = (sitio: Sitio) => sitio.secciones.some((x) => x.visible && x.tipo === "reserva");

/** «01», «02»… entre las secciones visibles, sin portada ni franjas de llamada. */
export function numeroDe(sitio: Sitio, id: string) {
  const lista = sitio.secciones.filter((x) => x.visible && x.tipo !== "portada" && x.tipo !== "llamada");
  const i = lista.findIndex((x) => x.id === id);
  return i < 0 ? null : String(i + 1).padStart(2, "0");
}

/** Párrafos separados por una línea en blanco. */
export const parrafos = (t: string) =>
  t
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

export function Flecha({ externa, className }: { externa?: boolean; className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
      {externa ? <path d="M6 14 14 6M7 6h7v7" /> : <path d="M3 10h13M11 5l5 5-5 5" />}
    </svg>
  );
}

export function Contenedor({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("mx-auto w-full max-w-[84rem] px-4 sm:px-6 lg:px-10", className)}>{children}</div>;
}

/** Franja de pieza: rótulo a la izquierda y «Nº 01» a la derecha, entre dos líneas finas. */
export function Pieza({ n, children, className }: { n: string | null; children?: ReactNode; className?: string }) {
  if (!n && !children) return null;
  return (
    <p
      className={cx(
        s.mono,
        "flex items-center justify-between gap-4 border-y border-[var(--w-linea)] py-2 text-[0.75rem] text-[var(--w-tinta-2)]",
        className,
      )}
    >
      <span className="min-w-0">{children}</span>
      {n && <span className="shrink-0 text-[var(--w-acento-tinta)]">Nº {n}</span>}
    </p>
  );
}

/** Franja de pieza + titular. No pinta lo que esté vacío. */
export function Encabezado({
  sitio,
  id,
  antetitulo,
  titulo,
  idTitulo,
  className,
}: {
  sitio: Sitio;
  id: string;
  antetitulo?: string;
  titulo: string;
  idTitulo: string;
  className?: string;
}) {
  if (!lleno(antetitulo) && !lleno(titulo)) return null;
  return (
    <div className={cx("min-w-0", className)}>
      {lleno(antetitulo) && <Pieza n={numeroDe(sitio, id)}>{antetitulo.trim()}</Pieza>}
      {lleno(titulo) && (
        <h2 id={idTitulo} className={cx(s.titular, s.tSeccion, "mt-6 whitespace-pre-line text-[var(--w-tinta)]")}>
          {titulo.trim()}
        </h2>
      )}
    </div>
  );
}

type Variante = "lleno" | "linea" | "inverso";

/** Botón-enlace. `destino`: #ancla, /ruta o URL (las externas se abren en otra pestaña). */
export function Boton({
  boton,
  variante = "lleno",
  className,
}: {
  boton: TipoBoton | null | undefined;
  variante?: Variante;
  className?: string;
}) {
  if (!boton || !lleno(boton.texto)) return null;
  const destino = boton.destino.trim() || "#";
  const externo = esExterno(destino);
  const estilo: Record<Variante, string> = {
    lleno:
      "border border-[var(--w-acento)] bg-[var(--w-acento)] px-5 text-[var(--w-sobre-acento)] hover:border-[var(--w-tinta)] hover:bg-[var(--w-tinta)] hover:text-[var(--w-fondo)]",
    inverso:
      "border border-[var(--w-sobre-acento)] bg-[var(--w-sobre-acento)] px-5 text-[var(--w-acento)] hover:bg-transparent hover:text-[var(--w-sobre-acento)]",
    linea:
      "border border-[var(--w-tinta-2)] px-5 text-[var(--w-tinta)] hover:border-[var(--w-acento-tinta)] hover:text-[var(--w-acento-tinta)]",
  };
  return (
    <a
      href={destino}
      {...(externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={cx(s.mono, s.boton, "group inline-flex min-h-12 items-center gap-3 text-[0.8125rem]", estilo[variante], className)}
    >
      {boton.texto.trim()}
      {externo && <span className="sr-only"> (se abre en otra pestaña)</span>}
      <Flecha externa={externo} className={s.flecha} />
    </a>
  );
}

/** Símbolo del estudio (o el logo subido) junto al nombre en la fuente de titulares. */
export function Marca({ sitio, className }: { sitio: Sitio; className?: string }) {
  const { nombre, logo } = sitio.marca;
  if (logo) {
    // eslint-disable-next-line @next/next/no-img-element -- URLs de Supabase Storage o /fotos/
    return <img src={logo.url} alt={nombre || logo.alt} className="block h-9 w-auto max-w-[11rem] object-contain" />;
  }
  return (
    <span className={cx("inline-flex items-center gap-2.5", className)}>
      <Simbolo variante="trazo" className="size-7 shrink-0 text-[var(--w-tinta)]" />
      <span className={s.titular}>{nombre.trim() || "Inicio"}</span>
    </span>
  );
}

/** Estado vacío discreto: nunca datos inventados. */
export function Vacio({ children }: { children: ReactNode }) {
  return <p className={cx(s.mono, s.marco, "p-8 text-[0.8125rem] text-[var(--w-tinta-2)]")}>{children}</p>;
}
