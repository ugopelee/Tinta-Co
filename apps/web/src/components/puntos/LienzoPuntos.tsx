"use client";

import { useEffect, useRef } from "react";
import { aRgb, colorVivo, leerVariable, montarLienzo, prefiereMenosMovimiento, ruido, seguirPuntero } from "./nucleo";
import {
  aro,
  corazon,
  desdeDibujo,
  esfera,
  estrella,
  helice,
  monograma,
  rellenarOnda,
  texto,
  type Forma,
} from "./formas";

const NIVELES = 6;

/**
 * Colocación de la forma en pantalla. "derecha" deja libre la columna de
 * texto; "fondo" tiende la forma a lo ancho, por debajo del contenido;
 * "arriba" es "derecha" salvo en móvil, donde ocupa el hueco superior.
 */
function colocar(lado: string, ancho: number, alto: number) {
  const ancha = ancho >= 1024;
  if (lado === "fondo") {
    return { x: ancho * 0.5, y: alto * 0.8, escala: ancha ? ancho * 0.36 : ancho * 0.7, alfa: 0.75 };
  }
  // Portada: la esfera es el fondo. Centrada y más alta que la pantalla,
  // así no se lee como una figura al lado del texto sino como un cielo.
  if (lado === "detras") {
    return { x: ancho * 0.5, y: alto * 0.56, escala: Math.max(ancho * 0.36, alto * 0.62), alfa: 0.3 };
  }
  // La sección pinta su propio lienzo: los puntos se apagan donde estaban.
  if (lado === "oculto") {
    return { x: ancho * 0.73, y: alto * 0.5, escala: Math.min(ancho * 0.19, alto * 0.32), alfa: 0 };
  }
  if (lado === "centro") {
    return { x: ancho * 0.5, y: alto * 0.5, escala: Math.min(ancho, alto) * 0.34, alfa: 0.55 };
  }
  // En móvil la portada deja hueco libre arriba: ahí la forma va entera.
  if (lado === "arriba" && !ancha) {
    return { x: ancho * 0.5, y: alto * 0.22, escala: ancho * 0.3, alfa: 0.85 };
  }
  return ancha
    ? { x: ancho * 0.73, y: alto * 0.52, escala: Math.min(ancho * 0.19, alto * 0.32), alfa: 1 }
    : { x: ancho * 0.5, y: alto * 0.3, escala: ancho * 0.34, alfa: 0.3 };
}

/**
 * Un único lienzo de puntos fijo detrás de toda la página. Cada sección
 * declara con `data-forma` qué quiere ver y con `data-lado` dónde; el
 * lienzo lee la sección que cruza el centro de la pantalla y lleva los
 * mismos puntos de una forma a la siguiente.
 */
