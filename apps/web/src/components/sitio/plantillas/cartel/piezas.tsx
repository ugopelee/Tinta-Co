/* eslint-disable @next/next/no-img-element -- imágenes de Supabase Storage o /fotos/, sin optimizador */
import type { CSSProperties, ReactNode } from "react";
import type { Boton, Imagen, Sitio } from "@tinta/compartido/web/esquema";

/**
 * Piezas de la plantilla Cartel.
 *
 * Cada sección es un bloque plano de color que alterna entre tres tonos:
 * fondo, tinta (invertido) y acento. Cada tono redefine unas variables locales
 * --k-* a partir de las --w-* del tema, así las piezas de dentro (botones,
 * sellos, boletos, formulario) se pintan bien en cualquier tono sin saber en
 * cuál están.
 *
 *  --k-fondo / --k-tinta           · superficie y texto del bloque
 *  --k-suave                       · texto secundario
 *  --k-destaque                    · texto resaltado (acento legible o tinta)
 *  --k-relleno / --k-sobre-relleno · rellenos de botones, sellos y boletos
 *  --k-borde                       · reglas gruesas y contornos
 *  --k-marco                       · regla entre bloques vecinos
 */

export type Tono = "fondo" | "tinta" | "acento";

export const TONOS: Record<Tono, CSSProperties> = {
  fondo: {
    "--k-fondo": "var(--w-fondo)",
    "--k-tinta": "var(--w-tinta)",
    "--k-suave": "var(--w-tinta-2)",
    "--k-destaque": "var(--w-acento-tinta)",
    "--k-relleno": "var(--w-acento)",
    "--k-sobre-relleno": "var(--w-sobre-acento)",
    "--k-borde": "var(--w-tinta)",
    "--k-marco": "var(--w-tinta)",
  } as CSSProperties,
  tinta: {
    "--k-fondo": "var(--w-tinta)",
    "--k-tinta": "var(--w-fondo)",
    "--k-suave": "color-mix(in srgb, var(--w-fondo) 80%, var(--w-tinta))",
    "--k-destaque": "var(--w-fondo)",
    "--k-relleno": "var(--w-acento)",
    "--k-sobre-relleno": "var(--w-sobre-acento)",
    "--k-borde": "var(--w-fondo)",
    "--k-marco": "var(--w-fondo)",
  } as CSSProperties,
  acento: {
    "--k-fondo": "var(--w-acento)",
    "--k-tinta": "var(--w-sobre-acento)",
    "--k-suave": "var(--w-sobre-acento)",
    "--k-destaque": "var(--w-sobre-acento)",
    "--k-relleno": "var(--w-sobre-acento)",
    "--k-sobre-relleno": "var(--w-acento)",
    "--k-borde": "var(--w-sobre-acento)",
    "--k-marco": "var(--w-tinta)",
  } as CSSProperties,
};

/** La portada (índice 0) cae en fondo; luego acento, tinta, fondo… */
export const tonoDe = (indice: number): Tono => (["fondo", "acento", "tinta"] as const)[indice % 3];
export const tonoInverso = (tono: Tono): Tono => (tono === "acento" ? "tinta" : "acento");

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

/* ---- tipografía ---- */

/** La gótica solo sirve para titulares grandes y en caja normal: en versalitas no se lee. */
const TITULOS = "[font-family:var(--w-titulos)] [overflow-wrap:anywhere] text-balance";
export const T_SECCION = cx(TITULOS, "text-[clamp(2.75rem,8vw,6rem)] leading-[0.98]");
export const T_ELEMENTO = cx(TITULOS, "text-[clamp(1.9rem,3vw,2.75rem)] leading-[1]");
/** Etiquetas pequeñas: siempre en la fuente de texto, nunca en gótica. */
export const ETIQUETA = "text-xs font-extrabold uppercase tracking-[0.12em]";

/* ---- enlaces ---- */

export const esExterna = (destino: string) => /^(https?:)?\/\//i.test(destino.trim());

export function atributosEnlace(destino: string) {
  const href = destino.trim() || "#";
  return esExterna(href) ? { href, target: "_blank", rel: "noopener noreferrer" } : { href };
}

/** Ancla de la primera sección de reserva visible, si hay. */
export function anclaReserva(sitio: Sitio) {
  const s = sitio.secciones.find((x) => x.visible && x.tipo === "reserva");
  return s ? `#${s.id}` : null;
}

/* ---- botones ---- */

export function claseBoton(variante: "lleno" | "hueco" = "lleno") {
  return cx(
    "ct-boton inline-flex min-h-12 items-center justify-center gap-2 border-[3px] border-[var(--k-borde)] px-6 py-3",
    "rounded-[var(--w-radio-boton)] text-center text-sm font-extrabold tracking-[0.08em] uppercase",
    variante === "lleno"
      ? "bg-[var(--k-relleno)] text-[var(--k-sobre-relleno)]"
      : "bg-transparent text-[var(--k-tinta)]",
  );
}

export function BotonEnlace({
  boton,
  variante = "lleno",
  className,
}: {
  boton: Boton | null | undefined;
  variante?: "lleno" | "hueco";
  className?: string;
}) {
  if (!boton?.texto.trim()) return null;
  const externa = esExterna(boton.destino);
  return (
    <a {...atributosEnlace(boton.destino)} className={cx(claseBoton(variante), className)}>
      {boton.texto}
      {externa && <span className="sr-only"> (se abre en otra pestaña)</span>}
    </a>
  );
}

