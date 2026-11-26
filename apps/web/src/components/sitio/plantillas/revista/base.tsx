/* eslint-disable @next/next/no-img-element */
import type { ReactNode } from "react";
import type { Boton, Imagen, Sitio } from "@tinta/compartido/web/esquema";
import { Revela } from "./Revela";

/**
 * Piezas comunes de la plantilla Revista: rejilla, folio al pie de página,
 * notas al margen, titulares con cursiva, enlaces, botones y fotos con pie.
 * Solo pintan con variables --w-*.
 */

/* ---- rejilla ---- */

export const ANCHO = "mx-auto w-full max-w-[1500px] px-5 sm:px-10 lg:px-14";
export const REJILLA = "grid grid-cols-12 gap-x-4 sm:gap-x-6 lg:gap-x-8";
export const SECCION = "pt-20 sm:pt-24 lg:pt-32";

/* ---- tipografía ---- */

export const TITULOS = "[font-family:var(--w-titulos),ui-serif,Georgia,serif] font-normal";
export const VERSALITAS = "text-[0.7rem] font-medium uppercase leading-none tracking-[0.18em]";
export const H2 = `${TITULOS} text-[clamp(2.25rem,5vw,4.5rem)] leading-[1] tracking-[-0.025em] text-balance`;
export const CUERPO = "text-[1.0625rem] leading-[1.7] text-[var(--w-tinta-2)]";

/* ---- botones ---- */

const PULSABLE =
  "inline-flex min-h-12 items-center justify-center gap-2 px-7 text-[0.95rem] font-medium transition-[transform,background-color,color,border-color] duration-150 ease-out active:scale-[0.97]";

/** Relleno de acento; el borde en acento-tinta le da forma aunque el acento se parezca al fondo. */
export const BOTON_PRIMARIO = `${PULSABLE} rounded-[var(--w-radio-boton)] border border-[var(--w-acento-tinta)] bg-[var(--w-acento)] text-[var(--w-sobre-acento)] hover:bg-[var(--w-acento-tinta)] hover:text-[var(--w-fondo)]`;

/** Enlace con subrayado, el «secundario» de una revista. */
export const ENLACE_TEXTO =
  "inline-flex min-h-12 items-center text-[0.95rem] font-medium text-[var(--w-tinta)] underline decoration-[var(--w-acento-tinta)] decoration-1 transition-[text-decoration-thickness,color] duration-150 hover:decoration-2 hover:text-[var(--w-acento-tinta)]";

/* ---- utilidades ---- */

export const lleno = (t: string | null | undefined): t is string => !!t && !!t.trim();

