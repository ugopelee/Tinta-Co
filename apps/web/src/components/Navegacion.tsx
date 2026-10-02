"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { estudio } from "@tinta/compartido/estudio";
import { MenuCuenta, type Sesion } from "@/components/MenuCuenta";

const ENLACES = [
  { id: "estudio", texto: "Estudio" },
  { id: "servicios", texto: "Servicios" },
  { id: "catalogo", texto: "Catálogo" },
];

/** En móvil la píldora no da para todo: estas quedan a un gesto de scroll. */
const SOLO_ESCRITORIO = new Set(["estudio"]);

/** Horas de apertura, las mismas que dice `estudio.contacto.horario`. */
const ABRE = 11;
const CIERRA = 20;

/**
 * Tramo del desgarro de la portada (0 = papel entero, 1 = foto y texto ya
 * puestos) en el que entra cada pieza del menú. Van solapadas y en orden,
 * acompañando a la hoja mientras se abre: nada aparece de golpe.
 */
const TRAMOS = {
  velo: [0.3, 0.7],
  logo: [0.3, 0.5],
  pildora: [0.38, 0.58],
  enlace0: [0.44, 0.62],
  enlace1: [0.48, 0.66],
  enlace2: [0.52, 0.7],
  reservar: [0.58, 0.78],
  reloj: [0.62, 0.8],
  cuenta: [0.66, 0.86],
} as const satisfies Record<string, readonly [number, number]>;

type Pieza = keyof typeof TRAMOS;
const PIEZAS = Object.keys(TRAMOS) as Pieza[];

/** Por debajo de este avance el menú no se puede pulsar ni enfocar. */
const UMBRAL_USO = 0.45;

