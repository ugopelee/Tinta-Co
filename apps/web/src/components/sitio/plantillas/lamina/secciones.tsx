/* eslint-disable @next/next/no-img-element -- las fotos vienen de Supabase Storage o /fotos/: <img> normal a propósito */
import type { CSSProperties } from "react";
import type { PropsSeccion } from "../../contrato";
import { Boton, Contenedor, cx, Encabezado, lleno, parrafos, Pieza } from "./comun";
import s from "./lamina.module.css";

const ESPACIO = "py-16 md:py-28";

/* ------------------------------------------------------------------ PORTADA */

export function Portada({ seccion }: PropsSeccion<"portada">) {
  const { antetitulo, titulo, subtitulo, boton, botonSecundario, imagen } = seccion;
  const lineas = titulo
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const hayBotones = !!(boton && lleno(boton.texto)) || !!(botonSecundario && lleno(botonSecundario.texto));
  if (!lineas.length && !lleno(antetitulo) && !lleno(subtitulo) && !hayBotones && !imagen) return null;

  return (
    <section
      aria-labelledby={lineas.length ? `${seccion.id}-titulo` : undefined}
      className={cx(s.puntos, "border-b border-[var(--w-linea)] py-10 md:py-16")}
    >
      <Contenedor className={cx("grid gap-10 md:gap-8", imagen && "lg:grid-cols-12 lg:items-stretch")}>
        <div className={cx("flex min-w-0 flex-col justify-between gap-12", imagen && "lg:col-span-7")}>
          {lleno(antetitulo) ? (
            <Pieza n={null} className="bg-[var(--w-fondo)]">
              {antetitulo.trim()}
            </Pieza>
          ) : (
            <span />
          )}

          <div className="min-w-0">
            {lineas.length > 0 && (
              <h1 id={`${seccion.id}-titulo`} className={cx(s.titular, s.tPortada, "text-[var(--w-tinta)]")}>
                {lineas.map((linea, i) => (
                  <span key={i} className={s.linea}>
                    <span style={{ "--i": i } as CSSProperties}>{linea}</span>
                  </span>
                ))}
              </h1>
            )}

            {(lleno(subtitulo) || hayBotones) && (
              <div
                className={cx(s.aparecer, "mt-8 flex max-w-xl flex-col gap-8")}
                style={{ "--d": `${300 + lineas.length * 80}ms` } as CSSProperties}
              >
                {lleno(subtitulo) && (
                  <p className="text-[1.0625rem] leading-relaxed text-[var(--w-tinta)] sm:text-lg">{subtitulo.trim()}</p>
                )}
                {hayBotones && (
                  <div className="flex flex-wrap items-center gap-3">
                    <Boton boton={boton} />
                    <Boton boton={botonSecundario} variante="linea" />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {imagen && (
          <figure className={cx(s.marco, s.foto, "min-w-0 overflow-hidden bg-[var(--w-placa)] lg:col-span-5")}>
            <img
              src={imagen.url}
              alt={imagen.alt}
              fetchPriority="high"
              decoding="async"
              className="aspect-[4/5] size-full object-cover lg:aspect-auto lg:min-h-[32rem]"
            />
          </figure>
        )}
      </Contenedor>
    </section>
  );
}

/* ------------------------------------------------------------------ TEXTO */

export function Texto({ seccion, sitio }: PropsSeccion<"texto">) {
  const { antetitulo, titulo, cuerpo, imagen, lado, boton } = seccion;
  const ps = parrafos(cuerpo);
  if (!lleno(titulo) && !ps.length && !imagen && !(boton && lleno(boton.texto))) return null;
  const izquierda = lado === "izquierda";

  return (
    <section aria-labelledby={lleno(titulo) ? `${seccion.id}-titulo` : undefined} className={ESPACIO}>
      <Contenedor className={cx("grid items-center gap-12 md:gap-10", imagen && "md:grid-cols-12")}>
        <div className={cx("min-w-0", imagen && "md:col-span-6", imagen && izquierda && "md:order-2 md:col-start-7")}>
          <Encabezado sitio={sitio} id={seccion.id} antetitulo={antetitulo} titulo={titulo} idTitulo={`${seccion.id}-titulo`} />
          {ps.length > 0 && (
            <div className={cx("mt-8 space-y-5 text-[1.0625rem] leading-relaxed text-[var(--w-tinta-2)]", !imagen && "max-w-[65ch]")}>
              {ps.map((p, i) => (
                <p key={i} className="whitespace-pre-line">
                  {p}
                </p>
              ))}
            </div>
          )}
          {boton && lleno(boton.texto) && (
            <div className="mt-10">
              <Boton boton={boton} />
            </div>
          )}
        </div>

        {imagen && (
          <figure
            className={cx(
              s.marco,
              s.foto,
              "min-w-0 overflow-hidden bg-[var(--w-placa)] md:col-span-6",
              izquierda ? "md:order-1 md:col-start-1" : "md:col-start-7",
            )}
          >
            <img src={imagen.url} alt={imagen.alt} loading="lazy" decoding="async" className="aspect-[4/5] w-full object-cover sm:aspect-[4/3]" />
          </figure>
        )}
      </Contenedor>
    </section>
  );
}

/* ------------------------------------------------------------------ VENTAJAS */

export function Ventajas({ seccion, sitio }: PropsSeccion<"ventajas">) {
  const elementos = seccion.elementos.filter((e) => lleno(e.titulo) || lleno(e.texto));
  if (!elementos.length && !lleno(seccion.titulo)) return null;

  return (
    <section aria-labelledby={lleno(seccion.titulo) ? `${seccion.id}-titulo` : undefined} className={ESPACIO}>
      <Contenedor className="grid gap-12 md:grid-cols-12 md:gap-10">
        <Encabezado
          sitio={sitio}
          id={seccion.id}
          antetitulo={seccion.antetitulo}
          titulo={seccion.titulo}
          idTitulo={`${seccion.id}-titulo`}
          className="md:col-span-5 md:self-start lg:sticky lg:top-28"
        />
        {elementos.length > 0 && (
          <ol className={cx(s.marco, "divide-y divide-[var(--w-linea)] md:col-span-7")}>
            {elementos.map((e, i) => (
              <li key={i} className="grid grid-cols-[4.5rem_1fr] gap-x-4 p-5 sm:grid-cols-[6rem_1fr] sm:p-7">
                <span aria-hidden className={cx(s.mono, "pt-1 text-[0.75rem] text-[var(--w-acento-tinta)]")}>
                  Nº {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  {lleno(e.titulo) && <h3 className={cx(s.titular, s.tItem, "text-[var(--w-tinta)]")}>{e.titulo.trim()}</h3>}
                  {lleno(e.texto) && (
                    <p className={cx("max-w-[52ch] leading-relaxed text-[var(--w-tinta-2)]", lleno(e.titulo) && "mt-3")}>{e.texto.trim()}</p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </Contenedor>
    </section>
  );
}

/* ------------------------------------------------------------------ CIFRAS */

const COLUMNAS_CIFRAS: Record<number, string> = {
  1: "",
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
  5: "sm:grid-cols-3 lg:grid-cols-5",
  6: "sm:grid-cols-3",
};

export function Cifras({ seccion, sitio }: PropsSeccion<"cifras">) {
  const elementos = seccion.elementos.filter((e) => lleno(e.valor));
  if (!elementos.length && !lleno(seccion.titulo)) return null;

  return (
    <section
      aria-labelledby={lleno(seccion.titulo) ? `${seccion.id}-titulo` : undefined}
      className="border-y border-[var(--w-linea)] bg-[var(--w-placa)] py-16 md:py-24"
    >
      <Contenedor>
        <Encabezado
          sitio={sitio}
          id={seccion.id}
          antetitulo={seccion.antetitulo}
          titulo={seccion.titulo}
          idTitulo={`${seccion.id}-titulo`}
          className="mb-10 md:mb-14"
        />
        {elementos.length > 0 && (
          <dl
            className={cx(
              s.marco,
              "grid grid-cols-1 gap-px bg-[var(--w-linea)]",
              COLUMNAS_CIFRAS[elementos.length] ?? "sm:grid-cols-3",
            )}
          >
            {elementos.map((e, i) => (
              <div key={i} className="flex min-w-0 flex-col-reverse justify-end gap-4 bg-[var(--w-placa)] p-6">
                {lleno(e.etiqueta) && (
                  <dt className={cx(s.mono, "text-[0.75rem] text-[var(--w-tinta-2)]")}>{e.etiqueta.trim()}</dt>
                )}
                <dd className={cx(s.cifra, s.tGigante, "break-words text-[var(--w-tinta)]")}>{e.valor.trim()}</dd>
              </div>
            ))}
          </dl>
        )}
      </Contenedor>
    </section>
  );
}

/* ------------------------------------------------------------------ GALERÍA */

/** Mosaico asimétrico: una grande y el resto alrededor, en un ciclo de cinco. */
const TESELAS = ["col-span-2 row-span-2 md:col-span-4", "md:col-span-2", "md:col-span-2", "md:col-span-3", "md:col-span-3"];

export function Galeria({ seccion, sitio }: PropsSeccion<"galeria">) {
  const imagenes = seccion.imagenes.filter((i) => lleno(i.url));
  if (!imagenes.length && !lleno(seccion.titulo)) return null;

  return (
    <section aria-labelledby={lleno(seccion.titulo) ? `${seccion.id}-titulo` : undefined} className={ESPACIO}>
      <Contenedor>
        <Encabezado
          sitio={sitio}
          id={seccion.id}
          antetitulo={seccion.antetitulo}
          titulo={seccion.titulo}
          idTitulo={`${seccion.id}-titulo`}
          className="mb-10 md:mb-14"
        />
        {imagenes.length > 0 && (
          <ul
            className={cx(
              "grid grid-flow-dense auto-rows-[10.5rem] grid-cols-2 gap-3 sm:auto-rows-[14rem] md:grid-cols-6 lg:auto-rows-[17rem]",
              imagenes.length === 1 && "md:grid-cols-4",
            )}
          >
            {imagenes.map((img, i) => (
              <li
                key={`${img.url}-${i}`}
                className={cx(
                  s.marco,
                  s.foto,
                  "relative min-w-0 overflow-hidden bg-[var(--w-placa)]",
                  TESELAS[i % TESELAS.length],
                  imagenes.length === 2 && i === 1 && "col-span-2 md:col-span-2 md:row-span-2",
                  // Una foto suelta al final de un ciclo ocupa toda la fila para no dejar hueco.
                  i === imagenes.length - 1 && i % TESELAS.length === 3 && "col-span-2 md:col-span-6",
                )}
              >
                <img src={img.url} alt={img.alt} loading="lazy" decoding="async" className="size-full object-cover" />
                <span
                  aria-hidden
                  className={cx(s.mono, "absolute bottom-0 left-0 bg-[var(--w-fondo)] px-2 py-1 text-[0.6875rem] text-[var(--w-tinta)]")}
                >
                  Nº {String(i + 1).padStart(2, "0")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Contenedor>
    </section>
  );
}

/* ------------------------------------------------------------------ PREGUNTAS */

export function Preguntas({ seccion, sitio }: PropsSeccion<"preguntas">) {
  const elementos = seccion.elementos.filter((e) => lleno(e.pregunta));
  if (!elementos.length && !lleno(seccion.titulo)) return null;

  return (
    <section aria-labelledby={lleno(seccion.titulo) ? `${seccion.id}-titulo` : undefined} className={ESPACIO}>
      <Contenedor className="grid gap-12 md:grid-cols-12 md:gap-10">
        <Encabezado
          sitio={sitio}
          id={seccion.id}
          antetitulo={seccion.antetitulo}
          titulo={seccion.titulo}
          idTitulo={`${seccion.id}-titulo`}
          className="md:col-span-5 md:self-start lg:sticky lg:top-28"
        />
        {elementos.length > 0 && (
          <div className={cx(s.marco, "divide-y divide-[var(--w-linea)] md:col-span-7")}>
            {elementos.map((e, i) => (
              <details key={i} className={cx(s.pregunta, "group")}>
                <summary className="flex min-h-16 items-center justify-between gap-6 px-5 py-4 text-[var(--w-tinta)] sm:px-7">
                  <span className="text-[1.0625rem] font-semibold leading-snug sm:text-[1.1875rem]">{e.pregunta.trim()}</span>
                  <span
                    aria-hidden
                    className="flex size-9 shrink-0 items-center justify-center border border-[var(--w-linea)] transition-colors duration-150 group-open:border-[var(--w-acento)] group-open:bg-[var(--w-acento)] group-open:text-[var(--w-sobre-acento)]"
                  >
                    <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" className={s.mas}>
                      <path d="M10 4v12M4 10h12" />
                    </svg>
                  </span>
                </summary>
                {lleno(e.respuesta) && (
                  <div className={cx(s.respuesta, "px-5 pb-6 pr-16 sm:px-7")}>
                    {parrafos(e.respuesta).map((p, j) => (
                      <p key={j} className="mt-3 max-w-[62ch] leading-relaxed text-[var(--w-tinta-2)] first:mt-0">
                        {p}
                      </p>
                    ))}
                  </div>
                )}
              </details>
            ))}
          </div>
        )}
      </Contenedor>
    </section>
  );
}

/* ------------------------------------------------------------------ LLAMADA */

export function Llamada({ seccion }: PropsSeccion<"llamada">) {
  const { titulo, texto, boton } = seccion;
  if (!lleno(titulo) && !lleno(texto) && !(boton && lleno(boton.texto))) return null;

  return (
    <section aria-labelledby={lleno(titulo) ? `${seccion.id}-titulo` : undefined} className="py-8 md:py-12">
      <Contenedor>
        <div className={cx(s.sobreAcento, "grid items-end gap-10 border border-[var(--w-acento)] bg-[var(--w-acento)] p-6 text-[var(--w-sobre-acento)] sm:p-10 md:grid-cols-12 md:p-14")}>
          <div className="min-w-0 md:col-span-8">
            {lleno(titulo) && (
              <h2 id={`${seccion.id}-titulo`} className={cx(s.titular, s.tSeccion, "whitespace-pre-line")}>
                {titulo.trim()}
              </h2>
            )}
            {lleno(texto) && <p className="mt-6 max-w-[52ch] text-[1.0625rem] leading-relaxed">{texto.trim()}</p>}
          </div>
          {boton && lleno(boton.texto) && (
            <div className="md:col-span-4 md:justify-self-end">
              <Boton boton={boton} variante="inverso" />
            </div>
          )}
        </div>
      </Contenedor>
    </section>
  );
}
