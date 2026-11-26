/* eslint-disable @next/next/no-img-element */
import type { PropsMarco } from "../../contrato";
import { menuDe } from "@tinta/compartido/web/catalogo";
import type { Sitio } from "@tinta/compartido/web/esquema";
import { Marca } from "@tinta/compartido/marca";
import { ANCHO, BOTON_PRIMARIO, Enlace, TITULOS, VERSALITAS, lleno, plano } from "./base";
import { CSS_REVISTA } from "./estilos";
import { MenuMovil } from "./MenuMovil";

const ENLACE_PIE =
  "inline-flex min-h-10 items-center underline decoration-[var(--w-linea)] hover:decoration-[var(--w-acento-tinta)]";

/** Nombre compuesto con la fuente de titulares: la primera palabra recta, el resto en cursiva. */
function Nombre({ nombre, className = "" }: { nombre: string; className?: string }) {
  const [primera, ...resto] = nombre.trim().split(/\s+/);
  return (
    <span className={`${TITULOS} ${className}`}>
      {primera}
      {resto.length > 0 && (
        <>
          {" "}
          <em className="italic">{resto.join(" ")}</em>
        </>
      )}
    </span>
  );
}

function Logo({ sitio, className = "" }: { sitio: Sitio; className?: string }) {
  const { logo, nombre } = sitio.marca;
  if (logo) return <img src={logo.url} alt={logo.alt || nombre} className={`w-auto object-contain ${className || "h-9 max-w-[12rem]"}`} />;
  return (
    <span className="inline-flex items-center gap-2.5">
      <Marca variante="trazo" className="size-6 shrink-0 text-[var(--w-acento-tinta)]" />
      <Nombre nombre={nombre || "Inicio"} className={`text-[1.75rem] leading-none tracking-[-0.015em] ${className}`} />
    </span>
  );
}

