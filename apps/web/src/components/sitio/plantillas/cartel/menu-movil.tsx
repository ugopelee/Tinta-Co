"use client";

import { useEffect, useId, useRef, useState } from "react";
import { TONOS, atributosEnlace, claseBoton, cx } from "./piezas";

type Enlace = { texto: string; destino: string };

/** Menú móvil de Cartel: panel de acento que cae bajo la cabecera. */
export function MenuMovil({ enlaces, cta }: { enlaces: Enlace[]; cta: Enlace | null }) {
  const [abierto, setAbierto] = useState(false);
  const boton = useRef<HTMLButtonElement>(null);
  const id = useId();

  useEffect(() => {
    if (!abierto) return;
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setAbierto(false);
        boton.current?.focus();
      }
    };
    document.addEventListener("keydown", alTeclear);
    return () => document.removeEventListener("keydown", alTeclear);
  }, [abierto]);

  if (!enlaces.length && !cta) return null;
  const cerrar = () => setAbierto(false);

  return (
    <>
      <button
        ref={boton}
        type="button"
        aria-expanded={abierto}
        aria-controls={id}
        onClick={() => setAbierto((v) => !v)}
        className={cx(
          "inline-flex size-12 shrink-0 items-center justify-center rounded-full border-[3px] border-[var(--k-borde)] xl:hidden",
          abierto ? "bg-[var(--k-relleno)] text-[var(--k-sobre-relleno)]" : "bg-[var(--k-fondo)] text-[var(--k-tinta)]",
        )}
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
          {abierto ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
        <span className="sr-only">{abierto ? "Cerrar menú" : "Abrir menú"}</span>
      </button>

      <div
        id={id}
        data-abierto={abierto || undefined}
        style={TONOS.acento}
        className={cx(
          "ct-panel absolute inset-x-0 top-full max-h-[calc(100dvh-4.5rem)] overflow-y-auto xl:hidden",
          "border-b-[6px] border-[var(--w-tinta)] bg-[var(--k-fondo)] text-[var(--k-tinta)]",
        )}
      >
        <nav aria-label="Menú" className="px-4 pt-2 pb-8 sm:px-6">
          <ul>
            {enlaces.map((e, i) => (
              <li key={`${e.destino}-${i}`} className="border-b-[3px] border-[var(--k-borde)]">
                <a
                  {...atributosEnlace(e.destino)}
                  onClick={cerrar}
                  className="block py-4 [font-family:var(--w-titulos)] text-[clamp(2.25rem,11vw,3.5rem)] leading-none [overflow-wrap:anywhere]"
                >
                  {e.texto}
                </a>
              </li>
            ))}
          </ul>
          {cta && (
            <a {...atributosEnlace(cta.destino)} onClick={cerrar} className={cx(claseBoton("lleno"), "mt-8 w-full")}>
              {cta.texto}
            </a>
          )}
        </nav>
      </div>
    </>
  );
}
