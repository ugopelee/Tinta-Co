/* eslint-disable @next/next/no-img-element -- las fotos vienen de Supabase Storage o /fotos/: <img> normal a propósito */
import type { PropsSeccion } from "../../contrato";
import { Reserva } from "../../comun/Reserva";
import { Contenedor, cx, Encabezado, lleno, Vacio } from "./comun";
import s from "./lamina.module.css";

/** Secciones alimentadas por el estudio: servicios, flash, estudio y reserva. */

const ESPACIO = "py-16 md:py-28";

function Cabeza({
  seccion,
  sitio,
  texto,
}: {
  seccion: { id: string; antetitulo: string; titulo: string };
  sitio: PropsSeccion<"servicios">["sitio"];
  texto: string;
}) {
  if (!lleno(seccion.antetitulo) && !lleno(seccion.titulo) && !lleno(texto)) return null;
  return (
    <div className="mb-10 grid gap-8 md:mb-14 md:grid-cols-12 md:items-end">
      <Encabezado
        sitio={sitio}
        id={seccion.id}
        antetitulo={seccion.antetitulo}
        titulo={seccion.titulo}
        idTitulo={`${seccion.id}-titulo`}
        className="md:col-span-8"
      />
      {lleno(texto) && (
        <p className="max-w-[42ch] leading-relaxed text-[var(--w-tinta-2)] md:col-span-4 md:justify-self-end">{texto.trim()}</p>
      )}
    </div>
  );
}

const nn = (i: number) => String(i + 1).padStart(2, "0");

/* ------------------------------------------------------------------ SERVICIOS */

export function Servicios({ seccion, sitio, datos }: PropsSeccion<"servicios">) {
  const servicios = datos.servicios;
  if (!servicios.length && !lleno(seccion.titulo)) return null;

  return (
    <section aria-labelledby={lleno(seccion.titulo) ? `${seccion.id}-titulo` : undefined} className={ESPACIO}>
      <Contenedor>
        <Cabeza seccion={seccion} sitio={sitio} texto={seccion.texto} />
        {servicios.length ? (
          <ol className={cx(s.marco, "divide-y divide-[var(--w-linea)]")}>
            {servicios.map((sv, i) => (
              <li key={sv.id} className="grid gap-x-8 gap-y-3 p-5 sm:p-7 md:grid-cols-12 md:items-baseline">
                <span aria-hidden className={cx(s.mono, "text-[0.75rem] text-[var(--w-acento-tinta)] md:col-span-1")}>
                  Nº {nn(i)}
                </span>
                <h3 className={cx(s.titular, s.tItem, "min-w-0 text-[var(--w-tinta)] md:col-span-4")}>{sv.nombre}</h3>
                <p className="max-w-[56ch] leading-relaxed text-[var(--w-tinta-2)] md:col-span-4">{sv.descripcion}</p>
                {lleno(sv.detalle) && (
                  <p className={cx(s.mono, "text-[0.75rem] text-[var(--w-tinta)] md:col-span-3 md:text-right")}>{sv.detalle}</p>
                )}
              </li>
            ))}
          </ol>
        ) : (
          <Vacio>Aún no hay servicios publicados.</Vacio>
        )}
      </Contenedor>
    </section>
  );
}

/* ------------------------------------------------------------------ FLASH */

const euros = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

