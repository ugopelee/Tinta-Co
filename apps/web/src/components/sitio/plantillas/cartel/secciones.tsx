import type { PropsSeccion } from "../../contrato";
import {
  Bloque,
  BotonEnlace,
  Cabecera,
  Cinta,
  Contenedor,
  ETIQUETA,
  Foto,
  Parrafos,
  Regla,
  Sello,
  T_ELEMENTO,
  T_SECCION,
  TONOS,
  cx,
  tonoDe,
} from "./piezas";

const idTitulo = (id: string) => `${id}-titulo`;

/* ------------------------------------------------------------------
   PORTADA · titular gótico enorme, foto pegada y cinta torcida
   ------------------------------------------------------------------ */

export function Portada({ seccion, sitio }: PropsSeccion<"portada">) {
  const lineas = seccion.titulo
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const antetitulo = seccion.antetitulo.trim();
  const subtitulo = seccion.subtitulo.trim();
  const hayBotones = Boolean(seccion.boton?.texto.trim() || seccion.botonSecundario?.texto.trim());

  return (
    <section
      style={TONOS.fondo}
      aria-labelledby={lineas.length ? idTitulo(seccion.id) : undefined}
      className="overflow-x-clip border-b-[6px] border-[var(--k-borde)] bg-[var(--k-fondo)] pt-10 text-[var(--k-tinta)] sm:pt-14 lg:pt-16"
    >
      <Contenedor className={cx("grid gap-10 lg:gap-14", seccion.imagen && "lg:grid-cols-12 lg:items-center")}>
        <div className={cx("min-w-0", seccion.imagen && "lg:col-span-7")}>
          {lineas.length > 0 && (
            <h1
              id={idTitulo(seccion.id)}
              className="[font-family:var(--w-titulos)] text-[clamp(3.25rem,13vw,6rem)] leading-[0.95] [overflow-wrap:anywhere] text-balance"
            >
              {lineas.map((l, i) => (
                <span
                  key={i}
                  className={cx("block", lineas.length > 1 && i === lineas.length - 1 && "text-[var(--k-destaque)]")}
                >
                  {l}
                </span>
              ))}
            </h1>
          )}
          {(subtitulo || hayBotones) && <Regla className="mt-8 max-w-xl" />}
          {subtitulo && (
            <p className="mt-8 max-w-[44ch] text-xl leading-snug font-medium whitespace-pre-line sm:text-2xl">{subtitulo}</p>
          )}
          {hayBotones && (
            <div className="mt-8 flex flex-wrap gap-4">
              <BotonEnlace boton={seccion.boton} />
              <BotonEnlace boton={seccion.botonSecundario} variante="hueco" />
            </div>
          )}
        </div>

        {seccion.imagen && (
          <div className="relative lg:col-span-5">
            <Foto
              imagen={seccion.imagen}
              prioridad
              className="aspect-[4/5] w-full [rotate:2deg] sm:aspect-[4/3] lg:aspect-[4/5]"
            />
            {antetitulo && (
              <Sello giro={-12} className="absolute -bottom-6 -left-2 z-10 size-[7.5rem] sm:-left-6">
                {antetitulo}
              </Sello>
            )}
          </div>
        )}
        {!seccion.imagen && antetitulo && (
          <div>
            <Sello giro={-8}>{antetitulo}</Sello>
          </div>
        )}
      </Contenedor>

      <Cinta texto={sitio.marca.eslogan} />
    </section>
  );
}

/* ------------------------------------------------------------------
   TEXTO CON IMAGEN
   ------------------------------------------------------------------ */

