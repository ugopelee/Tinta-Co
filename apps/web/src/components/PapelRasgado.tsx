"use client";

import { useEffect, useId, useMemo, useRef, useState, type ComponentPropsWithoutRef, type ReactNode } from "react";

/**
 * Una hoja de papel de calco que se rasga con el scroll. Al principio es un
 * cartel: un rótulo y una palabra enorme. Al bajar, una grieta sale del
 * centro, la hoja se parte por ella y las dos mitades se separan, cada una
 * inclinándose como papel de verdad. Detrás estaba la piel: una foto que sube
 * y se asienta. Al subir, el papel vuelve a cerrarse.
 *
 * Todo es SVG hecho de números: el desgarro, las fibras y los rizos del
 * papel. La idea viene de un póster con un tigre; aquí lo que asoma es un
 * tatuaje, que es lo que hay debajo del calco.
 */

type Punto = [number, number];

// --- Geometría del desgarro -------------------------------------------------

/** PRNG con semilla (mulberry32): el desgarro es el mismo en cada visita. */
function azar(semilla: number) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const acotar = (x: number) => (x <= 0 ? 0 : x > 1 ? 1 : x);

function suave(a: number, b: number, x: number) {
  const t = acotar((x - a) / (b - a));
  return t * t * (3 - 2 * t);
}

const ANCHO = 1000;
const CX = 500;
const CY = 318;
const LEJOS = 4000;
const MARCO = "36 44 928 468";

/**
 * Alto de la orla: un trozo de escenario que cuelga por debajo de la
 * pantalla. Mientras la portada está fija no se ve; al soltarse entra
 * deshilachada sobre la sección siguiente, en vez de cortar en recto.
 */
export const ORLA = "22svh";

/**
 * Color en el que termina la portada: el mismo negro del velo de la foto.
 * Fijo, no var(--fondo): la sección siguiente arranca en este mismo negro
 * (ver Estudio) y así el empalme no tiene costura aunque la página vire.
 */
export const NEGRO_PORTADA = "#08080a";

/**
 * Máscara de la orla: opaca hasta el borde de la pantalla y, debajo, una
 * franja que se deshace con ruido, como tinta corrida en papel. El viewBox
 * se estira al alto del escenario (pantalla + orla), así que la franja
 * empieza en 1000 de 1220 aunque cambie el alto.
 */
const BORDE_TINTA = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1000 1220' preserveAspectRatio='none'>
    <defs>
      <linearGradient id='g' x1='0' y1='0' x2='0' y2='1'>
        <stop offset='0' stop-color='#fff'/>
        <stop offset='0.5' stop-color='#fff' stop-opacity='0.5'/>
        <stop offset='1' stop-color='#fff' stop-opacity='0'/>
      </linearGradient>
      <filter id='f' x='-20%' y='-20%' width='140%' height='140%'>
        <feTurbulence type='fractalNoise' baseFrequency='0.007 0.035' numOctaves='4' seed='14'/>
        <feDisplacementMap in='SourceGraphic' scale='90' xChannelSelector='R' yChannelSelector='G'/>
      </filter>
    </defs>
    <rect width='1000' height='1030' fill='#fff'/>
    <g filter='url(#f)'>
      <rect x='-200' y='980' width='1400' height='60' fill='#fff'/>
      <rect x='-200' y='1040' width='1400' height='150' fill='url(#g)'/>
    </g>
  </svg>`,
)}")`;

/** Un solo valor de scroll marca cinco tiempos. */
function tiempos(p: number) {
  return {
    grieta: suave(0.03, 0.18, p),
    apertura: suave(0.16, 0.66, p),
    subida: suave(0.2, 0.7, p),
    texto: suave(0.66, 0.84, p),
    sacudida: suave(0.14, 0.2, p) * (1 - suave(0.24, 0.34, p)),
  };
}