const acotar = (x: number) => (x <= 0 ? 0 : x > 1 ? 1 : x);
const suave = ([a, b]: readonly [number, number], x: number) => {
  const t = acotar((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/**
 * Estilo de una pieza que entra: se enfoca, baja unos píxeles y se hace
 * opaca según su variable `--k-<pieza>`, que escribe el bucle de scroll.
 */
function entrada(pieza: Pieza, caida = 10): CSSProperties {
  const k = `var(--k-${pieza})`;
  return {
    opacity: k,
    transform: `translate3d(0, calc((1 - ${k}) * ${-caida}px), 0)`,
    filter: `blur(calc((1 - ${k}) * 6px))`,
  };
}

/** Antes de hidratar todo está a cero: sin parpadeo del menú sobre el papel. */
const ESCONDIDO = Object.fromEntries(PIEZAS.map((p) => [`--k-${p}`, 0])) as CSSProperties;

/** Hora y día de la semana en Madrid, sea cual sea la zona de quien mira. */
function ahoraEnMadrid() {
  const partes = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Madrid",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const valor = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? "";
  const dia = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(valor("weekday"));
  const hora = Number(valor("hour"));
  return {
    texto: `${valor("hour")}:${valor("minute")}`,
    abierto:
      (estudio.contacto.diasAbiertos as readonly number[]).includes(dia) && hora >= ABRE && hora < CIERRA,
  };
}

/**
 * Logo a la izquierda, una píldora de cristal centrada (abajo en móvil, al
 * alcance del pulgar) con un fondo que se desliza bajo la sección que cruza
 * el centro de la pantalla, y a la derecha si el estudio está abierto y la
 * cuenta. Mientras la portada es papel no hay menú: entra pieza a pieza
 * con el desgarro, al ritmo del scroll.
 */
export function Navegacion({ sesion }: { sesion: Sesion | null }) {
  const raiz = useRef<HTMLDivElement>(null);
  const lista = useRef<HTMLUListElement>(null);
  const [activa, setActiva] = useState("");
  const [marca, setMarca] = useState({ x: 0, ancho: 0 });
  const [reloj, setReloj] = useState<{ texto: string; abierto: boolean } | null>(null);

  useEffect(() => {
    const observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (entrada.isIntersecting) setActiva(entrada.target.id);
        }
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    for (const id of ["inicio", ...ENLACES.map((e) => e.id), "reserva", "contacto"]) {
      const nodo = document.getElementById(id);
      if (nodo) observador.observe(nodo);
    }
    return () => observador.disconnect();
  }, []);

  // Se mide tras pintar para que el fondo caiga justo bajo el enlace.
  useLayoutEffect(() => {
    const enlace = lista.current?.querySelector<HTMLElement>(`[data-id="${activa}"]`);
    const siguiente = enlace ? { x: enlace.offsetLeft, ancho: enlace.offsetWidth } : { x: 0, ancho: 0 };
    const cuadro = requestAnimationFrame(() => setMarca(siguiente));
    return () => cancelAnimationFrame(cuadro);
  }, [activa]);

  useEffect(() => {
    const tic = () => setReloj(ahoraEnMadrid());
    const primero = window.setTimeout(tic, 0);
    const intervalo = window.setInterval(tic, 15_000);
    return () => {
      window.clearTimeout(primero);
      window.clearInterval(intervalo);
    };
  }, []);

  // El avance de la portada se calcula igual que en PapelRasgado y con el
  // mismo suavizado, así menú y hoja se mueven a la par. Va a variables
  // CSS: un estado de React por fotograma sería derroche.
  useEffect(() => {
    const nodo = raiz.current;
    if (!nodo) return;
    const menos = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let cuadro = 0;
    let actual = -1;

    const objetivo = () => {
      const portada = document.getElementById("inicio");
      if (!portada) return 1;
      // El escenario pegado (primer hijo) incluye la orla de tinta: lo que
      // dura la portada es lo que queda de alto cuando se le resta.
      const pegado = portada.firstElementChild as HTMLElement | null;
      const recorrido = portada.offsetHeight - (pegado?.offsetHeight ?? window.innerHeight);
      return recorrido > 0 ? acotar(-portada.getBoundingClientRect().top / recorrido) : 1;
    };

    const pintar = (p: number) => {
      for (const pieza of PIEZAS) {
        nodo.style.setProperty(`--k-${pieza}`, suave(TRAMOS[pieza], p).toFixed(3));
      }
      // Lo que aún no se ve no debe poder pulsarse ni recibir el foco.
      nodo.inert = p < UMBRAL_USO;
    };

    const avanzar = () => {
      cuadro = 0;
      const meta = objetivo();
      // Al cargar ya bajado, o con movimiento reducido, no hay transición.
      actual = actual < 0 || menos ? meta : actual + (meta - actual) * 0.14;
      if (Math.abs(meta - actual) < 0.0005) actual = meta;
      pintar(actual);
      if (actual !== meta) cuadro = requestAnimationFrame(avanzar);
    };

    const alMoverse = () => {
      if (!cuadro) cuadro = requestAnimationFrame(avanzar);
    };

    avanzar();
    window.addEventListener("scroll", alMoverse, { passive: true });
    window.addEventListener("resize", alMoverse);
    return () => {
      cancelAnimationFrame(cuadro);
      window.removeEventListener("scroll", alMoverse);
      window.removeEventListener("resize", alMoverse);
    };
  }, []);

  return (
    <div ref={raiz} inert style={ESCONDIDO}>
      {/* Velo superior: el contenido que pasa por debajo se funde en vez de
          chocar con el logo y la cuenta. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 z-40 h-32 bg-gradient-to-b from-fondo via-fondo/80 to-transparent"
        style={{ opacity: "var(--k-velo)" }}
      />

      <Link
        href="/"
        aria-label={`${estudio.nombre}, inicio`}
        className="group fixed left-5 top-4 z-50 flex items-center gap-3 md:left-8 md:top-[1.1rem]"
        style={entrada("logo")}
      >
        {/* El logo es negro sobre blanco, como en el panel: va en su baldosa
            blanca para que el dibujo se lea entero sobre el fondo oscuro. */}
        <span className="grid h-12 w-12 place-items-center overflow-hidden rounded-full bg-white p-1 shadow-[0_6px_24px_-6px_rgb(0_0_0/0.7)] ring-1 ring-white/30 transition-transform duration-700 ease-[var(--ease-salida)] group-hover:-rotate-6 group-hover:scale-105 md:h-14 md:w-14">
          <Image src="/logo.png" alt="" width={112} height={112} priority className="h-full w-full object-contain" />
        </span>
        <span className="hidden font-serif text-[1.5rem] leading-none tracking-[-0.01em] [text-shadow:0_2px_12px_rgb(0_0_0/0.6)] sm:inline">
          Tinta<span className="italic text-acento-suave">&amp;</span>Co
        </span>
      </Link>

      <div className="fixed right-5 top-5 z-50 flex items-center gap-3 md:right-8 md:top-6">
        <p
          className="hidden items-center gap-2.5 whitespace-nowrap rounded-full border border-white/[0.16] bg-[#141418]/85 py-2.5 pl-3.5 pr-4 font-menu text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-white/80 shadow-[0_20px_50px_-12px_rgb(0_0_0/0.95)] backdrop-blur-xl lg:flex"
          title={estudio.contacto.horario}
          style={entrada("reloj")}
        >
          <span className="relative flex h-1.5 w-1.5">
            {reloj?.abierto && (
              <span className="absolute inset-0 animate-ping rounded-full bg-[#7ad69b] opacity-60" />
            )}
            <span
              className={`relative h-1.5 w-1.5 rounded-full ${reloj?.abierto ? "bg-[#7ad69b]" : "bg-texto/30"}`}
            />
          </span>
          {reloj ? (reloj.abierto ? "Abierto" : "Cerrado") : "Madrid"}
          <span className="text-white/30">·</span>
          <span className="tabular-nums text-white">Madrid {reloj?.texto ?? "--:--"}</span>
        </p>

        <div style={entrada("cuenta")}>
          {sesion ? (
            <MenuCuenta sesion={sesion} />
          ) : (
            <Link
              href="/acceder"
              className="block rounded-full border border-white/[0.16] bg-[#141418]/85 px-4 py-2.5 font-menu text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-white/80 backdrop-blur-xl transition-colors hover:text-white"
            >
              Acceder
            </Link>
          )}
        </div>
      </div>

      <nav
        aria-label="Principal"
        className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 md:bottom-auto md:top-5"
      >
        <div
          className="flex items-center gap-1 rounded-full border border-white/[0.16] bg-[#141418]/85 p-1.5 font-menu shadow-[inset_0_1px_0_rgb(255_255_255/0.1),0_20px_50px_-12px_rgb(0_0_0/0.95)] backdrop-blur-xl backdrop-saturate-150"
          style={{
            opacity: "var(--k-pildora)",
            transform: "scale(calc(0.92 + var(--k-pildora) * 0.08))",
            filter: "blur(calc((1 - var(--k-pildora)) * 8px))",
          }}
        >
          <ul ref={lista} className="relative flex items-center">
            <span
              aria-hidden
              className="absolute inset-y-0 -z-10 rounded-full bg-white/[0.13] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)] transition-all duration-500 ease-[var(--ease-salida)]"
              style={{ left: marca.x, width: marca.ancho, opacity: marca.ancho ? 1 : 0 }}
            />
            {ENLACES.map((enlace, i) => {
              const actual = activa === enlace.id;
              return (
                <li
                  key={enlace.id}
                  data-id={enlace.id}
                  className={SOLO_ESCRITORIO.has(enlace.id) ? "hidden sm:block" : undefined}
                  style={entrada(`enlace${i}` as Pieza, 6)}
                >
                  <a
                    href={`#${enlace.id}`}
                    aria-current={actual ? "location" : undefined}
                    className={`flex items-baseline gap-1.5 rounded-full px-4 py-2.5 text-[0.78rem] font-semibold uppercase tracking-[0.08em] transition-colors md:px-5 ${
                      actual ? "text-white" : "text-white/75 hover:text-white"
                    }`}
                  >
                    <span
                      className={`hidden font-mono text-[0.6rem] font-normal tabular-nums tracking-normal transition-colors md:inline ${
                        actual ? "text-acento-suave" : "text-white/40"
                      }`}
                    >
                      0{i + 1}
                    </span>
                    {enlace.texto}
                  </a>
                </li>
              );
            })}
          </ul>

          <span className="mx-1 h-5 w-px bg-white/20" style={{ opacity: "var(--k-reservar)" }} />

          <a
            href="#reserva"
            className="group flex items-center gap-1.5 rounded-full bg-acento-suave px-5 py-2.5 text-[0.78rem] font-semibold uppercase tracking-[0.08em] text-[#140b08] shadow-[0_0_30px_-8px_var(--acento-suave)] transition-colors duration-300 hover:bg-white"
            style={entrada("reservar", 6)}
          >
            Reservar
            <span
              aria-hidden
              className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            >
              ↗
            </span>
          </a>
        </div>
      </nav>
    </div>
  );
}