export function Texto({ seccion, indice }: PropsSeccion<"texto">) {
  const cuerpo = seccion.cuerpo.trim();
  const titulo = seccion.titulo.trim();
  const antetitulo = seccion.antetitulo.trim();
  if (!cuerpo && !titulo && !antetitulo && !seccion.imagen && !seccion.boton) return null;
  const izquierda = seccion.lado === "izquierda";

  return (
    <Bloque tono={tonoDe(indice)} etiquetadoPor={titulo ? idTitulo(seccion.id) : undefined}>
      <Contenedor className={cx("grid gap-12 lg:gap-16", seccion.imagen && "lg:grid-cols-2 lg:items-center")}>
        <div className={cx("min-w-0", seccion.imagen && izquierda && "lg:order-2")}>
          {titulo && (
            <h2 id={idTitulo(seccion.id)} className={T_SECCION}>
              {titulo}
            </h2>
          )}
          {(titulo || antetitulo) && <Regla className="mt-8" />}
          {antetitulo && <p className={cx(ETIQUETA, "mt-6 text-[var(--k-suave)]")}>{antetitulo}</p>}
          {cuerpo && <Parrafos texto={cuerpo} className="mt-8 max-w-[62ch] text-lg leading-relaxed" />}
          {seccion.boton && <BotonEnlace boton={seccion.boton} className="mt-10" />}
        </div>
        {seccion.imagen && (
          <Foto
            imagen={seccion.imagen}
            className={cx(
              "aspect-[4/5] sm:aspect-[4/3] lg:aspect-[4/5]",
              izquierda ? "lg:order-1 lg:[rotate:-2deg]" : "lg:[rotate:2deg]",
            )}
          />
        )}
      </Contenedor>
    </Bloque>
  );
}

/* ------------------------------------------------------------------
   VENTAJAS · filas entre reglas gruesas, con estrella de tinta
   ------------------------------------------------------------------ */

