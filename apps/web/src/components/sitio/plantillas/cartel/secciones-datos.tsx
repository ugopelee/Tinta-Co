/* eslint-disable @next/next/no-img-element -- diseños subidos al CRM (Supabase Storage) */
import { Reserva } from "../../comun/Reserva";
import type { PropsSeccion } from "../../contrato";
import {
  Bloque,
  Cabecera,
  Contenedor,
  ETIQUETA,
  Regla,
  Sello,
  T_ELEMENTO,
  anclaReserva,
  atributosEnlace,
  claseBoton,
  cx,
  tonoDe,
} from "./piezas";

const idTitulo = (id: string) => `${id}-titulo`;

const euros = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

function Vacio({ children }: { children: string }) {
  return (
    <p className="border-[3px] border-dashed border-[var(--k-borde)] px-6 py-8 text-lg font-semibold text-[var(--k-suave)]">
      {children}
    </p>
  );
}

/* ------------------------------------------------------------------
   SERVICIOS · boletos con talón
   ------------------------------------------------------------------ */

export function Servicios({ seccion, sitio, datos, indice }: PropsSeccion<"servicios">) {
  const servicios = datos.servicios;
  if (!servicios.length && !seccion.titulo.trim()) return null;
  const reserva = anclaReserva(sitio);

  return (
    <Bloque tono={tonoDe(indice)} etiquetadoPor={seccion.titulo.trim() ? idTitulo(seccion.id) : undefined}>
      <Contenedor>
        <Cabecera idTitulo={idTitulo(seccion.id)} antetitulo={seccion.antetitulo} titulo={seccion.titulo} texto={seccion.texto} />
        {servicios.length === 0 ? (
          <Vacio>Todavía no hay servicios publicados.</Vacio>
        ) : (
          <ul className="grid gap-6 lg:grid-cols-2">
            {servicios.map((s) => (
              <li
                key={s.id}
                className="ct-boleto grid grid-cols-[1fr_auto] bg-[var(--k-relleno)] text-[var(--k-sobre-relleno)]"
              >
                <div className="flex min-w-0 flex-col gap-4 p-6 pr-5 sm:p-8 sm:pr-6">
                  <h3 className={T_ELEMENTO}>{s.nombre}</h3>
                  {s.descripcion?.trim() && <p className="leading-relaxed">{s.descripcion.trim()}</p>}
                  {reserva && (
                    <a
                      {...atributosEnlace(reserva)}
                      className="mt-auto w-fit text-sm font-extrabold tracking-[0.08em] uppercase underline decoration-2"
                      aria-label={`Reservar cita: ${s.nombre}`}
                    >
                      Reservar
                    </a>
                  )}
                </div>
                {s.detalle?.trim() && (
                  <div className="flex w-28 items-center justify-center border-l-[3px] border-dashed border-current p-3 text-center sm:w-36">
                    <p className="text-sm leading-snug font-extrabold tracking-[0.04em] uppercase [overflow-wrap:anywhere]">
                      {s.detalle.trim()}
                    </p>
                  </div>
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
   ESTUDIO · dónde y cuándo, como el pie de un cartel
   ------------------------------------------------------------------ */

export function Estudio({ seccion, datos, indice }: PropsSeccion<"estudio">) {
  const c = datos.contacto;
  const direccion = c.direccion?.trim();
  const horario = c.horario?.trim();
  const telefono = c.telefono?.trim();
  const email = c.email?.trim();
  const ig = c.instagram?.trim();
  const hay = direccion || horario || telefono || email || ig;
  if (!hay && !seccion.titulo.trim()) return null;
  const mapa = direccion ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccion)}` : null;

  return (
    <Bloque tono={tonoDe(indice)} etiquetadoPor={seccion.titulo.trim() ? idTitulo(seccion.id) : undefined}>
      <Contenedor>
        <Cabecera idTitulo={idTitulo(seccion.id)} antetitulo={seccion.antetitulo} titulo={seccion.titulo} texto={seccion.texto} />
        {hay && (
          <div className="grid gap-10 lg:grid-cols-12">
            {direccion && (
              <div className="lg:col-span-7">
                <p className={ETIQUETA}>Dirección</p>
                <p className="mt-3 [font-family:var(--w-titulos)] text-[clamp(2.5rem,6vw,4.5rem)] leading-[1] [overflow-wrap:anywhere]">
                  {direccion}
                </p>
                {mapa && (
                  <a href={mapa} target="_blank" rel="noopener noreferrer" className={cx(claseBoton("lleno"), "mt-8 rounded-full")}>
                    Cómo llegar
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M7 17L17 7M8 7h9v9" />
                    </svg>
                    <span className="sr-only"> (se abre en otra pestaña)</span>
                  </a>
                )}
              </div>
            )}
            <dl className={cx("grid content-start gap-6 border-t-8 border-[var(--k-borde)] pt-6", direccion ? "lg:col-span-5" : "lg:col-span-12 sm:grid-cols-2")}>
              {horario && (
                <div>
                  <dt className={ETIQUETA}>Horario</dt>
                  <dd className="mt-1 text-xl leading-snug whitespace-pre-line">{horario}</dd>
                </div>
              )}
              {telefono && (
                <div>
                  <dt className={ETIQUETA}>Teléfono</dt>
                  <dd className="mt-1 text-xl">
                    <a href={`tel:${telefono.replace(/[^\d+]/g, "")}`} className="underline decoration-2">
                      {telefono}
                    </a>
                  </dd>
                </div>
              )}
              {email && (
                <div>
                  <dt className={ETIQUETA}>Email</dt>
                  <dd className="mt-1 text-xl [overflow-wrap:anywhere]">
                    <a href={`mailto:${email}`} className="underline decoration-2">
                      {email}
                    </a>
                  </dd>
                </div>
              )}
              {ig && (
                <div>
                  <dt className={ETIQUETA}>Instagram</dt>
                  <dd className="mt-1 text-xl">
                    <a
                      href={`https://www.instagram.com/${encodeURIComponent(ig.replace(/^@/, ""))}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline decoration-2"
                    >
                      {ig.startsWith("@") ? ig : `@${ig}`}
                      <span className="sr-only"> (se abre en otra pestaña)</span>
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}
      </Contenedor>
    </Bloque>
  );
}

/* ------------------------------------------------------------------
   FLASH · diseños disponibles, con el precio en un sello
   ------------------------------------------------------------------ */

export function Flash({ seccion, sitio, datos, indice }: PropsSeccion<"flash">) {
  const disenos = datos.disenos.slice(0, Math.max(1, seccion.limite || 8));
  if (!disenos.length && !seccion.titulo.trim()) return null;
  const reserva = anclaReserva(sitio);

  return (
    <Bloque tono={tonoDe(indice)} etiquetadoPor={seccion.titulo.trim() ? idTitulo(seccion.id) : undefined}>
      <Contenedor>
        <Cabecera idTitulo={idTitulo(seccion.id)} antetitulo={seccion.antetitulo} titulo={seccion.titulo} texto={seccion.texto} />
        {disenos.length === 0 ? (
          <Vacio>Ahora mismo no hay diseños flash disponibles.</Vacio>
        ) : (
          <ul className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {disenos.map((d, i) => {
              const detalles = [d.estilo, d.tamano_aprox].filter((x) => x?.trim()).join(" · ");
              return (
                <li key={d.id} className="relative">
                  <div className="overflow-hidden rounded-[var(--w-radio)] border-[5px] border-[var(--k-borde)] bg-[var(--w-acento)]">
                    <div className="aspect-[4/5]">
                      {d.imagen_url && (
                        <img
                          src={d.imagen_url}
                          alt={d.nombre}
                          loading={i < 4 ? "eager" : "lazy"}
                          decoding="async"
                          className="size-full object-cover"
                        />
                      )}
                    </div>
                  </div>
                  {d.precio != null && (
                    <Sello giro={i % 2 ? 10 : -10} className="absolute -top-5 -right-3 z-10 size-24 p-3 sm:-right-4">
                      <span className="text-base tabular-nums">{euros.format(d.precio)}</span>
                    </Sello>
                  )}
                  <div className="mt-4">
                    <h3 className="text-xl leading-tight font-extrabold [overflow-wrap:anywhere]">{d.nombre}</h3>
                    {detalles && <p className="mt-1 text-[var(--k-suave)]">{detalles}</p>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {reserva && disenos.length > 0 && (
          <div className="mt-14">
            <Regla />
            <a {...atributosEnlace(reserva)} className={cx(claseBoton("lleno"), "mt-8 rounded-full")}>
              Reservar un diseño
            </a>
          </div>
        )}
      </Contenedor>
    </Bloque>
  );
}

/* ------------------------------------------------------------------
   RESERVA · el formulario real de la web
   ------------------------------------------------------------------ */

export function ReservaSeccion({ seccion, datos, vista, indice }: PropsSeccion<"reserva">) {
  const titulo = seccion.titulo.trim();
  return (
    <Bloque tono={tonoDe(indice)} etiquetadoPor={titulo ? idTitulo(seccion.id) : undefined}>
      <Contenedor className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5 [&_header]:mb-0">
          <Cabecera idTitulo={idTitulo(seccion.id)} antetitulo={seccion.antetitulo} titulo={seccion.titulo} texto={seccion.texto} />
        </div>
        <div className="min-w-0 lg:col-span-7">
          <div className="border-[5px] border-[var(--k-borde)] rounded-[var(--w-radio)] p-2 sm:p-3">
            <Reserva datos={datos} vista={vista} />
          </div>
        </div>
      </Contenedor>
    </Bloque>
  );
}