export function LienzoPuntos() {
  const referencia = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const lienzo = referencia.current;
    if (!lienzo) return;

    const quieto = prefiereMenosMovimiento();
    const n = window.innerWidth < 720 ? 1300 : 2400;

    const hueso = aRgb(leerVariable("texto", "#eceae4"));
    const coloresHueso: string[] = [];
    const coloresAcento: string[] = [];
    for (let k = 0; k < NIVELES; k++) {
      const a = 0.16 + (k / (NIVELES - 1)) * 0.84;
      coloresHueso.push(`rgba(${hueso[0]},${hueso[1]},${hueso[2]},${a.toFixed(3)})`);
    }
    // Los puntos de tinta toman el tono de la sección, que cambia al bajar.
    const tono = colorVivo("acento-suave", "#e0745e");
    let tonoPintado = "";
    const pintarTono = () => {
      const [r, g, b] = tono();
      const clave = `${r},${g},${b}`;
      if (clave === tonoPintado) return;
      tonoPintado = clave;
      for (let k = 0; k < NIVELES; k++) {
        const a = 0.16 + (k / (NIVELES - 1)) * 0.84;
        coloresAcento[k] = `rgba(${clave},${a.toFixed(3)})`;
      }
    };
    pintarTono();

    // --- Formas: las sincronas se crean al pedirlas; las que dependen de
    // una imagen o una fuente se cargan una vez y se guardan.
    const cache = new Map<string, Forma | null>();
    const cargando = new Set<string>();
    const fuenteSerif = leerVariable("font-serif", "Georgia");

    const obtener = (clave: string): Forma | null | undefined => {
      if (cache.has(clave)) return cache.get(clave);
      if (cargando.has(clave)) return undefined;

      if (clave === "esfera") cache.set(clave, esfera(n));
      else if (clave === "servicio-0") cache.set(clave, estrella(n));
      else if (clave === "servicio-1") cache.set(clave, helice(n));
      else if (clave === "servicio-2") cache.set(clave, aro(n));
      else if (clave === "servicio-3") cache.set(clave, corazon(n));
      else if (clave === "monograma") cache.set(clave, monograma(n));
      else if (clave.startsWith("texto:")) {
        cargando.add(clave);
        // La serif llega por next/font: hasta que no está lista, el lienzo
        // dibujaría la de sistema.
        document.fonts.ready.then(() => {
          cache.set(clave, texto(n, clave.slice(6), fuenteSerif));
          cargando.delete(clave);
        });
        return undefined;
      } else if (clave.startsWith("diseno:")) {
        cargando.add(clave);
        const imagen = new Image();
        imagen.crossOrigin = "anonymous";
        imagen.onload = () => {
          cache.set(
            clave,
            desdeDibujo((ctx, ancho, alto) => ctx.drawImage(imagen, 0, 0, ancho, alto), n, 400, 520),
          );
          cargando.delete(clave);
        };
        imagen.onerror = () => {
          cache.set(clave, null);
          cargando.delete(clave);
        };
        imagen.src = clave.slice(7);
        return undefined;
      } else cache.set(clave, null);

      return cache.get(clave);
    };

    // Las formas síncronas se construyen antes de pedirlas, en ratos
    // libres: al llegar a su sección ya están listas y el cambio es inmediato.
    const precargar = ["servicio-0", "servicio-1", "servicio-2", "servicio-3", "monograma"];
    let ocioso = 0;
    const siguientePrecarga = () => {
      const clave = precargar.shift();
      if (!clave) return;
      obtener(clave);
      ocioso = window.setTimeout(siguientePrecarga, 30);
    };
    ocioso = window.setTimeout(siguientePrecarga, 400);

    // --- Estado de las partículas, en arrays planos.
    const px = new Float32Array(n);
    const py = new Float32Array(n);
    const vx = new Float32Array(n);
    const vy = new Float32Array(n);
    const semilla = new Float32Array(n);
    const nivel = new Uint8Array(n);
    const onda = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) semilla[i] = Math.random();

    let claveActual = "";
    let forma: Forma | null = null;
    let esOnda = false;
    let momentoCambio = 0;
    let giroAcumulado = 0;
    const sitio = { x: 0, y: 0, escala: 1, alfa: 1 };
    let colocado = false;
    const inclinacionPuntero = { x: 0, y: 0 };
    let ultimoScroll = window.scrollY;
    let empujeScroll = 0;

    let secciones: HTMLElement[] = [];
    let fotogramas = 0;
    let seccionActual: HTMLElement | null = null;

    const { puntero, soltar } = seguirPuntero(lienzo);

    const leerSeccion = (alto: number) => {
      if (fotogramas++ % 60 === 0) {
        secciones = Array.from(document.querySelectorAll<HTMLElement>("[data-forma]"));
      }
      const centro = alto * 0.5;
      for (const seccion of secciones) {
        const caja = seccion.getBoundingClientRect();
        if (caja.top <= centro && caja.bottom > centro) {
          seccionActual = seccion;
          break;
        }
      }
      return seccionActual;
    };

    const dispersar = (fuerza: number) => {
      for (let i = 0; i < n; i++) {
        const a = semilla[i] * Math.PI * 2 + Math.random() * 2;
        const f = fuerza * (0.3 + Math.random());
        vx[i] += Math.cos(a) * f;
        vy[i] += Math.sin(a) * f;
      }
    };

    const { desmontar, repintar } = montarLienzo(lienzo, {
      alRedimensionar: (_ctx, { ancho, alto }) => {
        if (colocado) return;
        // Entrada: los puntos suben desde el borde inferior.
        for (let i = 0; i < n; i++) {
          px[i] = Math.random() * ancho;
          py[i] = alto + Math.random() * alto * 0.4;
        }
      },

      alPintar: (ctx, t, dt, { ancho, alto }) => {
        pintarTono();
        const seccion = leerSeccion(alto);
        const clave = seccion?.dataset.forma ?? "esfera";
        const lado = seccion?.dataset.lado ?? "derecha";

        // ¿Cambia la forma pedida? Solo se cambia cuando ya está lista, así
        // la anterior aguanta mientras carga la siguiente.
        if (clave !== claveActual) {
          const siguiente = clave === "onda" ? null : obtener(clave);
          if (clave === "onda" || siguiente) {
            if (claveActual) dispersar(esOnda || clave === "onda" ? 90 : 170);
            claveActual = clave;
            forma = siguiente ?? null;
            esOnda = clave === "onda";
            momentoCambio = t;
          }
        }

        // La colocación también se desliza: la forma viaja de un lado a otro.
        const destino = colocar(lado, ancho, alto);
        const mezcla = colocado && !quieto ? Math.min(1, dt * 2.4) : 1;
        sitio.x += (destino.x - sitio.x) * mezcla;
        sitio.y += (destino.y - sitio.y) * mezcla;
        sitio.escala += (destino.escala - sitio.escala) * mezcla;
        sitio.alfa += (destino.alfa - sitio.alfa) * mezcla;
        colocado = true;

        // El scroll empuja la forma un poco: parece que flota.
        const scroll = window.scrollY;
        const velocidad = (scroll - ultimoScroll) / Math.max(dt, 0.001);
        ultimoScroll = scroll;
        empujeScroll += (Math.max(-60, Math.min(60, -velocidad * 0.03)) - empujeScroll) * Math.min(1, dt * 4);

        const objetivoX = puntero.activo ? (puntero.x / ancho - 0.5) * 0.9 : 0;
        const objetivoY = puntero.activo ? (puntero.y / alto - 0.5) * 0.5 : 0;
        inclinacionPuntero.x += (objetivoX - inclinacionPuntero.x) * Math.min(1, dt * 2);
        inclinacionPuntero.y += (objetivoY - inclinacionPuntero.y) * Math.min(1, dt * 2);

        let puntos: Float32Array | null = forma?.puntos ?? null;
        let giroY = 0;
        let giroX = 0;
        if (esOnda) {
          rellenarOnda(onda, n, t);
          puntos = onda;
          giroY = inclinacionPuntero.x * 0.25;
          giroX = -0.52 + inclinacionPuntero.y * 0.2;
        } else if (forma) {
          giroAcumulado += forma.giro * dt;
          giroY = giroAcumulado + Math.sin(t * 0.6) * forma.vaiven + inclinacionPuntero.x;
          giroX = forma.inclinacion + inclinacionPuntero.y;
        }

        const cosY = Math.cos(giroY);
        const senY = Math.sin(giroY);
        const cosX = Math.cos(giroX);
        const senX = Math.sin(giroX);

        const desde = t - momentoCambio;
        // Se forma en menos de un segundo: más, y el cambio parece que cuesta.
        const formado = Math.min(1, Math.max(0, (desde - 0.04) / 0.75));
        const suave = quieto ? 1 : formado * formado * (3 - 2 * formado);
        const rigidez = 5 + suave * 42;
        const agitacion = 18 + (1 - suave) * 260;
        const friccion = Math.pow(0.88, dt * 60);
        const cx = sitio.x;
        const cy = sitio.y + empujeScroll;
        const escala = sitio.escala;

        ctx.clearRect(0, 0, ancho, alto);
        if (!puntos) return;

        for (let i = 0; i < n; i++) {
          const x0 = puntos[i * 3];
          const y0 = puntos[i * 3 + 1];
          const z0 = puntos[i * 3 + 2];
          // Giro en Y y luego en X.
          const x1 = x0 * cosY + z0 * senY;
          const z1 = -x0 * senY + z0 * cosY;
          const y2 = y0 * cosX - z1 * senX;
          const z2 = y0 * senX + z1 * cosX;
          const perspectiva = 2.8 / (2.8 + z2);
          const tx = cx + x1 * perspectiva * escala;
          const ty = cy - y2 * perspectiva * escala;

          if (quieto) {
            px[i] = tx;
            py[i] = ty;
          } else {
            const angulo = ruido(px[i] * 0.005 + t * 0.1, py[i] * 0.005) * Math.PI * 4;
            let ax = (tx - px[i]) * rigidez + Math.cos(angulo) * agitacion;
            let ay = (ty - py[i]) * rigidez + Math.sin(angulo) * agitacion;
            if (puntero.activo) {
              const dx = px[i] - puntero.x;
              const dy = py[i] - puntero.y;
              const d2 = dx * dx + dy * dy;
              if (d2 < 10000 && d2 > 0.01) {
                const d = Math.sqrt(d2);
                const empuje = (1 - d / 100) ** 2 * 4200;
                ax += (dx / d) * empuje;
                ay += (dy / d) * empuje;
              }
            }
            vx[i] = (vx[i] + ax * dt) * friccion;
            vy[i] = (vy[i] + ay * dt) * friccion;
            px[i] += vx[i] * dt;
            py[i] += vy[i] * dt;
          }

          // Lo cercano brilla más y se ve más grande.
          const cercania = Math.min(1, Math.max(0, (perspectiva - 0.72) / 0.62));
          const k = Math.min(NIVELES - 1, Math.floor(cercania * NIVELES));
          nivel[i] = k | (semilla[i] < 0.06 ? 8 : 0);
        }

        ctx.globalAlpha = sitio.alfa;
        for (let k = 0; k < NIVELES; k++) {
          const tamano = 0.9 + k * 0.28;
          for (const tinta of [0, 8]) {
            ctx.fillStyle = tinta ? coloresAcento[k] : coloresHueso[k];
            const buscado = k | tinta;
            for (let i = 0; i < n; i++) {
              if (nivel[i] === buscado) ctx.fillRect(px[i], py[i], tamano, tamano);
            }
          }
        }

        ctx.globalAlpha = 1;
      },
    });

    // Con movimiento reducido no hay bucle: se repinta al cambiar de sección.
    const alDesplazar = () => repintar();
    if (quieto) window.addEventListener("scroll", alDesplazar, { passive: true });

    return () => {
      window.clearTimeout(ocioso);
      desmontar();
      soltar();
      window.removeEventListener("scroll", alDesplazar);
    };
  }, []);

  return (
    <canvas
      ref={referencia}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 block h-full w-full"
    />
  );
}
