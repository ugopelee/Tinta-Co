/**
 * Catálogo de formas del lienzo de puntos. Todas devuelven exactamente
 * `n` puntos 3D (x, y, z) dentro de la esfera unidad, con la y hacia arriba,
 * para que el lienzo pueda pasar de una a otra punto a punto.
 */

import { TRAZOS_MONOGRAMA } from "@/components/MarcaDeAgua";

export type Forma = {
  puntos: Float32Array;
  /** Giro continuo sobre el eje vertical, en radianes por segundo. */
  giro: number;
  /** Vaivén para las formas planas, que de espaldas no se leerían. */
  vaiven: number;
  /** Inclinación fija hacia delante, para ver el volumen. */
  inclinacion: number;
};

const AUREO = Math.PI * (3 - Math.sqrt(5));

function forma(puntos: Float32Array, opciones: Partial<Omit<Forma, "puntos">> = {}): Forma {
  return { puntos, giro: 0, vaiven: 0, inclinacion: 0, ...opciones };
}

/** Esfera de Fibonacci: reparto uniforme, sin polos apelotonados. */
export function esfera(n: number): Forma {
  const p = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const y = 1 - (2 * (i + 0.5)) / n;
    const r = Math.sqrt(1 - y * y);
    const a = i * AUREO;
    p[i * 3] = Math.cos(a) * r;
    p[i * 3 + 1] = y;
    p[i * 3 + 2] = Math.sin(a) * r;
  }
  return forma(p, { giro: 0.22, inclinacion: 0.3 });
}

/** El sol de doce rayos del flash tradicional, con grosor. */
export function estrella(n: number): Forma {
  const p = new Float32Array(n * 3);
  const rayos = 12;
  const vertices: [number, number][] = [];
  for (let i = 0; i < rayos * 2; i++) {
    const a = (i / (rayos * 2)) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? 1 : 0.42;
    vertices.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  for (let i = 0; i < n; i++) {
    let x: number;
    let y: number;
    let z: number;
    if (i % 5 === 0) {
      // Un disco central relleno: el corazón del sol.
      const a = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * 0.3;
      x = Math.cos(a) * r;
      y = Math.sin(a) * r;
      z = (Math.random() - 0.5) * 0.1;
    } else {
      const lado = (Math.random() * vertices.length) | 0;
      const [ax, ay] = vertices[lado];
      const [bx, by] = vertices[(lado + 1) % vertices.length];
      const f = Math.random();
      x = ax + (bx - ax) * f;
      y = ay + (by - ay) * f;
      z = (Math.random() - 0.5) * 0.24;
    }
    p[i * 3] = x;
    p[i * 3 + 1] = y;
    p[i * 3 + 2] = z;
  }
  return forma(p, { giro: 0.35, inclinacion: 0.15 });
}

/** Doble hélice con travesaños: el boceto que se construye paso a paso. */
export function helice(n: number): Forma {
  const p = new Float32Array(n * 3);
  const vueltas = 2.4;
  for (let i = 0; i < n; i++) {
    const u = Math.random();
    const a = u * vueltas * Math.PI * 2;
    const y = u * 2 - 1;
    const radio = 0.52;
    let x: number;
    let z: number;
    if (i % 7 === 0) {
      // Travesaño: un punto entre las dos hebras a una altura fija.
      const peldano = Math.round(u * 26) / 26;
      const ap = peldano * vueltas * Math.PI * 2;
      const f = Math.random() * 2 - 1;
      x = Math.cos(ap) * radio * f;
      z = Math.sin(ap) * radio * f;
      p[i * 3 + 1] = peldano * 2 - 1;
      p[i * 3] = x;
      p[i * 3 + 2] = z;
      continue;
    }
    const hebra = i % 2 === 0 ? 0 : Math.PI;
    const temblor = (Math.random() - 0.5) * 0.06;
    x = Math.cos(a + hebra) * (radio + temblor);
    z = Math.sin(a + hebra) * (radio + temblor);
    p[i * 3] = x;
    p[i * 3 + 1] = y;
    p[i * 3 + 2] = z;
  }
  return forma(p, { giro: 0.5, inclinacion: 0.12 });
}

/** Aro de piercing: un toro inclinado con su bola. */
export function aro(n: number): Forma {
  const p = new Float32Array(n * 3);
  const R = 0.72;
  const r = 0.14;
  for (let i = 0; i < n; i++) {
    let x: number;
    let y: number;
    let z: number;
    if (i % 9 === 0) {
      // La bola, apoyada en el aro.
      const yb = Math.random() * 2 - 1;
      const rb = Math.sqrt(1 - yb * yb);
      const ab = Math.random() * Math.PI * 2;
      x = Math.cos(ab) * rb * 0.2;
      y = yb * 0.2 - R;
      z = Math.sin(ab) * rb * 0.2;
    } else {
      const u = Math.random() * Math.PI * 2;
      const v = Math.random() * Math.PI * 2;
      // Hueco a la altura de la bola: el aro se abre ahí.
      if (Math.abs(u - Math.PI * 1.5) < 0.2) {
        i--;
        continue;
      }
      x = (R + r * Math.cos(v)) * Math.cos(u);
      y = (R + r * Math.cos(v)) * Math.sin(u);
      z = r * Math.sin(v);
    }
    p[i * 3] = x;
    p[i * 3 + 1] = y;
    p[i * 3 + 2] = z;
  }
  return forma(p, { giro: 0.45, inclinacion: 0.35 });
}

/** Corazón abombado, como un cojín: la superficie de la curva clásica. */
export function corazon(n: number): Forma {
  const p = new Float32Array(n * 3);
  let i = 0;
  while (i < n) {
    const x = (Math.random() * 2 - 1) * 1.2;
    const y = Math.random() * 2.3 - 1.05;
    const f = (x * x + y * y - 1) ** 3 - x * x * y * y * y;
    if (f > 0) continue;
    const hondo = Math.min(1, Math.cbrt(-f) * 1.4);
    const z = (i % 2 === 0 ? 1 : -1) * 0.34 * Math.sqrt(hondo);
    p[i * 3] = x * 0.82;
    p[i * 3 + 1] = (y - 0.12) * 0.82;
    p[i * 3 + 2] = z;
    i++;
  }
  return forma(p, { giro: 0.4, inclinacion: 0.1 });
}

/**
 * Convierte un dibujo 2D en una forma plana: se pinta en un lienzo aparte y
 * se recogen los píxeles con tinta. Si el lienzo queda contaminado por una
 * imagen de otro origen, devuelve null.
 */
export function desdeDibujo(
  pintar: (ctx: CanvasRenderingContext2D, ancho: number, alto: number) => void,
  n: number,
  ancho = 400,
  alto = 480,
  /** Aumento para dibujos que no llenan su lienzo, como el texto. */
  aumento = 1,
): Forma | null {
  const lienzo = document.createElement("canvas");
  lienzo.width = ancho;
  lienzo.height = alto;
  const ctx = lienzo.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  pintar(ctx, ancho, alto);

  let datos: Uint8ClampedArray;
  try {
    datos = ctx.getImageData(0, 0, ancho, alto).data;
  } catch {
    return null;
  }

  const candidatos: number[] = [];
  for (let y = 0; y < alto; y += 2) {
    for (let x = 0; x < ancho; x += 2) {
      if (datos[(y * ancho + x) * 4 + 3] > 40) candidatos.push(x, y);
    }
  }
  const total = candidatos.length / 2;
  if (total === 0) return null;

  const escala = (2 / Math.max(ancho, alto)) * aumento;
  const p = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const k = (Math.random() * total) | 0;
    p[i * 3] = (candidatos[k * 2] - ancho / 2) * escala;
    p[i * 3 + 1] = -(candidatos[k * 2 + 1] - alto / 2) * escala;
    p[i * 3 + 2] = (Math.random() - 0.5) * 0.08;
  }
  return forma(p, { vaiven: 0.28 });
}

