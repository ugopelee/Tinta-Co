/* eslint-disable @next/next/no-img-element -- logo subido al CRM (Supabase Storage) */
import { Marca } from "@tinta/compartido/marca";
import { menuDe } from "@tinta/compartido/web/catalogo";
import type { Sitio } from "@tinta/compartido/web/esquema";
import type { PropsMarco } from "../../contrato";
import { CSS_CARTEL } from "./estilos";
import { MenuMovil } from "./menu-movil";
import { Contenedor, ETIQUETA, Regla, TONOS, anclaReserva, atributosEnlace, claseBoton, cx, esExterna } from "./piezas";

/** Nombre con el símbolo del estudio y la fuente de titulares. */
function Logotipo({ sitio, grande = false }: { sitio: Sitio; grande?: boolean }) {
  const nombre = sitio.marca.nombre.trim() || "Inicio";
  return (
    <span
      className={cx(
        "inline-flex items-center gap-2.5 [font-family:var(--w-titulos)] leading-none",
        grande ? "text-5xl" : "text-[1.9rem] sm:text-4xl",
      )}
    >
      <Marca variante="trazo" className={grande ? "size-10" : "size-7 sm:size-8"} />
      <span>{nombre}</span>
    </span>
  );
}

function instagram(valor: string) {
  const v = valor.trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) {
    const usuario = v.replace(/\/+$/, "").split("/").pop() ?? v;
    return { href: v, texto: `@${usuario.replace(/^@/, "")}` };
  }
  const usuario = v.replace(/^@/, "");
  return { href: `https://www.instagram.com/${encodeURIComponent(usuario)}`, texto: `@${usuario}` };
}

export function Marco({ sitio, vista, children }: PropsMarco) {
  const enlaces = menuDe(sitio);
  const reserva = anclaReserva(sitio);
  const seccionReserva = sitio.secciones.find((s) => s.visible && s.tipo === "reserva");
  const textoCta =
    seccionReserva && "titulo" in seccionReserva && seccionReserva.titulo.trim() && seccionReserva.titulo.trim().length <= 22
      ? seccionReserva.titulo.trim()
      : "Reservar cita";
  const cta = reserva ? { texto: textoCta, destino: reserva } : null;

  const { pie } = sitio;
  const ig = instagram(pie.instagram);
  const contacto = [
    pie.email.trim() && { etiqueta: "Email", href: `mailto:${pie.email.trim()}`, texto: pie.email.trim(), externa: false },
    pie.telefono.trim() && {
      etiqueta: "Teléfono",
      href: `tel:${pie.telefono.replace(/[^\d+]/g, "")}`,
      texto: pie.telefono.trim(),
      externa: false,
    },
    ig && { etiqueta: "Instagram", href: ig.href, texto: ig.texto, externa: true },
  ].filter(Boolean) as { etiqueta: string; href: string; texto: string; externa: boolean }[];

  const nombre = sitio.marca.nombre.trim();

  return (
    <div className="ct flex min-h-dvh flex-col bg-[var(--w-fondo)] text-[var(--w-tinta)] [font-family:var(--w-texto)]">
      <style dangerouslySetInnerHTML={{ __html: CSS_CARTEL }} />

      <a
        href="#contenido"
        style={TONOS.acento}
        className={cx(
          "sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50",
          "focus:border-[3px] focus:border-[var(--w-tinta)] focus:bg-[var(--k-fondo)] focus:px-4 focus:py-3 focus:text-[var(--k-tinta)]",
          "focus:text-sm focus:font-extrabold focus:uppercase",
        )}
      >
        Saltar al contenido
      </a>

      <header
        style={TONOS.fondo}
        className="sticky top-0 z-40 border-b-[6px] border-[var(--w-tinta)] bg-[var(--k-fondo)] text-[var(--k-tinta)]"
      >
        <Contenedor className="flex h-[4.5rem] items-center justify-between gap-4">
          <a
            href={vista ? "#contenido" : "/"}
            className="min-w-0 shrink-0"
            aria-label={sitio.marca.logo ? undefined : `${nombre || "Inicio"}, ir al inicio`}
          >
            {sitio.marca.logo ? (
              <img
                src={sitio.marca.logo.url}
                alt={sitio.marca.logo.alt || nombre}
                className="h-9 w-auto max-w-[11rem] object-contain sm:h-10"
              />
            ) : (
              <Logotipo sitio={sitio} />
            )}
          </a>

          {enlaces.length > 0 && (
            <nav aria-label="Principal" className="hidden min-w-0 xl:block">
              <ul className="flex flex-wrap items-center gap-x-7 gap-y-1">
                {enlaces.map((e, i) => (
                  <li key={`${e.destino}-${i}`}>
                    <a {...atributosEnlace(e.destino)} className={cx("ct-subraya text-sm font-extrabold tracking-[0.08em] uppercase")}>
                      {e.texto}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          <div className="flex items-center gap-3">
            {cta && (
              <span className="hidden sm:block">
                <a {...atributosEnlace(cta.destino)} className={cx(claseBoton("lleno"), "min-h-11 rounded-full px-5 whitespace-nowrap")}>
                  {cta.texto}
                </a>
              </span>
            )}
            <MenuMovil enlaces={enlaces} cta={cta} />
          </div>
        </Contenedor>
      </header>

      <main id="contenido" className="flex-1">
        {children}
      </main>

      <footer style={TONOS.tinta} className="overflow-hidden bg-[var(--k-fondo)] text-[var(--k-tinta)]">
        <Contenedor className="pt-16 pb-10 lg:pt-20">
          <Regla />
          <div className="grid gap-10 pt-12 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <Logotipo sitio={sitio} grande />
              {pie.texto.trim() && (
                <p className="mt-6 max-w-[42ch] text-lg leading-relaxed whitespace-pre-line text-[var(--k-suave)]">
                  {pie.texto.trim()}
                </p>
              )}
            </div>
            {contacto.length > 0 && (
              <dl className="grid gap-6 sm:grid-cols-3 lg:col-span-7">
                {contacto.map((c) => (
                  <div key={c.etiqueta} className="min-w-0 border-t-[3px] border-[var(--k-borde)] pt-3">
                    <dt className={ETIQUETA}>{c.etiqueta}</dt>
                    <dd className="mt-2 text-lg font-semibold [overflow-wrap:anywhere]">
                      <a
                        href={c.href}
                        {...(c.externa || esExterna(c.href) ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                        className="underline decoration-2"
                      >
                        {c.texto}
                      </a>
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </Contenedor>

        {sitio.marca.eslogan.trim() && (
          <Contenedor className="pb-8">
            <p className="text-sm font-semibold">{sitio.marca.eslogan.trim()}</p>
          </Contenedor>
        )}
      </footer>
    </div>
  );
}
