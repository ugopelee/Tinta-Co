"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cx, esExterno } from "./comun";
import s from "./lamina.module.css";

type Enlace = { texto: string; destino: string };

/**
 * Menú desplegable para móvil y tableta. Es un disclosure (no un modal):
 * se abre bajo la cabecera, Esc lo cierra y devuelve el foco al botón,
 * y elegir un enlace también lo cierra.
 */
export function MenuMovil({ enlaces, reserva }: { enlaces: Enlace[]; reserva: boolean }) {
  const [abierto, setAbierto] = useState(false);
  const boton = useRef<HTMLButtonElement>(null);
  const id = useId();

  useEffect(() => {
    if (!abierto) return;
    const alPulsar = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setAbierto(false);
      boton.current?.focus();
    };
    window.addEventListener("keydown", alPulsar);
    return () => window.removeEventListener("keydown", alPulsar);
  }, [abierto]);

  if (!enlaces.length && !reserva) return null;

  return (
    <div className="lg:hidden">
      <button
        ref={boton}
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        aria-controls={id}
        aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
        className="relative -mr-2 flex size-11 items-center justify-center text-[var(--w-tinta)]"
      >
        <span aria-hidden className={cx(s.raya, "absolute h-px w-6 bg-current", abierto ? "rotate-45" : "-translate-y-[5px]")} />
        <span aria-hidden className={cx(s.raya, "absolute h-px w-6 bg-current", abierto ? "-rotate-45" : "translate-y-[5px]")} />
      </button>

      {abierto && (
        <div
          id={id}
          className={cx(
            s.panelMovil,
            "absolute inset-x-0 top-full max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-[var(--w-linea)] bg-[var(--w-fondo)]",
          )}
        >
          <nav aria-label="Menú" className="px-4 pb-8 pt-2 sm:px-6">
            <ul>
              {enlaces.map((l, i) => (
                <li key={`${l.destino}-${i}`} className="border-b border-[var(--w-linea)]">
                  <a
                    href={l.destino}
                    {...(esExterno(l.destino) ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    onClick={() => setAbierto(false)}
                    className={cx(s.titular, "flex items-baseline gap-4 py-3 text-[length:calc(var(--l-escala)*2.25rem)] text-[var(--w-tinta)]")}
                  >
                    <span className={cx(s.mono, "text-[0.75rem] text-[var(--w-acento-tinta)]")}>Nº {String(i + 1).padStart(2, "0")}</span>
                    <span className="min-w-0">{l.texto}</span>
                  </a>
                </li>
              ))}
            </ul>
            {reserva && (
              <a
                href="#reserva"
                onClick={() => setAbierto(false)}
                className={cx(
                  s.mono,
                  s.boton,
                  "mt-6 flex min-h-14 items-center justify-between border border-[var(--w-acento)] bg-[var(--w-acento)] px-5 text-[0.875rem] text-[var(--w-sobre-acento)]",
                )}
              >
                Reservar cita
              </a>
            )}
          </nav>
        </div>
      )}
    </div>
  );
}