const instagramUrl = (v: string) => {
  const t = v.trim();
  if (/^https?:\/\//i.test(t)) return t;
  return `https://www.instagram.com/${t.replace(/^@/, "").replace(/^instagram\.com\//i, "")}`;
};
const instagramTexto = (v: string) => {
  const t = v.trim().replace(/\/+$/, "");
  const usuario = t.split("/").pop() ?? t;
  return `@${usuario.replace(/^@/, "")}`;
};

/** Cabecera de revista: cintillo con el lema y la marca, regla doble y navegación debajo. */
export function Marco({ sitio, children }: PropsMarco) {
  const enlaces = menuDe(sitio).map((e) => ({ texto: plano(e.texto), destino: e.destino }));
  const reserva = sitio.secciones.find((s) => s.visible && s.tipo === "reserva");
  const cta = reserva
    ? {
        texto: reserva.titulo.trim() && plano(reserva.titulo).length <= 22 ? plano(reserva.titulo) : "Reservar cita",
        destino: `#${reserva.id}`,
      }
    : null;
  const { pie, marca } = sitio;
  const hayContacto = lleno(pie.email) || lleno(pie.telefono) || lleno(pie.instagram);
  const anio = new Date().getFullYear();

  return (
    <div id="inicio" className="revista flex min-h-dvh flex-col">
      <style>{CSS_REVISTA}</style>

      <a
        href="#contenido"
        className={`${BOTON_PRIMARIO} sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50`}
      >
        Saltar al contenido
      </a>

      <header className="sticky top-0 z-40 bg-[var(--w-fondo)]">
        <div className="border-b border-[var(--w-linea)]">
          <div className={`${ANCHO} ${VERSALITAS} hidden min-h-9 items-center justify-between gap-6 text-[var(--w-tinta-2)] sm:flex`}>
            <p>{lleno(marca.eslogan) ? marca.eslogan : ""}</p>
            <p className="tabular-nums">Edición {anio}</p>
          </div>
        </div>
        <div className="relative border-b border-[var(--w-tinta)]">
          <div className={`${ANCHO} flex min-h-[4.5rem] items-center justify-between gap-6`}>
            <a href="#inicio" className="-my-2 inline-flex min-h-12 items-center py-2 text-[var(--w-tinta)]" aria-label={marca.nombre || "Inicio"}>
              <Logo sitio={sitio} />
            </a>

            <div className="hidden items-center gap-9 md:flex">
              {enlaces.length > 0 && (
                <nav aria-label="Principal">
                  <ul className="flex flex-wrap items-center gap-x-7 gap-y-1">
                    {enlaces.map((e, i) => (
                      <li key={`${e.destino}-${i}`}>
                        <Enlace
                          destino={e.destino}
                          className={`${TITULOS} inline-flex min-h-12 items-center text-[1.125rem] italic text-[var(--w-tinta-2)] underline decoration-transparent decoration-1 transition-[color,text-decoration-color] duration-150 hover:text-[var(--w-tinta)] hover:decoration-[var(--w-acento-tinta)]`}
                        >
                          {e.texto}
                        </Enlace>
                      </li>
                    ))}
                  </ul>
                </nav>
              )}
              {cta && (
                <Enlace destino={cta.destino} className={`${BOTON_PRIMARIO} min-h-11 px-5 text-[0.875rem]`}>
                  {cta.texto}
                </Enlace>
              )}
            </div>

            <MenuMovil enlaces={enlaces} cta={cta} />
          </div>
        </div>
      </header>

      <main id="contenido" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>

      <footer className="mt-24 border-t-4 border-double border-[var(--w-tinta)] pb-10 pt-12 lg:mt-32 lg:pt-16">
        <div className={ANCHO}>
          <div className="grid grid-cols-12 gap-x-4 gap-y-10 sm:gap-x-6 lg:gap-x-8">
            <div className="col-span-12 lg:col-span-6">
              <div className="text-[var(--w-tinta)]">
                {marca.logo ? (
                  <Logo sitio={sitio} className="h-12 max-w-[16rem]" />
                ) : (
                  <Nombre
                    nombre={marca.nombre || "Inicio"}
                    className="block text-[clamp(3rem,10vw,8rem)] leading-[0.9] tracking-[-0.035em]"
                  />
                )}
              </div>
              {lleno(marca.eslogan) && (
                <p className={`${TITULOS} mt-5 text-[1.5rem] italic leading-snug text-[var(--w-tinta)]`}>{marca.eslogan}</p>
              )}
              {lleno(pie.texto) && (
                <p className="mt-3 max-w-[48ch] whitespace-pre-line text-[0.95rem] leading-relaxed text-[var(--w-tinta-2)]">
                  {pie.texto}
                </p>
              )}
            </div>

            {hayContacto && (
              <div className="col-span-12 sm:col-span-6 lg:col-span-3 lg:col-start-8">
                <p className={`${VERSALITAS} text-[var(--w-tinta-2)]`}>Contacto</p>
                <ul className="mt-4 space-y-1 text-[0.95rem]">
                  {lleno(pie.telefono) && (
                    <li>
                      <a href={`tel:${pie.telefono.replace(/[^\d+]/g, "")}`} className={`${ENLACE_PIE} tabular-nums`}>
                        {pie.telefono}
                      </a>
                    </li>
                  )}
                  {lleno(pie.email) && (
                    <li>
                      <a href={`mailto:${pie.email.trim()}`} className={`${ENLACE_PIE} break-all`}>
                        {pie.email}
                      </a>
                    </li>
                  )}
                  {lleno(pie.instagram) && (
                    <li>
                      <Enlace destino={instagramUrl(pie.instagram)} className={ENLACE_PIE}>
                        Instagram {instagramTexto(pie.instagram)}
                      </Enlace>
                    </li>
                  )}
                </ul>
              </div>
            )}

            {enlaces.length > 0 && (
              <nav aria-label="Pie" className="col-span-12 sm:col-span-6 lg:col-span-2">
                <p className={`${VERSALITAS} text-[var(--w-tinta-2)]`}>Índice</p>
                <ul className="mt-4 space-y-1 text-[0.95rem]">
                  {enlaces.map((e, i) => (
                    <li key={`${e.destino}-${i}`}>
                      <Enlace destino={e.destino} className="inline-flex min-h-10 items-center hover:text-[var(--w-acento-tinta)]">
                        {e.texto}
                      </Enlace>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--w-linea)] pt-5 text-[0.8125rem] text-[var(--w-tinta-2)]">
            {lleno(marca.nombre) ? <p>© {anio} {marca.nombre}</p> : <span />}
          </div>
        </div>
      </footer>
    </div>
  );
}