export function Flash({ seccion, sitio, datos }: PropsSeccion<"flash">) {
  const limite = Math.min(24, Math.max(1, seccion.limite || 8));
  const piezas = datos.disenos.slice(0, limite);
  if (!piezas.length && !lleno(seccion.titulo)) return null;

  return (
    <section aria-labelledby={lleno(seccion.titulo) ? `${seccion.id}-titulo` : undefined} className={cx(s.puntos, ESPACIO)}>
      <Contenedor>
        <Cabeza seccion={seccion} sitio={sitio} texto={seccion.texto} />
        {piezas.length ? (
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {piezas.map((d, i) => {
              const meta = [d.estilo, d.tamano_aprox].filter((x): x is string => lleno(x));
              return (
                <li key={d.id} className={cx(s.marco, s.foto, "flex min-w-0 flex-col bg-[var(--w-fondo)]")}>
                  {d.imagen_url ? (
                    <img src={d.imagen_url} alt={d.nombre} loading="lazy" decoding="async" className="aspect-square w-full object-cover" />
                  ) : (
                    <div aria-hidden className="aspect-square w-full bg-[var(--w-placa)]" />
                  )}
                  <div className="flex flex-1 flex-col gap-2 border-t border-[var(--w-linea)] p-3 sm:p-4">
                    <div className={cx(s.mono, "flex items-center justify-between gap-2 text-[0.6875rem] text-[var(--w-acento-tinta)]")}>
                      <span aria-hidden>Nº {nn(i)}</span>
                      {typeof d.precio === "number" && <span className="text-[var(--w-tinta)]">{euros.format(d.precio)}</span>}
                    </div>
                    <h3 className={cx(s.titular, "text-[length:calc(var(--l-escala)*1.375rem)] text-[var(--w-tinta)]")}>{d.nombre}</h3>
                    {meta.length > 0 && (
                      <p className={cx(s.mono, "text-[0.6875rem] text-[var(--w-tinta-2)]")}>{meta.join(" · ")}</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <Vacio>Aún no hay diseños flash publicados.</Vacio>
        )}
      </Contenedor>
    </section>
  );
}

/* ------------------------------------------------------------------ ESTUDIO */

export function Estudio({ seccion, sitio, datos }: PropsSeccion<"estudio">) {
  const c = datos.contacto;
  const filas = [
    lleno(c.direccion) && { etiqueta: "Dirección", valor: c.direccion, href: null as string | null },
    lleno(c.horario) && { etiqueta: "Horario", valor: c.horario, href: null },
    lleno(c.telefono) && { etiqueta: "Teléfono", valor: c.telefono, href: `tel:${c.telefono.replace(/[^\d+]/g, "")}` },
    lleno(c.email) && { etiqueta: "Email", valor: c.email, href: `mailto:${c.email}` },
    lleno(c.instagram) && {
      etiqueta: "Instagram",
      valor: c.instagram,
      href: `https://www.instagram.com/${c.instagram.replace(/^@/, "")}`,
    },
  ].filter(Boolean) as { etiqueta: string; valor: string; href: string | null }[];
  if (!filas.length && !lleno(seccion.titulo)) return null;
  const mapa = lleno(c.direccion) ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.direccion)}` : null;

  return (
    <section aria-labelledby={lleno(seccion.titulo) ? `${seccion.id}-titulo` : undefined} className={ESPACIO}>
      <Contenedor>
        <Cabeza seccion={seccion} sitio={sitio} texto={seccion.texto} />
        {filas.length > 0 ? (
          <dl className={cx(s.marco, "divide-y divide-[var(--w-linea)]")}>
            {filas.map((f) => (
              <div key={f.etiqueta} className="grid gap-1 px-5 py-4 sm:px-7 md:grid-cols-12 md:items-baseline md:gap-8">
                <dt className={cx(s.mono, "text-[0.75rem] text-[var(--w-tinta-2)] md:col-span-3")}>{f.etiqueta}</dt>
                <dd className="min-w-0 break-words text-[1.0625rem] text-[var(--w-tinta)] md:col-span-9">
                  {f.href ? (
                    <a
                      href={f.href}
                      {...(f.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      className="underline decoration-[var(--w-linea)] underline-offset-4 transition-colors duration-150 hover:decoration-[var(--w-acento-tinta)]"
                    >
                      {f.valor}
                      {f.href.startsWith("http") && <span className="sr-only"> (se abre en otra pestaña)</span>}
                    </a>
                  ) : (
                    f.valor
                  )}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <Vacio>Aún no hay datos del estudio.</Vacio>
        )}
        {mapa && (
          <a
            href={mapa}
            target="_blank"
            rel="noopener noreferrer"
            className={cx(
              s.mono,
              s.boton,
              "mt-6 inline-flex min-h-11 items-center border border-[var(--w-tinta-2)] px-5 text-[0.8125rem] text-[var(--w-tinta)] hover:border-[var(--w-acento-tinta)] hover:text-[var(--w-acento-tinta)]",
            )}
          >
            Cómo llegar
            <span className="sr-only"> al estudio (se abre en otra pestaña)</span>
          </a>
        )}
      </Contenedor>
    </section>
  );
}

/* ------------------------------------------------------------------ RESERVA */

export function ReservaSeccion({ seccion, sitio, datos, vista }: PropsSeccion<"reserva">) {
  return (
    <section
      aria-labelledby={lleno(seccion.titulo) ? `${seccion.id}-titulo` : undefined}
      className={cx("border-t border-[var(--w-linea)] bg-[var(--w-placa)]", ESPACIO)}
    >
      <Contenedor className="grid gap-12 lg:grid-cols-12 lg:gap-10">
        <div className="min-w-0 lg:col-span-5">
          <Encabezado
            sitio={sitio}
            id={seccion.id}
            antetitulo={seccion.antetitulo}
            titulo={seccion.titulo}
            idTitulo={`${seccion.id}-titulo`}
          />
          {lleno(seccion.texto) && (
            <p className="mt-8 max-w-[44ch] text-[1.0625rem] leading-relaxed text-[var(--w-tinta-2)]">{seccion.texto.trim()}</p>
          )}
        </div>
        <div className={cx(s.marco, "min-w-0 lg:col-span-7")}>
          <Reserva datos={datos} vista={vista} />
        </div>
      </Contenedor>
    </section>
  );
}
