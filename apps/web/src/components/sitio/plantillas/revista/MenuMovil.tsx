"use client";

import { useEffect, useId, useRef, useState } from "react";
import { BOTON_PRIMARIO, Enlace, TITULOS } from "./base";

type Destino = { texto: string; destino: string };

/** Menú desplegable para pantallas estrechas. Escape lo cierra y devuelve el foco al botón. */
export function MenuMovil({ enlaces, cta }: { enlaces: Destino[]; cta: Destino | null }) {
  const [abierto, setAbierto] = useState(false);
  const boton = useRef<HTMLButtonElement>(null);
  const id = useId();

  useEffect(() => {
    if (!abierto) return;
    const alPulsar = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setAbierto(false);
        boton.current?.focus();
      }
    };
    document.addEventListener("keydown", alPulsar);
    return () => document.removeEventListener("keydown", alPulsar);
  }, [abierto]);

  if (!enlaces.length && !cta) return null;
  const cerrar = () => setAbierto(false);

  return (
    <div className="md:hidden">
      <button
        ref={boton}
        type="button"
        aria-expanded={abierto}
        aria-controls={id}
        onClick={() => setAbierto((v) => !v)}
        className="-mr-3 inline-flex min-h-12 items-center gap-3 px-3 text-[0.95rem] font-medium text-[var(--w-tinta)]"
      >
        {abierto ? "Cerrar" : "Índice"}
        <span aria-hidden className="relative block h-2.5 w-5">
          <span
            className={`absolute left-0 h-px w-full bg-current transition-transform duration-200 ease-out ${abierto ? "top-1/2 rotate-45" : "top-0"}`}
          />
          <span
            className={`absolute left-0 h-px w-full bg-current transition-transform duration-200 ease-out ${abierto ? "top-1/2 -rotate-45" : "bottom-0"}`}
          />
        </span>
      </button>

      <div
        id={id}
        hidden={!abierto}
        className="r-panel absolute inset-x-0 top-full max-h-[calc(100dvh-4.5rem)] overflow-y-auto border-b border-[var(--w-tinta)] bg-[var(--w-fondo)]"
      >
        <nav aria-label="Principal" className="px-5 pb-8 pt-2 sm:px-10">
          <ul>
            {enlaces.map((e, i) => (
              <li key={`${e.destino}-${i}`} className="border-b border-[var(--w-linea)]">
                <Enlace
                  destino={e.destino}
                  onClick={cerrar}
                  className={`${TITULOS} flex min-h-14 items-center text-[1.875rem] italic leading-tight text-[var(--w-tinta)]`}
                >
                  {e.texto}
                </Enlace>
              </li>
            ))}
          </ul>
          {cta && (
            <Enlace destino={cta.destino} onClick={cerrar} className={`${BOTON_PRIMARIO} mt-8 w-full`}>
              {cta.texto}
            </Enlace>
          )}
        </nav>
      </div>
    </div>
  );
}