/** Párrafos separados por una línea en blanco. */
export function parrafos(texto: string) {
  return texto
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** Número de página: posición entre las secciones de contenido visibles (la portada es la 01). */
export function numeroDe(sitio: Sitio, id: string) {
  const lista = sitio.secciones.filter((s) => s.visible && s.tipo !== "portada" && s.tipo !== "llamada");
  const i = lista.findIndex((s) => s.id === id);
  return i < 0 ? "" : String(i + 2).padStart(2, "0");
}

export const esExterna = (destino: string) => /^(https?:)?\/\//i.test(destino);

/* ---- enlaces ---- */

export function Enlace({
  destino,
  className,
  children,
  onClick,
}: {
  destino: string;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}) {
  const fuera = esExterna(destino);
  return (
    <a
      href={destino || "#"}
      className={className}
      onClick={onClick}
      {...(fuera ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
      {fuera && <span className="sr-only"> (se abre en otra pestaña)</span>}
    </a>
  );
}

export function Botones({ principal, secundario }: { principal: Boton | null; secundario?: Boton | null }) {
  if (!principal && !secundario) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
      {principal && (
        <Enlace destino={principal.destino} className={BOTON_PRIMARIO}>
          {principal.texto}
        </Enlace>
      )}
      {secundario && (
        <Enlace destino={secundario.destino} className={ENLACE_TEXTO}>
          {secundario.texto}
        </Enlace>
      )}
    </div>
  );
}

/* ---- titulares con una palabra en cursiva ----
   Una palabra entre asteriscos (*tiempo*) se pinta en cursiva. En la portada,
   si no hay asteriscos, se enfatiza la última palabra: el gesto de Tinta. */

function lineaConEnfasis(linea: string, clave: string) {
  return linea.split(/\*([^*]+)\*/).map((t, i) =>
    i % 2 === 1 ? (
      <em key={`${clave}-${i}`} className="italic text-[var(--w-acento-tinta)]">
        {t}
      </em>
    ) : (
      t
    ),
  );
}

export function Enfasis({ texto, auto = false }: { texto: string; auto?: boolean }) {
  let fuente = texto.replace(/\s+$/, "");
  if (auto && !fuente.includes("*")) {
    const m = fuente.match(/^([\s\S]*?)(\S+)$/);
    if (m && m[1].trim()) fuente = `${m[1]}*${m[2]}*`;
  }
  return (
    <>
      {fuente.split("\n").map((l, i) => (
        <span key={i}>
          {i > 0 && <br />}
          {lineaConEnfasis(l, String(i))}
        </span>
      ))}
    </>
  );
}

/** Texto plano para menús y atributos (sin asteriscos). */
export const plano = (t: string) => t.replace(/\*/g, "");

/* ---- nota al margen: el antetítulo como rúbrica lateral ---- */

export function Margen({ texto, className = "" }: { texto: string; className?: string }) {
  if (!lleno(texto)) return null;
  return (
    <p
      className={`${VERSALITAS} col-span-12 flex items-center gap-3 text-[var(--w-tinta-2)] lg:col-span-2 lg:pt-3 ${className}`}
    >
      <span aria-hidden className="h-px w-8 shrink-0 bg-[var(--w-acento-tinta)]" />
      {texto}
    </p>
  );
}

/* ---- folio: el número de página al pie de cada sección ---- */

export function Folio({ numero, marca }: { numero: string; marca: string }) {
  if (!numero && !lleno(marca)) return null;
  return (
    <p
      aria-hidden
      className={`${VERSALITAS} mt-20 flex items-center justify-between gap-6 border-t border-[var(--w-linea)] pt-3 text-[var(--w-tinta-2)] lg:mt-28`}
    >
      <span>{lleno(marca) ? marca : ""}</span>
      <span className="tabular-nums">{numero}</span>
    </p>
  );
}

/* ---- fotos ---- */

export function Foto({
  imagen,
  proporcion,
  className = "",
  prioridad = false,
  pie = true,
  numero,
  recta = false,
}: {
  imagen: Imagen;
  /** Clase de aspect-ratio (puede ser responsive). */
  proporcion: string;
  className?: string;
  prioridad?: boolean;
  /** Pie de foto con el texto alternativo (oculto a lectores: ya lo leen en el alt). */
  pie?: boolean;
  numero?: number;
  /** Sin esquinas: para las que sangran hasta el borde de la pantalla. */
  recta?: boolean;
}) {
  const radio = recta ? "" : "rounded-[var(--w-radio)]";
  const img = (
    <img
      src={imagen.url}
      alt={imagen.alt}
      loading={prioridad ? "eager" : "lazy"}
      fetchPriority={prioridad ? "high" : undefined}
      decoding="async"
      className={`h-full w-full bg-[var(--w-placa)] object-cover ${radio} ${proporcion}`}
    />
  );
  return (
    <figure className={className}>
      {prioridad ? (
        <div className={`overflow-hidden ${radio}`}>{img}</div>
      ) : (
        <Revela className={recta ? "!rounded-none" : ""}>{img}</Revela>
      )}
      {pie && lleno(imagen.alt) && (
        <figcaption aria-hidden className="mt-3 flex gap-3 text-[0.8125rem] italic leading-snug text-[var(--w-tinta-2)]">
          {numero !== undefined && <span className="not-italic tabular-nums text-[var(--w-tinta)]">Fig. {numero}</span>}
          <span>{imagen.alt}</span>
        </figcaption>
      )}
    </figure>
  );
}

/** Estado vacío discreto para los bloques que salen de la base de datos. */
export function Vacio({ children }: { children: ReactNode }) {
  return <p className="border-t border-[var(--w-linea)] pt-6 text-[0.95rem] text-[var(--w-tinta-2)]">{children}</p>;
}
