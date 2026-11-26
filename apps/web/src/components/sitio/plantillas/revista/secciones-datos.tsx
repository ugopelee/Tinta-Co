/* eslint-disable @next/next/no-img-element */
import type { PropsSeccion } from "../../contrato";
import { Reserva } from "../../comun/Reserva";
import {
  ANCHO,
  CUERPO,
  Enfasis,
  Folio,
  H2,
  Margen,
  REJILLA,
  SECCION,
  TITULOS,
  VERSALITAS,
  Vacio,
  lleno,
  numeroDe,
} from "./base";
import { Revela } from "./Revela";

/** Entradilla a la derecha del titular, como en la cabecera de un artículo. */
function Cabecera({ antetitulo, titulo, texto }: { antetitulo: string; titulo: string; texto?: string }) {
  if (!lleno(titulo) && !lleno(texto) && !lleno(antetitulo)) return null;
  return (
    <div className={`${REJILLA} mb-12 gap-y-6 lg:mb-16`}>
      <Margen texto={antetitulo} />
      {lleno(titulo) && (
        <h2 className={`${H2} col-span-12 lg:col-span-7 lg:row-start-2`}>
          <Enfasis texto={titulo} />
        </h2>
      )}
      {lleno(texto) && (
        <p
          className={`${CUERPO} col-span-12 max-w-[44ch] self-end whitespace-pre-line lg:row-start-2 ${lleno(titulo) ? "lg:col-span-4 lg:col-start-9" : "lg:col-span-6"}`}
        >
          {texto}
        </p>
      )}
    </div>
  );
}

const ENLACE_FINO =
  "inline-flex min-h-10 items-center text-[var(--w-tinta-2)] underline decoration-[var(--w-linea)] transition-colors duration-150 hover:text-[var(--w-acento-tinta)] hover:decoration-current";

/* ------------------------------------------------------------------
   SERVICIOS · índice de la revista: nombre grande, descripción, precio
   ------------------------------------------------------------------ */

