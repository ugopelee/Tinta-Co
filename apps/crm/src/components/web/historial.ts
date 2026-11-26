"use client";

import { useCallback, useReducer } from "react";
import type { Seccion, Sitio } from "@tinta/compartido/web/esquema";

/**
 * Historial en memoria para deshacer/rehacer. Los cambios con la misma `clave`
 * seguidos (escribir en un campo) se agrupan en un solo paso si llegan con
 * menos de un segundo entre sí: Ctrl+Z deshace la palabra, no la letra.
 */

const LIMITE = 100;
const AGRUPAR_MS = 1000;

type Estado = { pasado: Sitio[]; presente: Sitio; futuro: Sitio[]; clave: string | null; en: number };

type Accion =
  | { tipo: "cambiar"; f: (s: Sitio) => Sitio; clave?: string; en: number }
  | { tipo: "deshacer" }
  | { tipo: "rehacer" };

function reductor(h: Estado, a: Accion): Estado {
  switch (a.tipo) {
    case "cambiar": {
      const siguiente = a.f(h.presente);
      if (siguiente === h.presente) return h;
      if (a.clave && a.clave === h.clave && a.en - h.en < AGRUPAR_MS) {
        return { ...h, presente: siguiente, futuro: [], en: a.en };
      }
      return { pasado: [...h.pasado, h.presente].slice(-LIMITE), presente: siguiente, futuro: [], clave: a.clave ?? null, en: a.en };
    }
    case "deshacer": {
      if (!h.pasado.length) return h;
      return { pasado: h.pasado.slice(0, -1), presente: h.pasado[h.pasado.length - 1], futuro: [h.presente, ...h.futuro], clave: null, en: 0 };
    }
    case "rehacer": {
      if (!h.futuro.length) return h;
      return { pasado: [...h.pasado, h.presente], presente: h.futuro[0], futuro: h.futuro.slice(1), clave: null, en: 0 };
    }
  }
}

export type Cambiar = (f: (s: Sitio) => Sitio, clave?: string) => void;

export function useHistorial(inicial: Sitio) {
  const [h, despachar] = useReducer(reductor, inicial, (s): Estado => ({ pasado: [], presente: s, futuro: [], clave: null, en: 0 }));
  const cambiar = useCallback<Cambiar>((f, clave) => despachar({ tipo: "cambiar", f, clave, en: Date.now() }), []);
  const deshacer = useCallback(() => despachar({ tipo: "deshacer" }), []);
  const rehacer = useCallback(() => despachar({ tipo: "rehacer" }), []);
  return { sitio: h.presente, cambiar, deshacer, rehacer, puedeDeshacer: h.pasado.length > 0, puedeRehacer: h.futuro.length > 0 };
}

/* ------------------------------------------------------------------
   Operaciones puras sobre el sitio
   ------------------------------------------------------------------ */

export function conSeccion(s: Sitio, id: string, f: (x: Seccion) => Seccion): Sitio {
  return { ...s, secciones: s.secciones.map((x) => (x.id === id ? f(x) : x)) };
}

export function mover<T>(lista: T[], desde: number, hasta: number): T[] {
  if (desde === hasta || hasta < 0 || hasta >= lista.length) return lista;
  const copia = lista.slice();
  const [x] = copia.splice(desde, 1);
  copia.splice(hasta, 0, x);
  return copia;
}

/** Título legible de una sección para listas y anuncios. */
export function tituloDe(x: Seccion): string {
  const t = "titulo" in x ? x.titulo : "";
  return t.replace(/\s*\n\s*/g, " ").trim();
}
