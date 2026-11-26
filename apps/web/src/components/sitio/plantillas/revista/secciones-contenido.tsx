import type { PropsSeccion } from "../../contrato";
import {
  ANCHO,
  BOTON_PRIMARIO,
  Botones,
  CUERPO,
  Enfasis,
  Enlace,
  Folio,
  Foto,
  H2,
  Margen,
  REJILLA,
  SECCION,
  TITULOS,
  VERSALITAS,
  lleno,
  numeroDe,
  parrafos,
} from "./base";

/* ------------------------------------------------------------------
   PORTADA · cabecera de revista: titular a todo el ancho y foto a sangre
   ------------------------------------------------------------------ */

export function Portada({ seccion }: PropsSeccion<"portada">) {
  const { antetitulo, titulo, subtitulo, boton, botonSecundario, imagen } = seccion;
  if (!lleno(titulo) && !lleno(subtitulo) && !imagen && !boton && !botonSecundario) return null;

  return (
    <section className="pt-10 sm:pt-14 lg:pt-20">
      <div className={ANCHO}>
        {lleno(antetitulo) && (
          <p className={`${VERSALITAS} mb-6 flex items-center gap-3 text-[var(--w-tinta-2)]`}>
            <span aria-hidden className="h-px w-8 bg-[var(--w-acento-tinta)]" />
            {antetitulo}
          </p>
        )}
        {lleno(titulo) && (
          <h1
            className={`${TITULOS} text-balance text-[clamp(3rem,10.5vw,9rem)] leading-[0.92] tracking-[-0.04em] text-[var(--w-tinta)]`}
          >
            <Enfasis texto={titulo} auto />
          </h1>
        )}
        {(lleno(subtitulo) || boton || botonSecundario) && (
          <div className={`${REJILLA} mt-10 items-end gap-y-8 lg:mt-14`}>
            {lleno(subtitulo) && (
              <p className="col-span-12 max-w-[44ch] whitespace-pre-line text-[1.25rem] leading-[1.55] text-[var(--w-tinta-2)] lg:col-span-6 lg:col-start-1">
                {subtitulo}
              </p>
            )}
            {(boton || botonSecundario) && (
              <div className="col-span-12 lg:col-span-5 lg:col-start-8 lg:justify-self-end">
                <Botones principal={boton} secundario={botonSecundario} />
              </div>
            )}
          </div>
        )}
      </div>

      {imagen && (
        <div className="mt-12 lg:mt-16">
          <Foto imagen={imagen} prioridad recta pie={false} proporcion="aspect-[4/3] sm:aspect-[16/9] lg:aspect-[21/9]" />
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------
   TEXTO · artículo con capitular, columna de lectura de 65ch y foto vertical
   ------------------------------------------------------------------ */

export function Texto({ seccion, sitio }: PropsSeccion<"texto">) {
  const { id, antetitulo, titulo, cuerpo, imagen, lado, boton } = seccion;
  const bloques = parrafos(cuerpo);
  if (!lleno(titulo) && !bloques.length && !imagen && !boton) return null;
  const izquierda = lado === "izquierda";

  return (
    <section className={SECCION}>
      <div className={ANCHO}>
        <div className={`${REJILLA} items-start gap-y-10`}>
          <Margen texto={antetitulo} className="lg:col-start-1" />
          <div
            className={
              imagen
                ? `col-span-12 lg:col-span-5 lg:row-start-2 ${izquierda ? "lg:col-start-8" : "lg:col-start-1"}`
                : "col-span-12 lg:col-span-8 lg:col-start-3 lg:row-start-2"
            }
          >
            {lleno(titulo) && (
              <h2 className={`${H2} text-[var(--w-tinta)]`}>
                <Enfasis texto={titulo} />
              </h2>
            )}
            {bloques.length > 0 && (
              <div className={`${CUERPO} mt-8 max-w-[65ch] space-y-5 lg:mt-10`}>
                {bloques.map((p, i) => (
                  <p
                    key={i}
                    className={`whitespace-pre-line ${i === 0 ? "r-capital text-[1.1875rem] text-[var(--w-tinta)]" : ""}`}
                  >
                    {p}
                  </p>
                ))}
              </div>
            )}
            {boton && (
              <div className="mt-9">
                <Enlace destino={boton.destino} className={BOTON_PRIMARIO}>
                  {boton.texto}
                </Enlace>
              </div>
            )}
          </div>
          {imagen && (
            <Foto
              imagen={imagen}
              proporcion="aspect-[4/5]"
              className={`col-span-12 sm:col-span-9 lg:col-span-6 lg:row-span-2 lg:row-start-1 ${izquierda ? "lg:col-start-1" : "lg:col-start-7"}`}
            />
          )}
        </div>
        <Folio numero={numeroDe(sitio, id)} marca={sitio.marca.nombre} />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------
   VENTAJAS · columnas de periódico separadas por filetes verticales
   ------------------------------------------------------------------ */

export function Ventajas({ seccion, sitio }: PropsSeccion<"ventajas">) {
  const { id, antetitulo, titulo } = seccion;
  const elementos = seccion.elementos.filter((e) => lleno(e.titulo) || lleno(e.texto));
  if (!elementos.length && !lleno(titulo)) return null;

  return (
    <section className={SECCION}>
      <div className={ANCHO}>
        <div className={`${REJILLA} gap-y-10`}>
          <Margen texto={antetitulo} />
          {lleno(titulo) && (
            <h2 className={`${H2} col-span-12 max-w-[20ch] lg:col-span-9 lg:row-start-2`}>
              <Enfasis texto={titulo} />
            </h2>
          )}
        </div>
        {elementos.length > 0 && (
          <ul className="mt-12 grid gap-y-10 border-t border-[var(--w-tinta)] pt-10 md:grid-cols-2 lg:mt-16 lg:grid-cols-3 lg:pt-12">
            {elementos.map((e, i) => (
              <li
                key={i}
                className="md:px-8 md:[&:nth-child(odd)]:pl-0 md:[&:nth-child(even)]:border-l md:[&:nth-child(even)]:border-[var(--w-linea)] lg:border-l lg:border-[var(--w-linea)] lg:first:border-l-0 lg:first:pl-0 lg:[&:nth-child(3n+1)]:border-l-0 lg:[&:nth-child(3n+1)]:pl-0 lg:[&:nth-child(n+4)]:mt-10"
              >
                {lleno(e.titulo) && (
                  <h3 className={`${TITULOS} text-[1.75rem] italic leading-[1.1] tracking-[-0.01em] text-[var(--w-tinta)]`}>
                    {e.titulo}
                  </h3>
                )}
                {lleno(e.texto) && (
                  <p className={`${CUERPO} whitespace-pre-line ${lleno(e.titulo) ? "mt-3" : ""}`}>{e.texto}</p>
                )}
              </li>
            ))}
          </ul>
        )}
        <Folio numero={numeroDe(sitio, id)} marca={sitio.marca.nombre} />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------
   CIFRAS · datos sueltos entre filetes, cifras en serif enorme
   ------------------------------------------------------------------ */

export function Cifras({ seccion, sitio }: PropsSeccion<"cifras">) {
  const { id, antetitulo, titulo } = seccion;
  const elementos = seccion.elementos.filter((e) => lleno(e.valor));
  if (!elementos.length && !lleno(titulo)) return null;

  return (
    <section className={SECCION}>
      <div className={ANCHO}>
        <div className={`${REJILLA} gap-y-6`}>
          <Margen texto={antetitulo} />
          {lleno(titulo) && (
            <h2 className={`${H2} col-span-12 max-w-[22ch] lg:col-span-9 lg:row-start-2`}>
              <Enfasis texto={titulo} />
            </h2>
          )}
        </div>
        {elementos.length > 0 && (
          <dl className="mt-12 grid grid-cols-1 border-y border-[var(--w-tinta)] min-[480px]:grid-cols-2 lg:mt-16 lg:grid-flow-col lg:auto-cols-fr">
            {elementos.map((e, i) => (
              <div
                key={i}
                className="flex flex-col-reverse justify-end gap-3 border-b border-[var(--w-linea)] py-8 last:border-b-0 min-[480px]:px-6 min-[480px]:first:pl-0 lg:border-b-0 lg:border-l lg:py-10 lg:first:border-l-0"
              >
                {lleno(e.etiqueta) ? (
                  <dt className="text-[0.95rem] italic leading-snug text-[var(--w-tinta-2)]">{e.etiqueta}</dt>
                ) : (
                  <dt className="sr-only">Cifra {i + 1}</dt>
                )}
                <dd
                  className={`${TITULOS} break-words text-[clamp(3.25rem,7vw,6rem)] leading-[0.9] tracking-[-0.04em] tabular-nums text-[var(--w-tinta)]`}
                >
                  {e.valor}
                </dd>
              </div>
            ))}
          </dl>
        )}
        <Folio numero={numeroDe(sitio, id)} marca={sitio.marca.nombre} />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------
   GALERÍA · reportaje fotográfico: una foto a sangre y pares desplazados
   ------------------------------------------------------------------ */

const PIEZAS = [
  { caja: "col-span-12 lg:col-span-7", proporcion: "aspect-[4/3]" },
  { caja: "col-span-12 sm:col-span-8 lg:col-span-4 lg:col-start-9 lg:mt-40", proporcion: "aspect-[4/5]" },
  { caja: "col-span-12 sm:col-span-6 lg:col-span-4 lg:col-start-2", proporcion: "aspect-[4/5]" },
  { caja: "col-span-12 sm:col-span-6 lg:col-span-6 lg:col-start-7 lg:self-end", proporcion: "aspect-[3/2]" },
];

export function Galeria({ seccion, sitio }: PropsSeccion<"galeria">) {
  const { id, antetitulo, titulo, imagenes } = seccion;
  if (!imagenes.length && !lleno(titulo)) return null;
  const sola = imagenes.length === 1;

  return (
    <section className={SECCION}>
      <div className={ANCHO}>
        <div className={`${REJILLA} gap-y-6`}>
          <Margen texto={antetitulo} />
          {lleno(titulo) && (
            <h2 className={`${H2} col-span-12 max-w-[20ch] lg:col-span-9 lg:row-start-2`}>
              <Enfasis texto={titulo} />
            </h2>
          )}
        </div>
        {imagenes.length > 0 && (
          <ul className={`${REJILLA} mt-12 gap-y-12 lg:mt-16 lg:gap-y-20`}>
            {imagenes.map((img, i) => {
              const pieza = sola ? { caja: "col-span-12", proporcion: "aspect-[3/2] lg:aspect-[21/9]" } : PIEZAS[i % PIEZAS.length];
              return (
                <li key={`${img.url}-${i}`} className={pieza.caja}>
                  <Foto imagen={img} proporcion={pieza.proporcion} numero={i + 1} />
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
   PREGUNTAS · entrevista en acordeón, preguntas en cursiva
   ------------------------------------------------------------------ */

export function Preguntas({ seccion, sitio }: PropsSeccion<"preguntas">) {
  const { id, antetitulo, titulo } = seccion;
  const elementos = seccion.elementos.filter((e) => lleno(e.pregunta));
  if (!elementos.length && !lleno(titulo)) return null;

  return (
    <section className={SECCION}>
      <div className={ANCHO}>
        <div className={`${REJILLA} gap-y-10`}>
          <Margen texto={antetitulo} />
          {lleno(titulo) && (
            <h2 className={`${H2} col-span-12 self-start lg:sticky lg:top-40 lg:col-span-4 lg:row-start-2`}>
              <Enfasis texto={titulo} />
            </h2>
          )}
          {elementos.length > 0 && (
            <div
              className={`col-span-12 border-b border-[var(--w-linea)] lg:row-start-2 ${lleno(titulo) ? "lg:col-span-7 lg:col-start-6" : "lg:col-span-8 lg:col-start-3"}`}
            >
              {elementos.map((e, i) => (
                <details key={i} className="group border-t border-[var(--w-linea)]">
                  <summary className="flex min-h-12 cursor-pointer list-none items-start justify-between gap-6 py-6 text-[var(--w-tinta)] transition-colors duration-150 hover:text-[var(--w-acento-tinta)] [&::-webkit-details-marker]:hidden">
                    <span className={`${TITULOS} text-[1.375rem] italic leading-[1.25] sm:text-[1.625rem]`}>{e.pregunta}</span>
                    <span aria-hidden className="relative mt-2.5 block size-4 shrink-0">
                      <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-current" />
                      <span className="r-mas absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-current" />
                    </span>
                  </summary>
                  {lleno(e.respuesta) && (
                    <p className={`${CUERPO} max-w-[65ch] whitespace-pre-line pb-7 pr-10`}>{e.respuesta}</p>
                  )}
                </details>
              ))}
            </div>
          )}
        </div>
        <Folio numero={numeroDe(sitio, id)} marca={sitio.marca.nombre} />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------
   LLAMADA · la contraportada: una franja de acento a todo el ancho
   ------------------------------------------------------------------ */

export function Llamada({ seccion }: PropsSeccion<"llamada">) {
  const { titulo, texto, boton } = seccion;
  if (!lleno(titulo) && !lleno(texto) && !boton) return null;

  return (
    <section
      className="r-banda mt-20 bg-[var(--w-acento)] py-20 text-[var(--w-sobre-acento)] sm:mt-24 sm:py-24 lg:mt-32 lg:py-32"
    >
      <div className={`${ANCHO} ${REJILLA} items-end gap-y-10`}>
        <div className="col-span-12 lg:col-span-9">
          {lleno(titulo) && (
            <h2 className={`${TITULOS} text-balance text-[clamp(2.5rem,7vw,6rem)] leading-[0.96] tracking-[-0.035em]`}>
              <Enfasis texto={titulo} />
            </h2>
          )}
          {lleno(texto) && <p className="mt-7 max-w-[52ch] whitespace-pre-line text-[1.125rem] leading-[1.6]">{texto}</p>}
        </div>
        {boton && (
          <div className="col-span-12 lg:col-span-3 lg:justify-self-end">
            <Enlace
              destino={boton.destino}
              className="inline-flex min-h-12 items-center justify-center rounded-[var(--w-radio-boton)] bg-[var(--w-sobre-acento)] px-7 text-[0.95rem] font-medium text-[var(--w-acento)] underline decoration-transparent transition-[transform,text-decoration-color] duration-150 ease-out hover:decoration-current active:scale-[0.97]"
            >
              {boton.texto}
            </Enlace>
          </div>
        )}
      </div>
    </section>
  );
}
