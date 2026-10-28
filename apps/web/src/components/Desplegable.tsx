"use client";

import { useEffect, useId, useRef, useState } from "react";

export type OpcionDesplegable = { valor: string; texto: string; desactivada?: boolean };

/**
 * Selector propio en lugar del `<select>` nativo, cuya lista abierta la pinta
 * el sistema operativo y no se puede tematizar. Manda su valor al formulario
 * con un input oculto, así que las server actions no notan la diferencia.
 */
export function Desplegable({
  id,
  name,
  opciones,
  value,
  onChange,
  defaultValue = "",
  required,
}: {
  id: string;
  name: string;
  opciones: OpcionDesplegable[];
  value?: string;
  onChange?: (valor: string) => void;
  defaultValue?: string;
  required?: boolean;
}) {
  const [interno, setInterno] = useState(defaultValue);
  const valor = value ?? interno;
  const [abierto, setAbierto] = useState(false);
  const [activa, setActiva] = useState(0);
  const raiz = useRef<HTMLDivElement>(null);
  const idLista = useId();

  const elegida = opciones.find((o) => o.valor === valor);
  const indiceElegido = Math.max(
    0,
    opciones.findIndex((o) => o.valor === valor),
  );

  const elegir = (nuevo: string) => {
    setInterno(nuevo);
    onChange?.(nuevo);
    setAbierto(false);
  };

  const abrir = () => {
    setActiva(indiceElegido);
    setAbierto(true);
  };

  // Cierra al pulsar fuera.
  useEffect(() => {
    if (!abierto) return;
    const fuera = (evento: PointerEvent) => {
      if (!raiz.current?.contains(evento.target as Node)) setAbierto(false);
    };
    document.addEventListener("pointerdown", fuera);
    return () => document.removeEventListener("pointerdown", fuera);
  }, [abierto]);

  // reset() del formulario devuelve el valor inicial.
  useEffect(() => {
    const formulario = raiz.current?.closest("form");
    if (!formulario) return;
    const volver = () => setInterno(defaultValue);
    formulario.addEventListener("reset", volver);
    return () => formulario.removeEventListener("reset", volver);
  }, [defaultValue]);

  // Mantiene la opción activa a la vista al moverse con el teclado.
  useEffect(() => {
    if (!abierto) return;
    document.getElementById(`${idLista}-${activa}`)?.scrollIntoView({ block: "nearest" });
  }, [abierto, activa, idLista]);

  const mover = (paso: number) => {
    let i = activa;
    for (let n = 0; n < opciones.length; n++) {
      i = (i + paso + opciones.length) % opciones.length;
      if (!opciones[i].desactivada) break;
    }
    setActiva(i);
  };

  const alTeclear = (evento: React.KeyboardEvent) => {
    if (evento.key === "Escape") {
      setAbierto(false);
    } else if (evento.key === "ArrowDown" || evento.key === "ArrowUp") {
      evento.preventDefault();
      if (!abierto) abrir();
      else mover(evento.key === "ArrowDown" ? 1 : -1);
    } else if (evento.key === "Enter" || evento.key === " ") {
      evento.preventDefault();
      if (!abierto) abrir();
      else if (!opciones[activa]?.desactivada) elegir(opciones[activa].valor);
    } else if (evento.key === "Tab") {
      setAbierto(false);
    }
  };

  return (
    <div ref={raiz} className="relative">
      {/* Lleva el valor al formulario y deja que `required` valide. */}
      <input
        name={name}
        value={valor}
        required={required}
        onChange={() => {}}
        tabIndex={-1}
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
      />

      <button
        id={id}
        type="button"
        role="combobox"
        aria-expanded={abierto}
        aria-controls={idLista}
        aria-haspopup="listbox"
        aria-activedescendant={abierto && activa >= 0 ? `${idLista}-${activa}` : undefined}
        onClick={() => (abierto ? setAbierto(false) : abrir())}
        onKeyDown={alTeclear}
        className={`flex w-full items-center justify-between gap-3 rounded-2xl border bg-white/[0.03] px-4 py-3 text-left text-sm transition-colors duration-200 hover:border-tenue focus-visible:border-acento-suave/70 ${
          abierto ? "border-acento-suave/70 bg-white/[0.05]" : "border-borde-campo"
        }`}
      >
        <span className={`truncate ${elegida && elegida.valor !== "" ? "text-texto" : "text-tenue"}`}>
          {elegida?.texto ?? "Elige uno"}
        </span>
        <svg
          viewBox="0 0 12 12"
          aria-hidden
          className={`h-3 w-3 shrink-0 text-tenue transition-transform duration-300 ${abierto ? "rotate-180" : ""}`}
        >
          <path d="M2 4.5 6 8.5l4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <ul
        id={idLista}
        role="listbox"
        aria-labelledby={id}
        className={`absolute left-0 right-0 z-30 mt-2 max-h-64 origin-top overflow-y-auto rounded-2xl border border-white/10 bg-fondo/95 p-1.5 shadow-[0_18px_50px_-12px_rgba(0,0,0,0.7)] backdrop-blur-xl transition-[opacity,transform] duration-200 ease-[var(--ease-salida)] ${
          abierto ? "visible translate-y-0 scale-100 opacity-100" : "invisible -translate-y-1 scale-[0.98] opacity-0"
        }`}
      >
        {opciones.map((opcion, i) => {
          const marcada = opcion.valor === valor;
          return (
            <li
              key={opcion.valor}
              id={`${idLista}-${i}`}
              role="option"
              aria-selected={marcada}
              aria-disabled={opcion.desactivada}
              onPointerEnter={() => !opcion.desactivada && setActiva(i)}
              onClick={() => !opcion.desactivada && elegir(opcion.valor)}
              className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm transition-colors duration-150 ${
                opcion.desactivada
                  ? "cursor-default text-tenue/50"
                  : i === activa
                    ? "bg-acento/15 text-texto"
                    : marcada
                      ? "text-texto"
                      : "text-tenue"
              }`}
            >
              <span className="truncate">{opcion.texto}</span>
              {marcada && (
                <svg viewBox="0 0 12 12" aria-hidden className="h-3 w-3 shrink-0 text-acento-suave">
                  <path d="m2.5 6.5 2.5 2.5 4.5-5.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
