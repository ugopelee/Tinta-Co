"use client";

import { useId, type ComponentProps, type ReactNode } from "react";
import {
  CalendarCheck,
  CalendarDays,
  Layers,
  Sparkles,
  CircleHelp,
  FileText,
  Flag,
  Hash,
  Images,
  ListChecks,
  Mail,
  MapPin,
  Megaphone,
  Palette,
  Square,
  Tag,
  TriangleAlert,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { cn } from "./ui/cn";
import { FAMILIA_TEXTO, FAMILIA_TITULOS } from "@tinta/compartido/web/tema";
import type { IdFuenteTexto, IdFuenteTitulos } from "@tinta/compartido/web/esquema";

/* ------------------------------------------------------------------
   Iconos del catálogo de secciones. El catálogo da un nombre (de lucide o,
   por herencia, de Phosphor); un nombre desconocido cae en un cuadrado en
   vez de romper el panel.
   ------------------------------------------------------------------ */

const ICONOS: Record<string, LucideIcon> = {
  Flag,
  FlagBanner: Flag,
  FileText,
  Article: FileText,
  ListChecks,
  Hash,
  Images,
  Image: Images,
  Tag,
  MapPin,
  CalendarDays,
  CalendarBlank: CalendarDays,
  CircleHelp,
  Question: CircleHelp,
  Megaphone,
  Mail,
  EnvelopeSimple: Mail,
  Zap,
  Sparkles,
  Layers,
  CalendarCheck,
  Palette,
};

export function IconoSeccion({ nombre, className = "size-[18px]" }: { nombre: string; className?: string }) {
  const I = ICONOS[nombre] ?? Square;
  return <I className={className} aria-hidden />;
}

/* ------------------------------------------------------------------
   Controles de texto (el CRM de Tinta no trae los de ice-gym)
   ------------------------------------------------------------------ */

const CLASE_CAMPO =
  "w-full min-w-0 rounded-lg border border-borde-campo bg-superficie px-2.5 text-base text-texto outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-tenue focus-visible:border-texto focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-superficie-alta disabled:opacity-60 aria-invalid:border-acento aria-invalid:ring-3 aria-invalid:ring-acento/20 md:text-sm";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(CLASE_CAMPO, "h-8 py-1", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(CLASE_CAMPO, "flex field-sizing-content min-h-16 py-2", className)} {...props} />;
}

/* ------------------------------------------------------------------
   Fuentes de la web, para enseñar cada nombre en su propia letra.
   Las ocho familias llegan como --fw-* desde el layout de /web.
   ------------------------------------------------------------------ */

export const LETRA_TITULOS: Record<IdFuenteTitulos, string> = {
  ...FAMILIA_TITULOS,
};
export const LETRA_TEXTO: Record<IdFuenteTexto, string> = {
  ...FAMILIA_TEXTO,
};

/* ------------------------------------------------------------------
   Estructura del panel
   ------------------------------------------------------------------ */

/** Bloque del panel: título pequeño y aire; sin cajas ni reglas. */
export function Grupo({
  titulo,
  descripcion,
  extra,
  children,
}: {
  titulo: string;
  descripcion?: ReactNode;
  extra?: ReactNode;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h3 id={id} className="text-[0.8125rem] font-semibold text-texto">
            {titulo}
          </h3>
          {descripcion && <p className="text-[0.8125rem] leading-snug text-tenue">{descripcion}</p>}
        </div>
        {extra}
      </div>
      {children}
    </section>
  );
}

/** Cuenta de caracteres: avisa con texto (no sólo color) al pasarse. */
export function Contador({ id, actual, max, recomendado = false }: { id: string; actual: number; max: number; recomendado?: boolean }) {
  const pasado = actual > max;
  const cerca = !pasado && actual > max * 0.9;
  return (
    <span id={id} className={`text-xs tabular-nums ${pasado ? "font-medium text-acento" : cerca ? "text-texto" : "text-tenue"}`}>
      {actual}/{max}
      {pasado && <span>{recomendado ? " · más largo de lo recomendado" : " · demasiado largo"}</span>}
    </span>
  );
}