/* ---- estructura ---- */

/** Regla gruesa con filete fino debajo, como el borde de un cartel impreso. */
export function Regla({ className }: { className?: string }) {
  return (
    <div aria-hidden className={className}>
      <div className="h-2 bg-[var(--k-borde)]" />
      <div className="mt-1 h-0.5 bg-[var(--k-borde)]" />
    </div>
  );
}

export function Bloque({
  tono,
  etiquetadoPor,
  className,
  children,
}: {
  tono: Tono;
  etiquetadoPor?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      style={TONOS[tono]}
      aria-labelledby={etiquetadoPor}
      className={cx(
        "overflow-x-clip border-b-[6px] border-[var(--k-marco)] bg-[var(--k-fondo)] text-[var(--k-tinta)]",
        "py-16 sm:py-20 lg:py-28",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function Contenedor({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx("mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-10", className)}>{children}</div>;
}

/**
 * Sello redondo y torcido, como el de un puesto de convención. El texto va en
 * la fuente de texto (nunca gótica) y se recorta a cuatro líneas.
 */
export function Sello({
  children,
  giro = 8,
  className,
}: {
  children: ReactNode;
  giro?: number;
  className?: string;
}) {
  return (
    <span
      style={{ rotate: `${giro}deg` }}
      className={cx(
        "ct-sello inline-flex size-[6.75rem] shrink-0 items-center justify-center rounded-full bg-[var(--k-relleno)] p-3.5 text-center text-[var(--k-sobre-relleno)]",
        "text-xs leading-tight font-extrabold tracking-[0.06em] uppercase [overflow-wrap:anywhere]",
        className,
      )}
    >
      <span className="line-clamp-4">{children}</span>
    </span>
  );
}

/** Titular + sello + texto. Lo vacío no se pinta. */
export function Cabecera({
  idTitulo,
  antetitulo,
  titulo,
  texto,
}: {
  idTitulo: string;
  antetitulo?: string;
  titulo?: string;
  texto?: string;
}) {
  const a = antetitulo?.trim();
  const t = titulo?.trim();
  const x = texto?.trim();
  if (!a && !t && !x) return null;
  return (
    <header className="mb-10 lg:mb-14">
      {(a || t) && (
        <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-6">
          {t && (
            <h2 id={idTitulo} className={cx(T_SECCION, "min-w-0 flex-1 basis-[18rem]")}>
              {t}
            </h2>
          )}
          {a && <Sello>{a}</Sello>}
        </div>
      )}
      <Regla className="mt-8" />
      {x && <p className="mt-8 max-w-[62ch] text-lg leading-relaxed whitespace-pre-line text-[var(--k-suave)]">{x}</p>}
    </header>
  );
}

/** Rejilla de celdas sueltas (los boletos y las fotos llevan su propio contorno). */
export function Rejilla({ n, className, children }: { n: number; className?: string; children: ReactNode }) {
  return <ul className={cx("grid gap-5 lg:gap-6", columnas(n), className)}>{children}</ul>;
}

function columnas(n: number) {
  if (n <= 1) return "grid-cols-1";
  if (n === 2) return "grid-cols-1 sm:grid-cols-2";
  if (n === 4) return "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4";
  return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
}

/* ---- imágenes ---- */

/** Foto a sangre dentro de un marco grueso, como un cartel pegado en la pared. */
export function Foto({
  imagen,
  prioridad = false,
  className,
}: {
  imagen: Imagen;
  prioridad?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "relative isolate overflow-hidden rounded-[var(--w-radio)] border-[5px] border-[var(--k-borde)] bg-[var(--w-acento)]",
        className,
      )}
    >
      <img
        src={imagen.url}
        alt={imagen.alt}
        loading={prioridad ? "eager" : "lazy"}
        fetchPriority={prioridad ? "high" : undefined}
        decoding="async"
        className="absolute inset-0 size-full object-cover"
      />
    </div>
  );
}

/* ---- textos ---- */

export function Parrafos({ texto, className }: { texto: string; className?: string }) {
  const parrafos = texto
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (!parrafos.length) return null;
  return (
    <div className={cx("space-y-5", className)}>
      {parrafos.map((p, i) => (
        <p key={i} className="whitespace-pre-line">
          {p}
        </p>
      ))}
    </div>
  );
}

/** Cinta torcida con el eslogan, atravesada bajo la portada. Se para con prefers-reduced-motion. */
export function Cinta({ texto }: { texto: string }) {
  const t = texto.trim();
  if (!t) return null;
  const tira = (oculta: boolean) => (
    <div className="flex shrink-0 items-center" aria-hidden={oculta || undefined}>
      {Array.from({ length: 6 }, (_, i) => (
        <span key={i} className="flex items-center">
          <span className="px-6 whitespace-nowrap sm:px-8">{t}</span>
          <span aria-hidden className="inline-block size-3 shrink-0 rotate-45 bg-current sm:size-4" />
        </span>
      ))}
    </div>
  );
  return (
    <div
      style={{ rotate: "-1.2deg" }}
      className="-mx-4 my-8 overflow-hidden border-y-[5px] border-[var(--w-tinta)] bg-[var(--w-acento)] py-3 text-3xl leading-none text-[var(--w-sobre-acento)] [font-family:var(--w-titulos)] sm:py-4 sm:text-5xl"
    >
      <p className="sr-only">{t}</p>
      <div className="ct-pista flex w-max" aria-hidden>
        {tira(false)}
        {tira(true)}
      </div>
    </div>
  );
}
