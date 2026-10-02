"use client";

import { useEffect } from "react";

/** Alto, en fracción de pantalla, de la franja donde dos secciones se funden. */
const FUNDIDO = 0.45;

type Rgb = [number, number, number];

const aRgb = (hex: string): Rgb => {
  const v = parseInt(hex.replace("#", ""), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
};

const aHex = ([r, g, b]: Rgb) =>
  "#" + [r, g, b].map((c) => Math.round(c).toString(16).padStart(2, "0")).join("");

const mezclar = (a: Rgb, b: Rgb, t: number): Rgb => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

function suave(t: number) {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

/**
 * El color de la página no cambia de golpe al cambiar de sección: cada una
 * declara su fondo (`data-fondo`) y su tono (`data-tono`), y aquí se funden
 * con el scroll en la franja donde se tocan. El resultado se escribe en
 * `--fondo` y `--acento-suave`, así que todo lo que ya los usa (velo del
 * menú, botones, cursivas, lienzos) cambia con la página sin tocarlo.
 *
 * Una sección puede reescribir sus atributos mientras se recorre (Servicios
 * lo hace con cada servicio); se leen en cada fotograma de scroll.
 */
export function FondoVivo() {
  useEffect(() => {
    const raiz = document.documentElement;
    const menos = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let pendiente = 0;
    let ultimoFondo = "";
    let ultimoTono = "";

    const leer = (s: HTMLElement): [Rgb, Rgb] => [aRgb(s.dataset.fondo ?? "#08080a"), aRgb(s.dataset.tono ?? "#e0745e")];

    const actualizar = () => {
      pendiente = 0;
      const secciones = Array.from(document.querySelectorAll<HTMLElement>("[data-fondo]"));
      if (!secciones.length) return;
      const alto = window.innerHeight;
      const centro = alto * 0.5;
      const franja = alto * FUNDIDO;

      let i = secciones.findIndex((s) => {
        const caja = s.getBoundingClientRect();
        return caja.top <= centro && caja.bottom > centro;
      });
      if (i < 0) i = secciones[0].getBoundingClientRect().top > centro ? 0 : secciones.length - 1;

      const caja = secciones[i].getBoundingClientRect();
      let [fondo, tono] = leer(secciones[i]);

      // Cerca de un borde, se mezcla con la vecina. En el borde mismo las
      // dos van al 50 %, así el color es continuo al cruzarlo.
      const haciaAbajo = caja.bottom - centro;
      const haciaArriba = centro - caja.top;
      let vecina = -1;
      let t = 0;
      if (haciaAbajo < franja && secciones[i + 1]) {
        vecina = i + 1;
        t = 0.5 * (1 - haciaAbajo / franja);
      } else if (haciaArriba < franja && secciones[i - 1]) {
        vecina = i - 1;
        t = 0.5 * (1 - haciaArriba / franja);
      }
      if (vecina >= 0 && !menos) {
        const [fondoB, tonoB] = leer(secciones[vecina]);
        const k = suave(t * 2) * 0.5;
        fondo = mezclar(fondo, fondoB, k);
        tono = mezclar(tono, tonoB, k);
      }

      const hexFondo = aHex(fondo);
      const hexTono = aHex(tono);
      // Solo se escribe si cambia: tocar una variable de :root recalcula
      // los estilos de toda la página.
      if (hexFondo !== ultimoFondo) {
        raiz.style.setProperty("--fondo", hexFondo);
        ultimoFondo = hexFondo;
      }
      if (hexTono !== ultimoTono) {
        raiz.style.setProperty("--acento-suave", hexTono);
        ultimoTono = hexTono;
      }
    };

    const alMoverse = () => {
      if (!pendiente) pendiente = requestAnimationFrame(actualizar);
    };

    actualizar();
    window.addEventListener("scroll", alMoverse, { passive: true });
    window.addEventListener("resize", alMoverse);
    // Servicios cambia sus atributos por su cuenta: se le escucha también.
    window.addEventListener("tintaco:tono", alMoverse);
    return () => {
      window.removeEventListener("scroll", alMoverse);
      window.removeEventListener("resize", alMoverse);
      window.removeEventListener("tintaco:tono", alMoverse);
      if (pendiente) cancelAnimationFrame(pendiente);
      raiz.style.removeProperty("--fondo");
      raiz.style.removeProperty("--acento-suave");
    };
  }, []);

  return null;
}