export function Ventajas({ seccion, indice }: PropsSeccion<"ventajas">) {
  const elementos = seccion.elementos.filter((e) => e.titulo.trim() || e.texto.trim());
  if (!elementos.length && !seccion.titulo.trim()) return null;

  return (
    <Bloque tono={tonoDe(indice)} etiquetadoPor={seccion.titulo.trim() ? idTitulo(seccion.id) : undefined}>
      <Contenedor>
        <Cabecera idTitulo={idTitulo(seccion.id)} antetitulo={seccion.antetitulo} titulo={seccion.titulo} />
        {elementos.length > 0 && (
          <ul className="border-t-[3px] border-[var(--k-borde)]">
            {elementos.map((e, i) => (
              <li
                key={i}
                className="grid items-baseline gap-x-10 gap-y-3 border-b-[3px] border-[var(--k-borde)] py-7 lg:grid-cols-12"
              >
                <div className="flex items-start gap-4 lg:col-span-6">
                  <svg aria-hidden viewBox="0 0 24 24" className="mt-2 size-6 shrink-0 fill-[var(--k-relleno)] stroke-[var(--k-borde)]" strokeWidth="1.5">
                    <path d="M12 1.5l3 7.3 7.5.7-5.7 5 1.8 7.5L12 18l-6.6 4 1.8-7.5-5.7-5 7.5-.7z" />
                  </svg>
                  {e.titulo.trim() && <h3 className={T_ELEMENTO}>{e.titulo.trim()}</h3>}
                </div>
                {e.texto.trim() && (
                  <p className="max-w-[48ch] leading-relaxed whitespace-pre-line text-[var(--k-suave)] lg:col-span-6">
                    {e.texto.trim()}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Contenedor>
    </Bloque>
  );
}

/* ------------------------------------------------------------------
   CIFRAS · números góticos grandes entre reglas
   ------------------------------------------------------------------ */

export function Cifras({ seccion, indice }: PropsSeccion<"cifras">) {
  const elementos = seccion.elementos.filter((e) => e.valor.trim());
  if (!elementos.length && !seccion.titulo.trim()) return null;

  return (
    <Bloque tono={tonoDe(indice)} etiquetadoPor={seccion.titulo.trim() ? idTitulo(seccion.id) : undefined}>
      <Contenedor>
        <Cabecera idTitulo={idTitulo(seccion.id)} antetitulo={seccion.antetitulo} titulo={seccion.titulo} />
        {elementos.length > 0 && (
          <ul className="grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {elementos.map((e, i) => (
              <li key={i} className="border-t-8 border-[var(--k-borde)] pt-5">
                <p className="[font-family:var(--w-titulos)] text-[clamp(3.5rem,9vw,6rem)] leading-[1] tabular-nums [overflow-wrap:anywhere]">
                  {e.valor.trim()}
                </p>
                {e.etiqueta.trim() && <p className={cx(ETIQUETA, "mt-3 text-sm")}>{e.etiqueta.trim()}</p>}
              </li>
            ))}
          </ul>
        )}
      </Contenedor>
    </Bloque>
  );
}

/* ------------------------------------------------------------------
   GALERÍA · carteles pegados, cada uno un poco torcido
   ------------------------------------------------------------------ */

const GIROS = ["-rotate-2", "rotate-1", "rotate-2", "-rotate-1"];

export function Galeria({ seccion, indice }: PropsSeccion<"galeria">) {
  const imagenes = seccion.imagenes.filter((im) => im.url);
  if (!imagenes.length && !seccion.titulo.trim()) return null;

  return (
    <Bloque tono={tonoDe(indice)} etiquetadoPor={seccion.titulo.trim() ? idTitulo(seccion.id) : undefined}>
      <Contenedor>
        <Cabecera idTitulo={idTitulo(seccion.id)} antetitulo={seccion.antetitulo} titulo={seccion.titulo} />
        {imagenes.length > 0 && (
          <ul className={cx("grid grid-cols-2 gap-5 sm:gap-8 lg:gap-10", imagenes.length >= 3 && "lg:grid-cols-4")}>
            {imagenes.map((im, i) => (
              <li
                key={`${im.url}-${i}`}
                className={cx(
                  GIROS[i % GIROS.length],
                  i === 0 && imagenes.length > 2 ? "col-span-2 row-span-2" : "",
                  imagenes.length === 1 && "col-span-2 lg:col-span-4",
                )}
              >
                <Foto
                  imagen={im}
                  className={cx("size-full", i === 0 && imagenes.length === 1 ? "aspect-[16/9]" : "aspect-[4/5]")}
                />
              </li>
            ))}
          </ul>
        )}
      </Contenedor>
    </Bloque>
  );
}

/* ------------------------------------------------------------------
   PREGUNTAS · desplegables con <details>
   ------------------------------------------------------------------ */

export function Preguntas({ seccion, indice }: PropsSeccion<"preguntas">) {
  const elementos = seccion.elementos.filter((e) => e.pregunta.trim());
  if (!elementos.length && !seccion.titulo.trim()) return null;

  return (
    <Bloque tono={tonoDe(indice)} etiquetadoPor={seccion.titulo.trim() ? idTitulo(seccion.id) : undefined}>
      <Contenedor>
        <Cabecera idTitulo={idTitulo(seccion.id)} antetitulo={seccion.antetitulo} titulo={seccion.titulo} />
        {elementos.length > 0 && (
          <div className="max-w-4xl border-t-[3px] border-[var(--k-borde)]">
            {elementos.map((e, i) => (
              <details key={i} className="ct-pregunta border-b-[3px] border-[var(--k-borde)]">
                <summary className="flex items-center justify-between gap-6 py-5 sm:py-6">
                  <span className="[font-family:var(--w-titulos)] text-[clamp(1.6rem,3vw,2.5rem)] leading-[1.05] [overflow-wrap:anywhere]">
                    {e.pregunta.trim()}
                  </span>
                  <span
                    aria-hidden
                    className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-[var(--k-relleno)] text-[var(--k-sobre-relleno)]"
                  >
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="ct-mas">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </span>
                </summary>
                {e.respuesta.trim() && (
                  <Parrafos texto={e.respuesta} className="max-w-[62ch] pb-7 text-lg leading-relaxed text-[var(--k-suave)]" />
                )}
              </details>
            ))}
          </div>
        )}
      </Contenedor>
    </Bloque>
  );
}

/* ------------------------------------------------------------------
   LLAMADA · siempre en acento, a todo volumen
   ------------------------------------------------------------------ */

export function Llamada({ seccion }: PropsSeccion<"llamada">) {
  const titulo = seccion.titulo.trim();
  const texto = seccion.texto.trim();
  const hayBoton = Boolean(seccion.boton?.texto.trim());
  if (!titulo && !texto && !hayBoton) return null;

  return (
    <Bloque tono="acento" etiquetadoPor={titulo ? idTitulo(seccion.id) : undefined}>
      <Contenedor className="grid gap-10 lg:grid-cols-12 lg:items-center">
        {titulo && (
          <h2 id={idTitulo(seccion.id)} className={cx(T_SECCION, "lg:col-span-8")}>
            {titulo}
          </h2>
        )}
        {(texto || hayBoton) && (
          <div className={cx("flex flex-col items-start gap-6", titulo ? "lg:col-span-4" : "lg:col-span-12")}>
            {texto && <p className="max-w-[40ch] text-lg leading-relaxed font-medium whitespace-pre-line">{texto}</p>}
            <BotonEnlace boton={seccion.boton} className="min-h-14 rounded-full px-8" />
          </div>
        )}
      </Contenedor>
    </Bloque>
  );
}
