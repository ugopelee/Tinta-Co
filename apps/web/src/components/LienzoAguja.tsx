"use client";

import { useEffect, useRef, type RefObject } from "react";
import { colorVivo, leerVariable, montarLienzo, prefiereMenosMovimiento } from "./puntos/nucleo";

/** Proporción de la lámina: alto / ancho. */
const PROPORCION = 1.1;
/** Paso de muestreo, en px de pantalla, al buscar bordes para la aguja. */
const PASO = 3;
/** Alto del borde húmedo entre lo entintado y el calco. */
const DIFUMINADO = 36;

type Pieza = {
  /** La foto recortada a la lámina. */
  foto: HTMLCanvasElement;
  /** Sus contornos en el violeta del papel de calco. */
  calco: HTMLCanvasElement;
  /** Por fila muestreada, las columnas con borde marcado. */
  filas: number[][];
};

type Gota = { x: number; y: number; vx: number; vy: number; vida: number };

/**
 * Dibuja la imagen cubriendo el rectángulo. Lo que sobra se recorta
 * alrededor de `foco`, para que el tatuaje quede dentro de la lámina.
 */
function cubrir(
  ctx: CanvasRenderingContext2D,
  imagen: HTMLImageElement,
  ancho: number,
  alto: number,
  foco: [number, number] = [0.5, 0.5],
) {
  const escala = Math.max(ancho / imagen.naturalWidth, alto / imagen.naturalHeight);
  const w = imagen.naturalWidth * escala;
  const h = imagen.naturalHeight * escala;
  const x = Math.min(0, Math.max(ancho - w, ancho / 2 - foco[0] * w));
  const y = Math.min(0, Math.max(alto - h, alto / 2 - foco[1] * h));
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(imagen, x, y, w, h);
}

/**
 * Detección de bordes (Sobel) sobre la luminancia: de la foto sale el calco
 * y el recorrido de la aguja. Devuelve la magnitud normalizada 0–1.
 */
function bordes(datos: Uint8ClampedArray, ancho: number, alto: number) {
  const gris = new Float32Array(ancho * alto);
  for (let i = 0; i < ancho * alto; i++) {
    gris[i] = (datos[i * 4] * 0.299 + datos[i * 4 + 1] * 0.587 + datos[i * 4 + 2] * 0.114) / 255;
  }
  const salida = new Float32Array(ancho * alto);
  let maximo = 0;
  for (let y = 1; y < alto - 1; y++) {
    for (let x = 1; x < ancho - 1; x++) {
      const i = y * ancho + x;
      const gx =
        -gris[i - ancho - 1] - 2 * gris[i - 1] - gris[i + ancho - 1] +
        gris[i - ancho + 1] + 2 * gris[i + 1] + gris[i + ancho + 1];
      const gy =
        -gris[i - ancho - 1] - 2 * gris[i - ancho] - gris[i - ancho + 1] +
        gris[i + ancho - 1] + 2 * gris[i + ancho] + gris[i + ancho + 1];
      const m = Math.sqrt(gx * gx + gy * gy);
      salida[i] = m;
      if (m > maximo) maximo = m;
    }
  }
  if (maximo > 0) for (let i = 0; i < salida.length; i++) salida[i] /= maximo;
  return salida;
}

/**
 * La pieza elegida aparece primero como calco violeta, igual que el stencil
 * sobre la piel, y la aguja la va entintando de arriba abajo según el
 * scroll: por encima de ella ya se ve la foto real. Al cambiar de pieza, la
 * anterior se apaga y llega el calco de la siguiente.
 */
