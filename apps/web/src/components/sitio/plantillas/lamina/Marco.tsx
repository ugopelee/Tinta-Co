import { menuDe } from "@tinta/compartido/web/catalogo";
import type { PropsMarco } from "../../contrato";
import { MenuMovil } from "./MenuMovil";
import { Contenedor, cx, esExterno, hayReserva, lleno, Marca } from "./comun";
import s from "./lamina.module.css";

const externo = (d: string) => (esExterno(d) ? { target: "_blank", rel: "noopener noreferrer" } : {});

function instagramUrl(v: string) {
  const t = v.trim();
  if (/^https?:\/\//i.test(t)) return t;
  return `https://www.instagram.com/${t.replace(/^@/, "").replace(/^instagram\.com\//i, "")}`;
}

export function Marco({ sitio, children }: PropsMarco) {
  const enlaces = menuDe(sitio).filter((l) => lleno(l.texto));
  const reserva = hayReserva(sitio);
  const { pie, marca } = sitio;
  const contacto = [
    lleno(pie.email) && { etiqueta: "Email", texto: pie.email.trim(), href: `mailto:${pie.email.trim()}`, fuera: false },
    lleno(pie.telefono) && {
      etiqueta: "Teléfono",
      texto: pie.telefono.trim(),
      href: `tel:${pie.telefono.replace(/[^\d+]/g, "")}`,
      fuera: false,
    },
    lleno(pie.instagram) && {
      etiqueta: "Instagram",
      texto: pie.instagram.trim().startsWith("http") ? "Instagram" : `@${pie.instagram.trim().replace(/^@/, "")}`,
      href: instagramUrl(pie.instagram),
      fuera: true,
    },
  ].filter(Boolean) as { etiqueta: string; texto: string; href: string; fuera: boolean }[];

  return (
    <div
      className={cx(s.raiz, "relative flex min-h-dvh flex-col overflow-x-clip bg-[var(--w-fondo)]")}
      data-titulos={sitio.tema.titulos}
      data-esquinas={sitio.tema.esquinas}
    >
      <a
        href="#contenido"
        className={cx(
          s.mono,
          "sr-only z-50 bg-[var(--w-acento)] px-4 py-3 text-sm text-[var(--w-sobre-acento)] focus:not-sr-only focus:fixed focus:left-4 focus:top-4",
        )}
      >
        Saltar al contenido
      </a>

      <header className="sticky top-0 z-40 border-b border-[var(--w-linea)] bg-[var(--w-fondo)]">
        <Contenedor className="flex h-16 items-center justify-between gap-6">
          <a href="#" className="-my-2 flex min-h-11 min-w-0 items-center py-2 text-[1.5rem] leading-none text-[var(--w-tinta)]">
            <Marca sitio={sitio} className="whitespace-nowrap" />
            <span className="sr-only">, ir al inicio</span>
          </a>

          {enlaces.length > 0 && (
            <nav aria-label="Principal" className="hidden lg:block">
              <ul className="flex items-center gap-7">
                {enlaces.map((l, i) => (
                  <li key={`${l.destino}-${i}`}>
                    <a
                      href={l.destino}
                      {...externo(l.destino)}
                      className={cx(
                        s.mono,
                        "relative flex min-h-11 items-center text-[0.75rem] text-[var(--w-tinta-2)] transition-colors duration-150 hover:text-[var(--w-tinta)]",
                        "after:absolute after:inset-x-0 after:bottom-2 after:h-px after:origin-left after:scale-x-0 after:bg-[var(--w-acento)] after:transition-transform after:duration-300 after:ease-[cubic-bezier(0.23,1,0.32,1)] hover:after:scale-x-100",
                      )}
                    >
                      {l.texto}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          <div className="flex shrink-0 items-center gap-3">
            {reserva && (
              <a
                href="#reserva"
                className={cx(
                  s.mono,
                  s.boton,
                  "hidden min-h-11 items-center border border-[var(--w-acento)] bg-[var(--w-acento)] px-5 text-[0.75rem] text-[var(--w-sobre-acento)] hover:border-[var(--w-tinta)] hover:bg-[var(--w-tinta)] hover:text-[var(--w-fondo)] sm:inline-flex",
                )}
              >
                Reservar cita
              </a>
            )}
            <MenuMovil enlaces={enlaces} reserva={reserva} />
          </div>
        </Contenedor>
      </header>

      <main id="contenido" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>

      <footer className="border-t border-[var(--w-linea)] bg-[var(--w-fondo)]">
        <Contenedor className="grid gap-10 pb-10 pt-16 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-7">
            {lleno(marca.eslogan) && (
              <p className={cx(s.titular, "text-[length:calc(var(--l-escala)*clamp(2rem,5vw,3.5rem))] text-[var(--w-tinta)]")}>
                {marca.eslogan.trim()}
              </p>
            )}
            {lleno(pie.texto) && (
              <p className="mt-4 max-w-[48ch] leading-relaxed text-[var(--w-tinta-2)]">{pie.texto.trim()}</p>
            )}
          </div>

          {contacto.length > 0 && (
            <dl className={cx(s.marco, "grid self-start divide-y divide-[var(--w-linea)] md:col-span-5")}>
              {contacto.map((c) => (
                <div key={c.etiqueta} className="flex min-w-0 items-baseline justify-between gap-4 px-4 py-3">
                  <dt className={cx(s.mono, "text-[0.75rem] text-[var(--w-tinta-2)]")}>{c.etiqueta}</dt>
                  <dd className="min-w-0 text-right">
                    <a
                      href={c.href}
                      {...(c.fuera ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      className="break-words text-[var(--w-tinta)] underline decoration-[var(--w-linea)] underline-offset-4 transition-colors duration-150 hover:decoration-[var(--w-acento-tinta)]"
                    >
                      {c.texto}
                      {c.fuera && <span className="sr-only"> (se abre en otra pestaña)</span>}
                    </a>
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </Contenedor>

        <Contenedor className="border-t border-[var(--w-linea)] py-5">
          <p className={cx(s.mono, "text-[0.75rem] text-[var(--w-tinta-2)]")}>
            © {lleno(marca.nombre) ? marca.nombre.trim() : "Todos los derechos reservados"}
          </p>
        </Contenedor>
      </footer>
    </div>
  );
}
