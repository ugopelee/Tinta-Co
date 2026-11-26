"use client";

import { useEffect, useRef, useState } from "react";
import type { MensajeEditor, MensajeVista, Sitio } from "@tinta/compartido/web/esquema";
import { normalizarSitio } from "@tinta/compartido/web/catalogo";
import type { DatosWeb } from "./contrato";
import { RenderSitio } from "./RenderSitio";

/** Origen del CRM: el único que puede hablar con esta página y al que se le contesta. */
const ORIGEN_CRM = process.env.NEXT_PUBLIC_URL_CRM ?? "http://localhost:3001";

/**
 * Lado iframe del editor. El CRM es otro origen, así que se valida
 * `event.origin` y se contesta solo a ese origen, nunca con "*". Protocolo:
 *  ← {tipo:"lista"}             al montar, para que el editor mande el sitio
 *  → {tipo:"sitio", sitio}      re-pinta
 *  → {tipo:"enfocar", id}       hace scroll a la sección y la resalta
 *  ← {tipo:"elegir", id}        clic en una sección
 * Los enlaces no navegan: los de ancla hacen scroll, el resto no hace nada.
 */
export function VistaPrevia({ datos }: { datos: DatosWeb }) {
  const [sitio, setSitio] = useState<Sitio | null>(null);
  const [enfocada, setEnfocada] = useState<string | null>(null);
  const raiz = useRef<HTMLDivElement>(null);
  const [suelta, setSuelta] = useState(false);

  useEffect(() => {
    const enviar = (m: MensajeEditor) => window.parent.postMessage(m, ORIGEN_CRM);

    const alMensaje = (e: MessageEvent<MensajeVista>) => {
      if (e.origin !== ORIGEN_CRM || !e.data || typeof e.data !== "object") return;
      if (e.data.tipo === "sitio") setSitio(normalizarSitio(e.data.sitio));
      if (e.data.tipo === "enfocar") {
        const id = e.data.id;
        setEnfocada(id);
        if (id) {
          const el = raiz.current?.querySelector(`[data-seccion="${CSS.escape(id)}"]`);
          el?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    };

    const alClic = (e: MouseEvent) => {
      const destino = e.target as HTMLElement;
      // El formulario sí se puede probar (no se envía en modo vista).
      if (destino.closest("input, select, textarea, label, summary, [data-vista-libre]")) return;
      const enlace = destino.closest("a");
      if (enlace) {
        e.preventDefault();
        const href = enlace.getAttribute("href") ?? "";
        if (href.startsWith("#") && href.length > 1) {
          document.getElementById(decodeURIComponent(href.slice(1)))?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
      const seccion = destino.closest<HTMLElement>("[data-seccion]");
      if (seccion?.dataset.seccion && !destino.closest("button")) {
        setEnfocada(seccion.dataset.seccion);
        enviar({ tipo: "elegir", id: seccion.dataset.seccion });
      }
    };

    window.addEventListener("message", alMensaje);
    document.addEventListener("click", alClic, true);
    // Abierta fuera del editor: se avisa tras un instante (en un callback, no en el cuerpo del efecto).
    const reloj = window.parent === window ? window.setTimeout(() => setSuelta(true), 0) : undefined;
    if (!reloj) enviar({ tipo: "lista" });
    return () => {
      window.clearTimeout(reloj);
      window.removeEventListener("message", alMensaje);
      document.removeEventListener("click", alClic, true);
    };
  }, []);

  if (!sitio) {
    return (
      <div className="grid min-h-dvh place-items-center bg-[#08080a] p-6 text-center text-sm text-[#8d8d98]">
        {!suelta ? "Cargando vista previa…" : "Esta página solo funciona dentro del editor de la web del CRM."}
      </div>
    );
  }

  return (
    <div ref={raiz}>
      {enfocada && (
        <style>{`[data-seccion="${enfocada.replace(/[^\w-]/g, "")}"]{outline:2px solid var(--w-acento-tinta);outline-offset:-2px}`}</style>
      )}
      <style>{`[data-seccion]{cursor:pointer}[data-seccion]:hover{outline:1px dashed var(--w-tinta-2);outline-offset:-1px}`}</style>
      <RenderSitio sitio={sitio} datos={datos} vista />
    </div>
  );
}