/** El desgarro, de izquierda a derecha: diagonal leve, deriva lenta y dientes. */
function lineaDesgarro(semilla = 11, desde = -800, hasta = 1800, paso = 9, angulo = -6): Punto[] {
  const r = azar(semilla);
  const pendiente = Math.tan((angulo * Math.PI) / 180);
  const salida: Punto[] = [];
  for (let x = desde; x <= hasta; x += paso) {
    const fibra = (r() - 0.5) * 5;
    const diente = r() < 0.09 ? (r() - 0.5) * 26 : 0;
    const deriva = Math.sin(x * 0.019 + semilla) * 10 + Math.sin(x * 0.053 + semilla * 2) * 4;
    salida.push([x, CY + (x - CX) * pendiente + deriva + fibra + diente]);
  }
  return salida;
}

/**
 * Adónde va cada mitad. Se abren mucho más que un simple desgarro: al final
 * la foto de detrás tiene que verse entera.
 */
function movimiento(apertura: number, alcance: number) {
  const e = apertura * apertura * (3 - 2 * apertura);
  return {
    arriba: { dx: -14 * e, dy: -330 * alcance * e, giro: (-4.2 / alcance) * e },
    abajo: { dx: 16 * e, dy: 320 * alcance * e, giro: (3.4 / alcance) * e },
  };
}

/** Ancho del alma blanca que asoma en un borde rasgado. */
function anchosFibra(n: number, apertura: number, semilla: number) {
  const r = azar(semilla);
  const k = Math.min(1, apertura * 4);
  return Array.from({ length: n }, (_, i) => k * (2.5 + 6 * (0.5 + 0.5 * Math.sin(i * 0.37 + semilla)) * (0.6 + r() * 0.8)));
}

const trazado = (puntos: Punto[], cerrar = true) =>
  "M" + puntos.map(([x, y]) => x.toFixed(1) + " " + y.toFixed(1)).join("L") + (cerrar ? "Z" : "");

/** Donde el papel se riza sobre el hueco: [x en el desgarro, semiancho, fondo]. */
const RIZOS: Record<"arriba" | "abajo", [number, number, number][]> = {
  arriba: [
    [300, 44, 30],
    [575, 30, 20],
    [790, 52, 34],
  ],
  abajo: [
    [205, 50, 32],
    [470, 34, 22],
    [690, 40, 28],
  ],
};

function Mitad({
  id,
  lado,
  linea,
  apertura,
  alcance,
  children,
}: {
  id: string;
  lado: "arriba" | "abajo";
  linea: Punto[];
  apertura: number;
  /** Cuánto más hay que abrir en pantallas altas, donde el marco es más alto. */
  alcance: number;
  children: ReactNode;
}) {
  const sube = lado === "arriba";
  const m = movimiento(apertura, alcance)[lado];
  const forma = sube
    ? [[linea[0][0], -LEJOS] as Punto, [linea[linea.length - 1][0], -LEJOS] as Punto, ...[...linea].reverse()]
    : [...linea, [linea[linea.length - 1][0], LEJOS] as Punto, [linea[0][0], LEJOS] as Punto];
  const anchos = anchosFibra(linea.length, apertura, sube ? 5 : 8);
  const alma = linea.concat(linea.map(([x, y], i) => [x, y + (sube ? -anchos[i] : anchos[i])] as Punto).reverse());
  const rizos = RIZOS[lado].map(([cx, semiancho, fondo]) => {
    const tramo = linea.filter(([x]) => Math.abs(x - cx) <= semiancho);
    const vuelta = tramo.map(([x, y]) => {
      const s = Math.cos(((x - cx) / semiancho) * (Math.PI / 2));
      return [x + (sube ? 6 : -6) * s * apertura, y + (sube ? 1 : -1) * fondo * s * s * Math.min(1, apertura * 2.5)] as Punto;
    });
    return trazado(tramo.concat(vuelta.reverse()));
  });
  const transformacion = `translate(${m.dx.toFixed(2)} ${m.dy.toFixed(2)}) rotate(${m.giro.toFixed(3)} ${CX} ${CY})`;
  const recorte = `${id}-${lado}`;

  return (
    <g transform={transformacion}>
      {apertura > 0 && (
        <path
          d={trazado(linea, false)}
          fill="none"
          stroke="#000"
          strokeOpacity={0.55 * Math.min(1, apertura * 3)}
          strokeWidth={26}
          transform={`translate(0 ${sube ? 12 : -12})`}
          filter={`url(#${id}-difuso)`}
        />
      )}
      <clipPath id={recorte}>
        <path d={trazado(forma)} />
      </clipPath>
      <g clipPath={`url(#${recorte})`}>{children}</g>
      {apertura > 0 && (
        <>
          <path d={trazado(alma)} fill="#fbfaf6" />
          {rizos.map((rizo, i) => (
            <path key={i} d={rizo} fill={`url(#${id}-rizo-${lado})`} stroke="#fff" strokeWidth={1} />
          ))}
        </>
      )}
    </g>
  );
}