export function monograma(n: number) {
  return desdeDibujo(
    (ctx, ancho, alto) => {
      ctx.scale(ancho / 200, alto / 240);
      ctx.strokeStyle = "#fff";
      ctx.lineCap = "round";
      for (const trazo of TRAZOS_MONOGRAMA) {
        ctx.globalAlpha = trazo.opacidad;
        ctx.lineWidth = trazo.grosor * 2.2;
        ctx.stroke(new Path2D(trazo.d));
      }
    },
    n,
  );
}

/** Texto hecho de puntos, en la serif del estudio. */
export function texto(n: number, contenido: string, fuente: string) {
  return desdeDibujo(
    (ctx, ancho, alto) => {
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `italic 400 ${Math.round(alto * 0.62)}px ${fuente}`;
      ctx.fillText(contenido, ancho / 2, alto * 0.52, ancho * 0.96);
    },
    n,
    560,
    400,
    1.55,
  );
}

/**
 * Malla ondulante vista desde arriba. Es la única forma viva: se recalcula
 * en cada fotograma, así que en vez de puntos fijos se entrega una función.
 */
export function rellenarOnda(destino: Float32Array, n: number, t: number) {
  const columnas = Math.round(Math.sqrt(n * 2.6));
  const filas = Math.ceil(n / columnas);
  for (let i = 0; i < n; i++) {
    const c = i % columnas;
    const f = (i / columnas) | 0;
    const x = (c / (columnas - 1)) * 2 - 1;
    const z = (f / Math.max(1, filas - 1)) * 2 - 1;
    destino[i * 3] = x * 1.9;
    destino[i * 3 + 1] =
      Math.sin(x * 3.2 + t * 0.8) * 0.09 + Math.sin(z * 4.1 - t * 0.6) * 0.07 + Math.sin((x + z) * 6 + t) * 0.025;
    destino[i * 3 + 2] = z * 0.9;
  }
}
