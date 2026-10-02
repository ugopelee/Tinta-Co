"use client";

import { useEffect, useRef, type RefObject } from "react";
import { aRgb, colorVivo, leerVariable, montarLienzo, prefiereMenosMovimiento, ruido } from "./puntos/nucleo";

type Gota = { x: number; y: number; vx: number; vy: number; vida: number; r: number };

/**
 * Una línea hecha a pulso que la aguja va entintando según el progreso del
 * scroll. Por delante queda el calco punteado; por detrás, tinta con el
 * grosor irregular de un trazo real y alguna gota que salta al avanzar.
 */
export function HiloTinta({
  progreso,
  paradas,
  className = "",
}: {
  /** 0 → 1, lo escribe quien controla el scroll. */
  progreso: RefObject<number>;
  paradas: number;
  className?: string;
}) {
  const referencia = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const lienzo = referencia.current;
    if (!lienzo) return;

    const quieto = prefiereMenosMovimiento();
    const hueso = aRgb(leerVariable("texto", "#eceae4"));
    const tono = colorVivo("acento-suave", "#e0745e");
    const rgba = (c: number[], a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

    let punta = progreso.current ?? 0;
    let velocidad = 0;
    const gotas: Gota[] = [];

    // El pulso de la línea: siempre el mismo trazo, no cambia al redimensionar.
    const alturaEn = (f: number, alto: number) =>
      alto * 0.5 + (ruido(f * 6, 1.3) - 0.5) * alto * 0.34 + Math.sin(f * Math.PI * 3) * alto * 0.06;

    const { desmontar, repintar } = montarLienzo(lienzo, {
      alPintar: (ctx, t, dt, { ancho, alto }) => {
        const acento = tono();
        const objetivo = progreso.current ?? 0;
        const antes = punta;
        punta += (objetivo - punta) * (quieto ? 1 : Math.min(1, dt * 7));
        velocidad = (punta - antes) / Math.max(dt, 0.001);

        ctx.clearRect(0, 0, ancho, alto);
        const margen = 8;
        const util = ancho - margen * 2;
        const pasos = Math.max(40, Math.round(util / 4));

        // Calco: la línea entera, punteada y apagada.
        ctx.fillStyle = rgba(hueso, 0.16);
        for (let i = 0; i <= pasos; i += 2) {
          const f = i / pasos;
          ctx.fillRect(margen + f * util, alturaEn(f, alto), 1.2, 1.2);
        }

        // Tinta: segmentos cortos con grosor que respira.
        const hasta = Math.round(punta * pasos);
        ctx.lineCap = "round";
        ctx.strokeStyle = rgba(hueso, 0.92);
        for (let i = 0; i < hasta; i++) {
          const f0 = i / pasos;
          const f1 = (i + 1) / pasos;
          ctx.lineWidth = 1.1 + ruido(i * 0.18, 4.2) * 1.6;
          ctx.beginPath();
          ctx.moveTo(margen + f0 * util, alturaEn(f0, alto));
          ctx.lineTo(margen + f1 * util, alturaEn(f1, alto));
          ctx.stroke();
        }

        // Paradas: una por servicio, rellenas cuando la tinta ya ha pasado.
        for (let k = 0; k < paradas; k++) {
          const f = paradas > 1 ? k / (paradas - 1) : 0;
          const x = margen + f * util;
          const y = alturaEn(f, alto);
          const pasada = punta >= f - 0.002;
          ctx.beginPath();
          ctx.arc(x, y, pasada ? 3.4 : 3, 0, Math.PI * 2);
          if (pasada) {
            ctx.fillStyle = rgba(hueso, 1);
            ctx.fill();
          } else {
            ctx.fillStyle = rgba([8, 8, 10], 1);
            ctx.fill();
            ctx.strokeStyle = rgba(hueso, 0.35);
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }

        // La aguja: tiembla más cuanto más rápido va.
        const px = margen + punta * util;
        const temblor = quieto ? 0 : Math.min(1, Math.abs(velocidad) * 1.5);
        const py = alturaEn(punta, alto) + Math.sin(t * 90) * temblor * 1.4;

        if (!quieto && temblor > 0.05 && Math.random() < temblor * 0.9) {
          gotas.push({
            x: px,
            y: py,
            vx: -Math.sign(velocidad) * (10 + Math.random() * 30),
            vy: (Math.random() - 0.5) * 50,
            vida: 1,
            r: 0.6 + Math.random() * 1.1,
          });
        }
        for (let i = gotas.length - 1; i >= 0; i--) {
          const g = gotas[i];
          g.vida -= dt * 1.6;
          if (g.vida <= 0) {
            gotas.splice(i, 1);
            continue;
          }
          g.x += g.vx * dt;
          g.y += g.vy * dt;
          g.vx *= 0.9;
          g.vy *= 0.9;
          ctx.fillStyle = rgba(hueso, g.vida * 0.7);
          ctx.fillRect(g.x, g.y, g.r, g.r);
        }

        const halo = ctx.createRadialGradient(px, py, 0, px, py, 16);
        halo.addColorStop(0, rgba(acento, 0.55));
        halo.addColorStop(1, rgba(acento, 0));
        ctx.fillStyle = halo;
        ctx.fillRect(px - 16, py - 16, 32, 32);
        ctx.beginPath();
        ctx.arc(px, py, 2.6, 0, Math.PI * 2);
        ctx.fillStyle = rgba(acento, 1);
        ctx.fill();
      },
    });

    const alDesplazar = () => repintar();
    if (quieto) window.addEventListener("scroll", alDesplazar, { passive: true });
    return () => {
      desmontar();
      window.removeEventListener("scroll", alDesplazar);
    };
  }, [progreso, paradas]);

  return <canvas ref={referencia} aria-hidden className={`block ${className}`} />;
}