// --- Componente -------------------------------------------------------------

export function PapelRasgado({
  palabra,
  rotulo,
  foto,
  altFoto,
  pieIzquierda = "PAPEL DE CALCO · Nº 014",
  pieDerecha = "BAJA PARA ABRIR ↓",
  recorrido = "170svh",
  papel = "#ebe6dc",
  tinta = "#c2452f",
  sobrePapel,
  children,
  ...resto
}: {
  palabra: string;
  rotulo: string;
  foto: string;
  altFoto: string;
  pieIzquierda?: string;
  pieDerecha?: string;
  /** Scroll que dura el desgarro, además del alto de la pantalla. */
  recorrido?: string;
  papel?: string;
  tinta?: string;
  /** Lo que se ve sobre el papel entero; se retira en cuanto se agrieta. */
  sobrePapel?: ReactNode;
  /** Lo que aparece sobre la foto cuando la hoja ya está abierta. */
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<"div">, "children">) {
  const raiz = useRef<HTMLDivElement>(null);
  const escenario = useRef<HTMLDivElement>(null);
  const pegado = useRef<HTMLDivElement>(null);
  const id = "pr" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const linea = useMemo(() => lineaDesgarro(), []);
  const [p, setP] = useState(0);
  const [mirada, setMirada] = useState<Punto>([0, 0]);
  // Con el SVG en "meet", una pantalla alta enseña mucho más papel por
  // encima y por debajo: la hoja tiene que abrirse más para despejarla.
  const [alcance, setAlcance] = useState(1);

  useEffect(() => {
    const fijo = escenario.current;
    if (!fijo) return;
    const medir = () => {
      const altoVisible = (fijo.clientHeight * 928) / Math.max(1, fijo.clientWidth);
      setAlcance(Math.max(1, altoVisible / 2 / 300));
    };
    medir();
    const observador = new ResizeObserver(medir);
    observador.observe(fijo);
    return () => observador.disconnect();
  }, []);

  useEffect(() => {
    const nodo = raiz.current;
    const fijo = escenario.current;
    const marco = pegado.current;
    if (!nodo || !fijo || !marco) return;
    const menos = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let cuadro = 0;
    let visible = false;
    let actual = 0;
    const puntero = { x: 0, y: 0, dentro: false };
    const miradaActual: Punto = [0, 0];

    const alMover = (e: PointerEvent) => {
      const caja = fijo.getBoundingClientRect();
      puntero.x = (e.clientX - caja.left) / caja.width - 0.5;
      puntero.y = (e.clientY - caja.top) / caja.height - 0.5;
      puntero.dentro = true;
    };
    const alSalir = () => (puntero.dentro = false);

    const avanzar = () => {
      cuadro = 0;
      if (!visible) return;
      const caja = nodo.getBoundingClientRect();
      // Lo que dura pegado: el marco incluye la orla, que no cuenta.
      const recorrido = nodo.offsetHeight - marco.offsetHeight;
      const objetivo = recorrido > 0 ? acotar(-caja.top / recorrido) : 0;
      // Con movimiento reducido no hay transición: cerrada o abierta.
      actual = menos ? (objetivo > 0.3 ? 1 : 0) : actual + (objetivo - actual) * 0.14;
      if (Math.abs(objetivo - actual) < 0.0005) actual = objetivo;

      // La foto se asoma hacia el puntero, como quien mira por el hueco.
      const quiere: Punto = puntero.dentro && !menos ? [puntero.x, puntero.y] : [0, 0];
      miradaActual[0] += (quiere[0] - miradaActual[0]) * 0.08;
      miradaActual[1] += (quiere[1] - miradaActual[1]) * 0.08;

      setP((antes) => (Math.abs(antes - actual) > 1e-4 ? actual : antes));
      setMirada((antes) =>
        Math.abs(antes[0] - miradaActual[0]) > 1e-3 || Math.abs(antes[1] - miradaActual[1]) > 1e-3
          ? [miradaActual[0], miradaActual[1]]
          : antes,
      );
      cuadro = requestAnimationFrame(avanzar);
    };

    const observador = new IntersectionObserver(([entrada]) => {
      visible = entrada.isIntersecting;
      if (visible && !cuadro) cuadro = requestAnimationFrame(avanzar);
    });
    observador.observe(nodo);
    fijo.addEventListener("pointermove", alMover);
    fijo.addEventListener("pointerleave", alSalir);
    return () => {
      cancelAnimationFrame(cuadro);
      observador.disconnect();
      fijo.removeEventListener("pointermove", alMover);
      fijo.removeEventListener("pointerleave", alSalir);
    };
  }, []);

  const t = tiempos(p);
  const avanceGrieta = t.grieta * 620;
  const grieta = linea.filter(([x]) => Math.abs(x - CX) <= avanceGrieta);
  const sacudida = Math.sin(p * 900) * 6 * t.sacudida;
  // La foto sube desde detrás y se asienta, un pelo más grande de lo justo.
  const subida = (1 - t.subida) * 120;
  const escala = 1.18 - 0.1 * t.subida;

  const hoja = (
    <>
      <rect x={-LEJOS} y={-LEJOS} width={LEJOS * 2 + ANCHO} height={LEJOS * 2} fill={papel} />
      {/* Cuadrícula del papel de calco. */}
      <rect x={-LEJOS} y={-LEJOS} width={LEJOS * 2 + ANCHO} height={LEJOS * 2} fill={`url(#${id}-reticula)`} />
      <text
        x={CX}
        y={150}
        textAnchor="middle"
        fill="#2a2724"
        style={{ font: "500 22px var(--font-mono-ui), ui-monospace, monospace", letterSpacing: "0.42em" }}
      >
        {rotulo}
      </text>
      <text
        x={CX}
        y={410}
        textAnchor="middle"
        textLength={860}
        lengthAdjust="spacingAndGlyphs"
        fill={tinta}
        style={{ fontFamily: "var(--font-serif), Georgia, serif", fontStyle: "italic", fontSize: 240 }}
      >
        {palabra}
      </text>
      <text x={70} y={490} fill="#8b857b" style={{ font: "400 10px var(--font-mono-ui), ui-monospace, monospace", letterSpacing: "0.2em" }}>
        {pieIzquierda}
      </text>
      <text x={930} y={490} textAnchor="end" fill="#8b857b" style={{ font: "400 10px var(--font-mono-ui), ui-monospace, monospace", letterSpacing: "0.2em" }}>
        {pieDerecha}
      </text>
    </>
  );

  return (
    <div
      ref={raiz}
      {...resto}
      className={`relative w-full ${resto.className ?? ""}`}
      style={{ height: `calc(100svh + ${ORLA} + ${recorrido})`, overflow: "clip" }}
    >
      <div
        ref={pegado}
        className="sticky top-0 w-full"
        style={{
          background: NEGRO_PORTADA,
          height: `calc(100svh + ${ORLA})`,
          maskImage: BORDE_TINTA,
          WebkitMaskImage: BORDE_TINTA,
          maskSize: "100% 100%",
          WebkitMaskSize: "100% 100%",
          maskRepeat: "no-repeat",
          WebkitMaskRepeat: "no-repeat",
        }}
      >
        <div ref={escenario} className="relative h-[100svh] w-full overflow-hidden" style={{ background: NEGRO_PORTADA }}>
          <svg
            viewBox={MARCO}
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label={`${rotulo}. ${palabra}. La hoja se rasga y deja ver: ${altFoto}.`}
            className="absolute inset-0 block h-full w-full"
          >
            <defs>
              <pattern id={`${id}-reticula`} width="24" height="24" patternUnits="userSpaceOnUse">
                <path d="M24 0H0V24" fill="none" stroke="#6f63c9" strokeOpacity="0.09" strokeWidth="1" />
              </pattern>
              <linearGradient id={`${id}-rizo-arriba`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#ffffff" />
                <stop offset="1" stopColor="#d9d4cb" />
              </linearGradient>
              <linearGradient id={`${id}-rizo-abajo`} x1="0" y1="1" x2="0" y2="0">
                <stop offset="0" stopColor="#ffffff" />
                <stop offset="1" stopColor="#d9d4cb" />
              </linearGradient>
              <linearGradient id={`${id}-velo`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0.35" stopColor="#08080a" stopOpacity="0" />
                <stop offset="1" stopColor="#08080a" stopOpacity="0.85" />
              </linearGradient>
              <filter id={`${id}-difuso`} x="-20%" y="-50%" width="140%" height="200%">
                <feGaussianBlur stdDeviation="8" />
              </filter>
            </defs>

            <g transform={`translate(${sacudida.toFixed(2)} ${(sacudida * 0.4).toFixed(2)})`}>
              {/* Detrás del papel: la piel, que sube hacia el hueco. */}
              {t.apertura > 0 && (
                <g
                  transform={`translate(${CX + mirada[0] * -24} ${CY + subida + mirada[1] * -14}) scale(${escala.toFixed(4)})`}
                >
                  <image
                    href={foto}
                    x={-620}
                    y={-330 * alcance}
                    width={1240}
                    height={660 * alcance}
                    preserveAspectRatio="xMidYMid slice"
                  />
                  <rect x={-620} y={-330 * alcance} width={1240} height={660 * alcance} fill={`url(#${id}-velo)`} />
                </g>
              )}

              {t.apertura > 0 ? (
                <>
                  <Mitad id={id} lado="arriba" linea={linea} apertura={t.apertura} alcance={alcance}>
                    {hoja}
                  </Mitad>
                  <Mitad id={id} lado="abajo" linea={linea} apertura={t.apertura} alcance={alcance}>
                    {hoja}
                  </Mitad>
                </>
              ) : (
                hoja
              )}

              {t.grieta > 0 && t.apertura < 0.15 && grieta.length > 1 && (
                <path
                  d={trazado(grieta, false)}
                  fill="none"
                  stroke="#1d0f07"
                  strokeWidth={2.4}
                  strokeLinejoin="bevel"
                  opacity={1 - t.apertura / 0.15}
                />
              )}
            </g>
          </svg>

          {sobrePapel && (
            <div
              className="absolute inset-0"
              style={{
                opacity: 1 - t.grieta * 1.6,
                visibility: t.grieta > 0.62 ? "hidden" : "visible",
              }}
            >
              {sobrePapel}
            </div>
          )}

          {/* La foto se funde abajo con el negro de la orla. Entra con la
              subida de la foto y no con el texto: si se baja deprisa, el
              escenario puede irse antes de que el texto llegue, y sin esto
              la foto cortaría en recto. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[45svh]"
            style={{
              background: `linear-gradient(to bottom, transparent, ${NEGRO_PORTADA})`,
              opacity: Math.max(t.subida, t.texto),
            }}
          />

          {children && (
            <div
              className="absolute inset-0"
              style={{
                // Invisible no debe poder pulsarse: los enlaces de dentro
                // solo responden cuando ya se ven.
                pointerEvents: t.texto > 0.6 ? "auto" : "none",
                opacity: t.texto,
                transform: `translate3d(0, ${((1 - t.texto) * 24).toFixed(1)}px, 0)`,
              }}
            >
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
