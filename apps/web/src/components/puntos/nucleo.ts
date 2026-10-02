/**
 * Infraestructura del lienzo de puntos: densidad de píxeles, tamaño, pausa
 * con la pestaña oculta, movimiento reducido y lectura del puntero. Todo en
 * <canvas> 2D a mano, sin librerías, para que el efecto solo tenga que pintar.
 */

export type Medidas = { ancho: number; alto: number; dpr: number };

type Opciones = {
  /** Se llama al montar y en cada cambio de tamaño, ya con el DPR aplicado. */
  alRedimensionar?: (ctx: CanvasRenderingContext2D, medidas: Medidas) => void;
  /** Un fotograma. `t` en segundos desde el montaje, `dt` acotado. */
  alPintar: (
    ctx: CanvasRenderingContext2D,
    t: number,
    dt: number,
    medidas: Medidas,
  ) => void;
  /** Tope de fotogramas por segundo; los efectos de texto no piden 60. */
  fps?: number;
  /** Tope de densidad: por encima de 2 el coste se dispara y no se nota. */
  dprMaximo?: number;
};

export function prefiereMenosMovimiento() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Monta el bucle de un lienzo. Devuelve cómo desmontarlo y cómo forzar un
 * fotograma, que es lo único que se pinta con movimiento reducido. Solo
 * pinta mientras el lienzo está en pantalla y la pestaña visible: cinco
 * lienzos animados a la vez se notarían en cualquier portátil.
 */
export function montarLienzo(lienzo: HTMLCanvasElement, opciones: Opciones) {
  const ctx = lienzo.getContext("2d");
  if (!ctx) return { desmontar: () => {}, repintar: () => {} };

  const quieto = prefiereMenosMovimiento();
  const intervalo = opciones.fps ? 1000 / opciones.fps : 0;
  const medidas: Medidas = { ancho: 0, alto: 0, dpr: 1 };

  let enPantalla = false;
  let cuadro = 0;
  let inicio = performance.now();
  let anterior = inicio;
  let ultimoPintado = 0;

  const redimensionar = () => {
    const caja = lienzo.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, opciones.dprMaximo ?? 2);
    medidas.ancho = Math.max(1, Math.round(caja.width));
    medidas.alto = Math.max(1, Math.round(caja.height));
    medidas.dpr = dpr;
    lienzo.width = Math.round(medidas.ancho * dpr);
    lienzo.height = Math.round(medidas.alto * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    opciones.alRedimensionar?.(ctx, medidas);
    // Con movimiento reducido no hay bucle: un único fotograma ya avanzado,
    // para que la escena se vea formada y no en su estado inicial.
    if (quieto) opciones.alPintar(ctx, 6, 1 / 60, medidas);
  };

  const pintar = (ahora: number) => {
    cuadro = requestAnimationFrame(pintar);
    if (intervalo && ahora - ultimoPintado < intervalo) return;
    ultimoPintado = ahora;
    // Tras una pausa larga el salto de tiempo desbarataría la física.
    const dt = Math.min(0.05, (ahora - anterior) / 1000);
    anterior = ahora;
    opciones.alPintar(ctx, (ahora - inicio) / 1000, dt, medidas);
  };

  const arrancar = () => {
    if (quieto || cuadro || !enPantalla || document.hidden) return;
    anterior = performance.now();
    cuadro = requestAnimationFrame(pintar);
  };

  const parar = () => {
    cancelAnimationFrame(cuadro);
    cuadro = 0;
  };

  const observadorTamano = new ResizeObserver(redimensionar);
  observadorTamano.observe(lienzo);

  const observadorVista = new IntersectionObserver(
    ([entrada]) => {
      enPantalla = entrada.isIntersecting;
      if (enPantalla) arrancar();
      else parar();
    },
    { rootMargin: "120px" },
  );
  observadorVista.observe(lienzo);

  const alCambiarVisibilidad = () => {
    if (document.hidden) parar();
    else arrancar();
  };
  document.addEventListener("visibilitychange", alCambiarVisibilidad);

  redimensionar();
  inicio = performance.now();

  return {
    desmontar: () => {
      parar();
      observadorTamano.disconnect();
      observadorVista.disconnect();
      document.removeEventListener("visibilitychange", alCambiarVisibilidad);
    },
    repintar: () => {
      if (quieto) opciones.alPintar(ctx, 6, 1 / 60, medidas);
    },
  };
}

/**
 * Posición del puntero relativa a un elemento. Se escucha en la ventana y no
 * en el lienzo porque los lienzos van debajo del contenido con
 * `pointer-events: none`: así no roban clics a formularios ni enlaces.
 */
export function seguirPuntero(elemento: HTMLElement) {
  const puntero = { x: -9999, y: -9999, activo: false };

  const alMover = (evento: PointerEvent) => {
    const caja = elemento.getBoundingClientRect();
    puntero.x = evento.clientX - caja.left;
    puntero.y = evento.clientY - caja.top;
    puntero.activo =
      puntero.x >= 0 &&
      puntero.y >= 0 &&
      puntero.x <= caja.width &&
      puntero.y <= caja.height;
  };

  const alSalir = () => {
    puntero.activo = false;
  };

  window.addEventListener("pointermove", alMover, { passive: true });
  document.addEventListener("pointerleave", alSalir);

  return {
    puntero,
    soltar: () => {
      window.removeEventListener("pointermove", alMover);
      document.removeEventListener("pointerleave", alSalir);
    },
  };
}

/** Lee una variable CSS de :root: la paleta inyectada o una fuente de next/font. */
export function leerVariable(nombre: string, respaldo: string) {
  if (typeof window === "undefined") return respaldo;
  const valor = getComputedStyle(document.documentElement)
    .getPropertyValue(`--${nombre}`)
    .trim();
  return valor || respaldo;
}

/** #rrggbb → [r, g, b]. */
export function aRgb(hex: string): [number, number, number] {
  const limpio = hex.replace("#", "");
  const valor = parseInt(
    limpio.length === 3
      ? limpio
          .split("")
          .map((c) => c + c)
          .join("")
      : limpio,
    16,
  );
  return [(valor >> 16) & 255, (valor >> 8) & 255, valor & 255];
}

/**
 * Ruido de valor 2D barato y determinista. No es Perlin, pero para empujar
 * partículas y ondular un terreno es indistinguible y cuesta la mitad.
 */
function azar(x: number, y: number) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

export function ruido(x: number, y: number) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = azar(ix, iy);
  const b = azar(ix + 1, iy);
  const c = azar(ix, iy + 1);
  const d = azar(ix + 1, iy + 1);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

/**
 * Un color de :root que puede cambiar con el scroll (el fondo vivo reescribe
 * `--acento-suave` por sección). Se relee cada pocos fotogramas: leer estilos
 * computados en cada uno costaría más que pintar.
 */
export function colorVivo(nombre: string, respaldo: string, cada = 12) {
  let cuenta = 0;
  let valor = aRgb(leerVariable(nombre, respaldo));
  return () => {
    if (++cuenta % cada === 0) valor = aRgb(leerVariable(nombre, respaldo));
    return valor;
  };
}