/** Etiqueta + control + ayuda + contador, todo enlazado para el lector de pantalla. */
export function Campo({
  etiqueta,
  ayuda,
  contador,
  htmlFor,
  idAyuda,
  children,
}: {
  etiqueta: string;
  ayuda?: ReactNode;
  contador?: ReactNode;
  htmlFor: string;
  idAyuda?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={htmlFor} className="text-[0.8125rem] font-medium text-texto">
          {etiqueta}
        </label>
        {contador}
      </div>
      {children}
      {ayuda && (
        <p id={idAyuda} className="text-xs leading-snug text-tenue">
          {ayuda}
        </p>
      )}
    </div>
  );
}

export function Aviso({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <p id={id} className="flex items-start gap-1.5 text-xs leading-snug text-texto">
      <TriangleAlert className="mt-px size-3.5 shrink-0 text-amarillo" aria-hidden />
      <span>{children}</span>
    </p>
  );
}

/**
 * Control segmentado con radios nativos: flechas para moverse, foco visible en
 * la opción y el estado elegido marcado por relleno y peso, no sólo por color.
 */
export function Segmentado<T extends string>({
  etiqueta,
  opciones,
  valor,
  onChange,
  ocultarEtiqueta = false,
  className = "",
}: {
  etiqueta: string;
  opciones: { valor: T; texto: ReactNode; aria?: string }[];
  valor: T;
  onChange: (v: T) => void;
  ocultarEtiqueta?: boolean;
  className?: string;
}) {
  const nombre = useId();
  return (
    <fieldset className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      <legend className={ocultarEtiqueta ? "sr-only" : "mb-1.5 text-[0.8125rem] font-medium text-texto"}>{etiqueta}</legend>
      <div className="flex rounded-lg bg-superficie-alta p-0.5">
        {opciones.map((o) => (
          <label key={o.valor} className="relative flex min-w-0 flex-1 cursor-pointer">
            <input
              type="radio"
              name={nombre}
              value={o.valor}
              checked={valor === o.valor}
              onChange={() => onChange(o.valor)}
              aria-label={o.aria}
              className="peer sr-only"
            />
            <span className="flex h-7 w-full items-center justify-center gap-1.5 truncate rounded-md px-2 text-[0.8125rem] font-medium text-tenue transition-[background-color,color] duration-150 hover:text-texto peer-checked:bg-superficie peer-checked:font-semibold peer-checked:text-texto peer-checked:shadow-sm peer-focus-visible:outline-2 peer-focus-visible:outline-offset-1 peer-focus-visible:outline-texto [&_svg]:size-4 [&_svg]:shrink-0">
              {o.texto}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** Lista de opciones en columna (fuentes, plantillas): radios nativos con una marca de elegido. */
export function ListaOpciones<T extends string>({
  etiqueta,
  opciones,
  valor,
  onChange,
}: {
  etiqueta: string;
  opciones: { valor: T; contenido: ReactNode }[];
  valor: T;
  onChange: (v: T) => void;
}) {
  const nombre = useId();
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 text-[0.8125rem] font-medium text-texto">{etiqueta}</legend>
      <div className="flex flex-col gap-0.5">
        {opciones.map((o) => {
          const on = valor === o.valor;
          return (
            <label key={o.valor} className="relative flex cursor-pointer">
              <input
                type="radio"
                name={nombre}
                value={o.valor}
                checked={on}
                onChange={() => onChange(o.valor)}
                className="peer sr-only"
              />
              <span
                className={`flex min-h-10 w-full items-center gap-3 rounded-lg px-2.5 py-1.5 transition-colors duration-150 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-[-2px] peer-focus-visible:outline-texto ${
                  on ? "bg-superficie-alta text-texto" : "text-texto hover:bg-superficie-alta"
                }`}
              >
                <span
                  className={`grid size-4 shrink-0 place-items-center rounded-full border-2 ${on ? "border-texto" : "border-borde-campo"}`}
                  aria-hidden
                >
                  {on && <span className="size-1.5 rounded-full bg-texto" />}
                </span>
                <span className="min-w-0 flex-1">{o.contenido}</span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Botón de icono con nombre accesible y pista al pasar el ratón. */
export const claseBotonIcono =
  "grid size-8 shrink-0 place-items-center rounded-lg text-tenue transition-[background-color,color,transform] duration-150 hover:bg-superficie-alta hover:text-texto active:scale-[0.96] disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-[17px]";
