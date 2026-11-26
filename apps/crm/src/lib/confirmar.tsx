"use client";

import { useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";

type Opciones = {
  titulo: string;
  texto?: string;
  /** Texto del botón que confirma. */
  aceptar?: string;
  cancelar?: string;
  /** Acción que no se puede deshacer: el botón de confirmar va en rojo. */
  peligro?: boolean;
};

/**
 * Sustituye a `window.confirm`: el cuadro del navegador («localhost:3001
 * dice…») no lleva la piel del panel, no se puede traducir el título y
 * asusta. Se monta en su propia raíz al llamarlo, así no hace falta tocar
 * ningún layout, y se desmonta al cerrar. Devuelve true si se confirma.
 */
export function confirmar(opciones: Opciones): Promise<boolean> {
  return new Promise((resolver) => {
    const nodo = document.createElement("div");
    document.body.appendChild(nodo);
    const raiz = createRoot(nodo);
    const cerrar = (respuesta: boolean) => {
      resolver(respuesta);
      // Se desmonta en el siguiente tick para no cortar el render en curso.
      setTimeout(() => {
        raiz.unmount();
        nodo.remove();
      });
    };
    raiz.render(<Dialogo {...opciones} alCerrar={cerrar} />);
  });
}

function Dialogo({
  titulo,
  texto,
  aceptar = "Continuar",
  cancelar = "Cancelar",
  peligro = false,
  alCerrar,
}: Opciones & { alCerrar: (respuesta: boolean) => void }) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const respondido = useRef(false);

  const responder = (respuesta: boolean) => {
    if (respondido.current) return;
    respondido.current = true;
    dialogo.current?.close();
    alCerrar(respuesta);
  };

  // showModal da gratis el foco atrapado, Escape y el fondo inerte.
  useEffect(() => {
    dialogo.current?.showModal();
  }, []);

  return (
    <dialog
      ref={dialogo}
      aria-labelledby="confirmar-titulo"
      aria-describedby={texto ? "confirmar-texto" : undefined}
      // Escape dispara `cancel`: cuenta como «no».
      onCancel={(e) => {
        e.preventDefault();
        responder(false);
      }}
      // Clic en el velo (fuera de la tarjeta) también cancela.
      onClick={(e) => {
        if (e.target === e.currentTarget) responder(false);
      }}
      className="confirmar m-auto w-[min(26rem,calc(100vw-2rem))] rounded-[1.25rem] bg-superficie p-0 text-texto shadow-[0_24px_60px_-20px_rgb(0_0_0/0.35)]"
    >
      {/* Entra desde un 97 % y con opacidad, rápido y sin rebote: es un aviso,
          no un espectáculo. Sin movimiento si el sistema lo pide. */}
      <style>{`
        .confirmar::backdrop{background:rgb(0 0 0/.32)}
        .confirmar[open]{animation:confirmar-entra .18s cubic-bezier(.22,1,.36,1)}
        .confirmar[open]::backdrop{animation:confirmar-velo .18s ease-out}
        @keyframes confirmar-entra{from{opacity:0;transform:scale(.97)}}
        @keyframes confirmar-velo{from{opacity:0}}
        @media (prefers-reduced-motion:reduce){.confirmar[open],.confirmar[open]::backdrop{animation:none}}
      `}</style>
      <div className="grid gap-1.5 px-6 pt-6">
        <h2 id="confirmar-titulo" className="titular text-lg leading-snug">
          {titulo}
        </h2>
        {texto && (
          <p id="confirmar-texto" className="text-sm leading-relaxed text-tenue">
            {texto}
          </p>
        )}
      </div>
      <div className="flex flex-wrap justify-end gap-2 px-6 pb-6 pt-5">
        <button
          type="button"
          autoFocus={peligro}
          onClick={() => responder(false)}
          className="boton-fantasma px-3.5 py-2 text-sm"
        >
          {cancelar}
        </button>
        <button
          type="button"
          // El foco cae en la acción segura solo si es peligrosa; si no, en confirmar.
          autoFocus={!peligro}
          onClick={() => responder(true)}
          className={peligro ? "boton bg-acento text-white" : "boton"}
        >
          {aceptar}
        </button>
      </div>
    </dialog>
  );
}