export function LienzoAguja({
  imagenes,
  focos,
  activa,
  entintado,
  className = "",
}: {
  imagenes: string[];
  /** Punto de cada foto que el recorte conserva. */
  focos?: [number, number][];
  /** Índice de la pieza en pantalla. */
  activa: RefObject<number>;
  /** 0 → 1: cuánto de la pieza activa está ya tatuado. */
  entintado: RefObject<number>;
  className?: string;
}) {
  const referencia = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const lienzo = referencia.current;
    if (!lienzo) return;

    const quieto = prefiereMenosMovimiento();
    const hueso = leerVariable("texto", "#eceae4");
    const tono = colorVivo("acento-suave", "#e0745e");
    let acento = tono();
    const rgbaAcento = (a: number) => `rgba(${acento[0]},${acento[1]},${acento[2]},${a})`;

    const piezas: (Pieza | null)[] = imagenes.map(() => null);
    const fuentes: (HTMLImageElement | null)[] = imagenes.map(() => null);
    let anchoPieza = 0;
    let vivo = true;
    let pendientes: number[] = [];
    let ocioso = 0;
    // Se conecta al montar el lienzo; hasta entonces no hay nada que repintar.
    let repintar = () => {};

    const rasterizar = (indice: number) => {
      const imagen = fuentes[indice];
      if (!imagen || !anchoPieza) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const ancho = Math.round(anchoPieza * dpr);
      const alto = Math.round(anchoPieza * PROPORCION * dpr);

      const foto = document.createElement("canvas");
      foto.width = ancho;
      foto.height = alto;
      const cf = foto.getContext("2d")!;
      cubrir(cf, imagen, ancho, alto, focos?.[indice]);

      // Los bordes se calculan a resolución de pantalla (sin DPR): basta y
      // cuesta la cuarta parte.
      const bw = Math.round(anchoPieza);
      const bh = Math.round(anchoPieza * PROPORCION);
      const pequena = document.createElement("canvas");
      pequena.width = bw;
      pequena.height = bh;
      const cp = pequena.getContext("2d", { willReadFrequently: true })!;
      cubrir(cp, imagen, bw, bh, focos?.[indice]);
      const magnitud = bordes(cp.getImageData(0, 0, bw, bh).data, bw, bh);

      const calco = document.createElement("canvas");
      calco.width = bw;
      calco.height = bh;
      const cc = calco.getContext("2d")!;
      const pixeles = cc.createImageData(bw, bh);
      const filas: number[][] = [];
      for (let y = 0; y < bh; y++) {
        const fila: number[] = [];
        for (let x = 0; x < bw; x++) {
          const m = magnitud[y * bw + x];
          // Umbral suave: solo los contornos claros pasan al calco.
          const a = Math.min(1, Math.max(0, (m - 0.14) / 0.3));
          const o = (y * bw + x) * 4;
          pixeles.data[o] = 150;
          pixeles.data[o + 1] = 128;
          pixeles.data[o + 2] = 255;
          pixeles.data[o + 3] = a * 255;
          if (y % PASO === 0 && x % PASO === 0 && m > 0.3) fila.push(x);
        }
        if (y % PASO === 0) filas.push(fila);
      }
      cc.putImageData(pixeles, 0, 0);

      piezas[indice] = { foto, calco, filas };
      repintar();
    };

    // La pieza que se ve va primero; las demás, cuando el navegador respira.
    const programar = () => {
      if (ocioso || !pendientes.length) return;
      const siguiente = () => {
        ocioso = 0;
        const indice = pendientes.shift();
        if (indice === undefined || !vivo) return;
        rasterizar(indice);
        programar();
      };
      ocioso =
        typeof window.requestIdleCallback === "function"
          ? window.requestIdleCallback(siguiente, { timeout: 400 })
          : window.setTimeout(siguiente, 60);
    };

    const prepararTodas = () => {
      const primera = activa.current ?? 0;
      rasterizar(primera);
      pendientes = imagenes.map((_, i) => i).filter((i) => i !== primera && fuentes[i]);
      programar();
    };

    imagenes.forEach((src, indice) => {
      const imagen = new Image();
      imagen.decoding = "async";
      imagen.onload = () => {
        if (!vivo) return;
        fuentes[indice] = imagen;
        if (indice === (activa.current ?? 0)) rasterizar(indice);
        else {
          pendientes.push(indice);
          programar();
        }
      };
      imagen.src = src;
    });

    let mostrada = activa.current ?? 0;
    let saliente: number | null = null;
    let salida = 0;
    let llegada = 1;
    let nivel = entintado.current ?? 0;
    let columna = 0;
    const gotas: Gota[] = [];
    const mezcla = document.createElement("canvas");
    const cm = mezcla.getContext("2d")!;

    const bucle = montarLienzo(lienzo, {
      alRedimensionar: (_ctx, { ancho, alto }) => {
        const nuevo = Math.floor(Math.min(ancho, alto / PROPORCION));
        if (nuevo === anchoPieza) return;
        anchoPieza = nuevo;
        piezas.fill(null);
        prepararTodas();
      },

      alPintar: (ctx, t, dt, { ancho, alto }) => {
        acento = tono();
        const pedida = activa.current ?? 0;
        if (pedida !== mostrada) {
          saliente = mostrada;
          salida = 1;
          mostrada = pedida;
          llegada = 0;
          // La tinta nueva empieza donde diga el scroll, sin arrastrar la vieja.
          nivel = entintado.current ?? 0;
          // Si aún no estaba lista, que pase delante de la cola.
          if (!piezas[pedida] && fuentes[pedida]) rasterizar(pedida);
        }
        const suave = quieto ? 1 : Math.min(1, dt * 7);
        salida = Math.max(0, salida - (quieto ? 1 : dt * 3.5));
        llegada = Math.min(1, llegada + (quieto ? 1 : dt * 3));
        const antes = nivel;
        nivel += ((entintado.current ?? 0) - nivel) * suave;
        const avanzando = Math.abs(nivel - antes) / Math.max(dt, 0.001);

        ctx.clearRect(0, 0, ancho, alto);
        const w = anchoPieza;
        const h = anchoPieza * PROPORCION;
        const ox = (ancho - w) / 2;
        const oy = (alto - h) / 2;

        // La que se va: se apaga y se encoge un pelo hacia su centro.
        if (saliente !== null && salida > 0) {
          const vieja = piezas[saliente];
          if (vieja) {
            const e = 0.97 + salida * 0.03;
            ctx.globalAlpha = salida * salida;
            ctx.drawImage(vieja.foto, ox + (w * (1 - e)) / 2, oy + (h * (1 - e)) / 2, w * e, h * e);
          }
        }

        const pieza = piezas[mostrada];
        if (!pieza) {
          ctx.globalAlpha = 1;
          return;
        }

        const entrada = 1 - Math.pow(1 - llegada, 3);

        // Calco: entra con la llegada y queda debajo de la tinta.
        ctx.globalAlpha = 0.75 * entrada;
        ctx.drawImage(pieza.calco, ox, oy + (1 - entrada) * 10, w, h);

        // Tinta: la foto hasta la línea de la aguja, con un borde húmedo que
        // se funde con el calco en vez de cortar en seco.
        const corte = nivel * (h + DIFUMINADO);
        const dpr = pieza.foto.width / w;
        const solido = Math.min(h, Math.max(0, corte - DIFUMINADO));
        if (solido > 0.5) {
          ctx.globalAlpha = entrada;
          ctx.drawImage(pieza.foto, 0, 0, pieza.foto.width, solido * dpr, ox, oy, w, solido);
        }
        const franja = Math.min(DIFUMINADO, h - solido);
        if (franja > 0.5 && corte > 0.5) {
          // La franja se pinta aparte y se funde con un degradado de alfa.
          const bw = pieza.foto.width;
          const bh = Math.ceil(franja * dpr);
          if (mezcla.width !== bw || mezcla.height < bh) {
            mezcla.width = bw;
            mezcla.height = Math.ceil(DIFUMINADO * dpr);
          }
          cm.globalCompositeOperation = "source-over";
          cm.clearRect(0, 0, mezcla.width, mezcla.height);
          cm.drawImage(pieza.foto, 0, solido * dpr, bw, bh, 0, 0, bw, bh);
          cm.globalCompositeOperation = "destination-in";
          const fundido = cm.createLinearGradient(0, 0, 0, DIFUMINADO * dpr);
          fundido.addColorStop(0, "rgba(0,0,0,1)");
          fundido.addColorStop(1, "rgba(0,0,0,0)");
          cm.fillStyle = fundido;
          cm.fillRect(0, 0, bw, bh);
          ctx.globalAlpha = entrada;
          ctx.drawImage(mezcla, 0, 0, bw, bh, ox, oy + solido, w, bh / dpr);
        }

        // La aguja trabaja en la línea del corte, saltando entre contornos.
        const lineaAguja = Math.min(h - 1, Math.max(0, corte - DIFUMINADO * 0.5));
        if (nivel > 0.002 && nivel < 0.998) {
          let fila = Math.min(pieza.filas.length - 1, Math.floor(lineaAguja / PASO));
          for (let d = 1; d < 20 && !pieza.filas[fila]?.length; d++) {
            if (pieza.filas[fila + d]?.length) fila += d;
            else if (pieza.filas[fila - d]?.length) fila -= d;
          }
          const trazos = pieza.filas[fila] ?? [];
          const nx = ox + (trazos.length ? trazos[Math.floor(columna) % trazos.length] : w / 2);
          columna = (columna + dt * (10 + avanzando * 60)) % Math.max(1, trazos.length);
          const temblor = quieto ? 0 : Math.min(1.5, avanzando * 6);
          const ny = oy + fila * PASO + Math.sin(t * 80) * temblor;

          if (!quieto && avanzando > 0.02 && Math.random() < 0.6) {
            gotas.push({ x: nx, y: ny, vx: (Math.random() - 0.5) * 40, vy: -10 - Math.random() * 30, vida: 1 });
          }

          // El cuerpo de la máquina: una línea en diagonal hasta fuera.
          ctx.globalAlpha = 0.5 * entrada;
          ctx.strokeStyle = hueso;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(nx, ny);
          ctx.lineTo(nx + 70, ny - 110);
          ctx.stroke();

          ctx.globalAlpha = entrada;
          const halo = ctx.createRadialGradient(nx, ny, 0, nx, ny, 22);
          halo.addColorStop(0, rgbaAcento(0.55));
          halo.addColorStop(1, rgbaAcento(0));
          ctx.fillStyle = halo;
          ctx.fillRect(nx - 22, ny - 22, 44, 44);
          ctx.fillStyle = rgbaAcento(1);
          ctx.beginPath();
          ctx.arc(nx, ny, 2.2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = hueso;
        for (let i = gotas.length - 1; i >= 0; i--) {
          const g = gotas[i];
          g.vida -= dt * 2;
          if (g.vida <= 0) {
            gotas.splice(i, 1);
            continue;
          }
          g.vy += 120 * dt;
          g.x += g.vx * dt;
          g.y += g.vy * dt;
          ctx.globalAlpha = g.vida * 0.6;
          ctx.fillRect(g.x, g.y, 1.2, 1.2);
        }
        ctx.globalAlpha = 1;
      },
    });

    repintar = bucle.repintar;
    const alDesplazar = () => bucle.repintar();
    if (quieto) window.addEventListener("scroll", alDesplazar, { passive: true });
    return () => {
      vivo = false;
      if (ocioso) {
        if (typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(ocioso);
        window.clearTimeout(ocioso);
      }
      bucle.desmontar();
      window.removeEventListener("scroll", alDesplazar);
    };
  }, [imagenes, focos, activa, entintado]);

  return <canvas ref={referencia} aria-hidden className={`block ${className}`} />;
}