export function Servicios({ seccion, sitio, datos }: PropsSeccion<"servicios">) {
  const { id, antetitulo, titulo, texto } = seccion;
  const servicios = datos.servicios;

  return (
    <section className={SECCION}>
      <div className={ANCHO}>
        <Cabecera antetitulo={antetitulo} titulo={titulo} texto={texto} />

        {servicios.length === 0 ? (
          <Vacio>Estamos actualizando los servicios. Pregúntanos por la reserva.</Vacio>
        ) : (
          <ol className="border-b border-[var(--w-tinta)]">
            {servicios.map((s) => (
              <li
                key={s.id}
                className="grid grid-cols-12 gap-x-4 gap-y-3 border-t border-[var(--w-tinta)] py-8 sm:gap-x-6 lg:gap-x-8 lg:py-11"
              >
                <h3
                  className={`${TITULOS} col-span-12 text-[clamp(2rem,4.4vw,3.75rem)] leading-[1] tracking-[-0.025em] text-[var(--w-tinta)] lg:col-span-6`}
                >
                  {s.nombre}
                </h3>
                {lleno(s.descripcion) && (
                  <p className="col-span-12 max-w-[46ch] text-[1rem] leading-[1.65] text-[var(--w-tinta-2)] sm:col-span-8 lg:col-span-4 lg:self-end">
                    {s.descripcion}
                  </p>
                )}
                {lleno(s.detalle) && (
                  <p
                    className={`${TITULOS} col-span-12 text-[1.375rem] italic leading-tight text-[var(--w-acento-tinta)] sm:col-span-4 sm:text-right lg:col-span-2 lg:self-end`}
                  >
                    {s.detalle}
                  </p>
                )}
              </li>
            ))}
          </ol>
        )}
        <Folio numero={numeroDe(sitio, id)} marca={sitio.marca.nombre} />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------
   FLASH · catálogo en columnas de periódico, fotos a su proporción
   ------------------------------------------------------------------ */

const euros = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

export function Flash({ seccion, sitio, datos }: PropsSeccion<"flash">) {
  const { id, antetitulo, titulo, texto, limite } = seccion;
  const piezas = datos.disenos.slice(0, Math.max(1, Math.min(24, limite || 8)));

  return (
    <section className={SECCION}>
      <div className={ANCHO}>
        <Cabecera antetitulo={antetitulo} titulo={titulo} texto={texto} />

        {piezas.length === 0 ? (
          <Vacio>El catálogo flash se está renovando. Vuelve a mirar pronto.</Vacio>
        ) : (
          <ul className="columns-1 gap-x-6 sm:columns-2 lg:columns-3 lg:gap-x-8">
            {piezas.map((d) => {
              const detalles = [d.estilo, d.tamano_aprox].filter((x): x is string => lleno(x));
              return (
                <li key={d.id} className="mb-12 break-inside-avoid lg:mb-16">
                  <figure>
                    {d.imagen_url ? (
                      <Revela>
                        <img
                          src={d.imagen_url}
                          alt={d.nombre}
                          loading="lazy"
                          decoding="async"
                          className="block h-auto w-full bg-[var(--w-placa)] object-cover"
                        />
                      </Revela>
                    ) : (
                      <div aria-hidden className="aspect-[4/5] w-full rounded-[var(--w-radio)] bg-[var(--w-placa)]" />
                    )}
                    <figcaption className="mt-4 flex items-baseline justify-between gap-4 border-t border-[var(--w-linea)] pt-3">
                      <div className="min-w-0">
                        <p className={`${TITULOS} text-[1.5rem] leading-tight text-[var(--w-tinta)]`}>{d.nombre}</p>
                        {detalles.length > 0 && (
                          <p className="mt-1 text-[0.875rem] italic text-[var(--w-tinta-2)]">{detalles.join(" · ")}</p>
                        )}
                      </div>
                      {d.precio != null && d.precio > 0 && (
                        <p className={`${TITULOS} shrink-0 text-[1.375rem] tabular-nums text-[var(--w-acento-tinta)]`}>
                          {euros.format(d.precio)}
                        </p>
                      )}
                    </figcaption>
                  </figure>
                </li>
              );
            })}
          </ul>
        )}
        <Folio numero={numeroDe(sitio, id)} marca={sitio.marca.nombre} />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------
   ESTUDIO · el colofón: dirección, horario y contacto
   ------------------------------------------------------------------ */

const mapa = (direccion: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccion)}`;

const instagramUrl = (v: string) => `https://www.instagram.com/${v.trim().replace(/^@/, "")}`;

export function Estudio({ seccion, sitio, datos }: PropsSeccion<"estudio">) {
  const { id, antetitulo, titulo, texto } = seccion;
  const c = datos.contacto;
  const hay = lleno(c.direccion) || lleno(c.horario) || lleno(c.telefono) || lleno(c.email) || lleno(c.instagram);

  return (
    <section className={SECCION}>
      <div className={ANCHO}>
        <Cabecera antetitulo={antetitulo} titulo={titulo} texto={texto} />

        {!hay ? (
          <Vacio>Pronto publicaremos aquí cómo encontrarnos.</Vacio>
        ) : (
          <dl className="grid gap-x-8 gap-y-0 border-t border-[var(--w-tinta)] md:grid-cols-2 lg:grid-cols-4">
            {lleno(c.direccion) && (
              <div className="border-b border-[var(--w-linea)] py-7 md:pr-6">
                <dt className={`${VERSALITAS} text-[var(--w-tinta-2)]`}>Dónde</dt>
                <dd className={`${TITULOS} mt-4 text-[1.5rem] leading-snug text-[var(--w-tinta)]`}>
                  <address className="not-italic">{c.direccion}</address>
                  <a href={mapa(c.direccion)} target="_blank" rel="noopener noreferrer" className={`${ENLACE_FINO} font-[family-name:var(--w-texto)] text-[0.95rem]`}>
                    Cómo llegar<span className="sr-only"> (se abre en otra pestaña)</span>
                  </a>
                </dd>
              </div>
            )}
            {lleno(c.horario) && (
              <div className="border-b border-[var(--w-linea)] py-7 md:pr-6">
                <dt className={`${VERSALITAS} text-[var(--w-tinta-2)]`}>Cuándo</dt>
                <dd className={`${TITULOS} mt-4 whitespace-pre-line text-[1.5rem] leading-snug tabular-nums text-[var(--w-tinta)]`}>
                  {c.horario}
                </dd>
              </div>
            )}
            {(lleno(c.telefono) || lleno(c.email)) && (
              <div className="border-b border-[var(--w-linea)] py-7 md:pr-6">
                <dt className={`${VERSALITAS} text-[var(--w-tinta-2)]`}>Escríbenos</dt>
                <dd className="mt-4 space-y-1 text-[1rem]">
                  {lleno(c.telefono) && (
                    <p>
                      <a href={`tel:${c.telefono.replace(/[^\d+]/g, "")}`} className={`${ENLACE_FINO} tabular-nums text-[var(--w-tinta)]`}>
                        {c.telefono}
                      </a>
                    </p>
                  )}
                  {lleno(c.email) && (
                    <p>
                      <a href={`mailto:${c.email.trim()}`} className={`${ENLACE_FINO} break-all text-[var(--w-tinta)]`}>
                        {c.email}
                      </a>
                    </p>
                  )}
                </dd>
              </div>
            )}
            {lleno(c.instagram) && (
              <div className="border-b border-[var(--w-linea)] py-7">
                <dt className={`${VERSALITAS} text-[var(--w-tinta-2)]`}>Instagram</dt>
                <dd className="mt-4">
                  <a href={instagramUrl(c.instagram)} target="_blank" rel="noopener noreferrer" className={`${ENLACE_FINO} text-[1rem] text-[var(--w-tinta)]`}>
                    {c.instagram}
                    <span className="sr-only"> (se abre en otra pestaña)</span>
                  </a>
                </dd>
              </div>
            )}
          </dl>
        )}
        <Folio numero={numeroDe(sitio, id)} marca={sitio.marca.nombre} />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------
   RESERVA · entradilla a la izquierda y el formulario real a la derecha
   ------------------------------------------------------------------ */

export function ReservaSeccion({ seccion, sitio, datos, vista }: PropsSeccion<"reserva">) {
  const { id, antetitulo, titulo, texto } = seccion;

  return (
    <section className={SECCION}>
      <div className={ANCHO}>
        <div className={`${REJILLA} gap-y-12`}>
          <Margen texto={antetitulo} />
          <div className="col-span-12 lg:col-span-5 lg:row-start-2">
            {lleno(titulo) && (
              <h2 className={H2}>
                <Enfasis texto={titulo} />
              </h2>
            )}
            {lleno(texto) && <p className={`${CUERPO} mt-6 max-w-[42ch] whitespace-pre-line`}>{texto}</p>}
          </div>
          <div className="col-span-12 lg:col-span-6 lg:col-start-7 lg:row-start-2">
            <Reserva datos={datos} vista={vista} />
          </div>
        </div>
        <Folio numero={numeroDe(sitio, id)} marca={sitio.marca.nombre} />
      </div>
    </section>
  );
}
