"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { estudio } from "@tinta/compartido/estudio";
import { formularioInicial } from "@tinta/compartido/formularios";
import type { Diseno } from "@tinta/compartido/tipos";
import { cambiarDisponible, eliminarDiseno, guardarDiseno } from "@/app/acciones";
import { Icono } from "@/components/Icono";

export type DisenoCatalogo = Diseno & { reservas: number };

const FILTROS = [
  { id: "todos", texto: "Todos" },
  { id: "publicados", texto: "En la web" },
  { id: "retirados", texto: "Retirados" },
] as const;

type Filtro = (typeof FILTROS)[number]["id"];

const ESTILOS = estudio.estilos.filter((estilo) => estilo.id !== "sin-decidir");

const claseCampo =
  "w-full rounded-xl bg-superficie px-3 py-2 text-sm outline-none ring-1 ring-borde transition-shadow duration-200 placeholder:text-tenue/70 focus:ring-2 focus:ring-texto/30";

const euros = (valor: number | null) =>
  valor === null
    ? "Sin precio"
    : Number(valor).toLocaleString("es-ES", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
      });

/**
 * Las imágenes del catálogo viven en la web pública (`/flash/…`): el panel
 * las pide allí en vez de duplicarlas.
 */
const rutaImagen = (url: string | null, web: string) =>
  !url ? null : url.startsWith("/") ? `${web.replace(/\/$/, "")}${url}` : url;

const esDibujo = (url: string) => url.endsWith(".svg");

export function Catalogo({ disenos, urlWeb }: { disenos: DisenoCatalogo[]; urlWeb: string }) {
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [creando, setCreando] = useState(false);

  const visibles = disenos.filter((diseno) =>
    filtro === "todos" ? true : filtro === "publicados" ? diseno.disponible : !diseno.disponible,
  );

  const cuantos = (id: Filtro) =>
    id === "todos"
      ? disenos.length
      : disenos.filter((diseno) => (id === "publicados" ? diseno.disponible : !diseno.disponible))
          .length;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label="Filtrar diseños" className="segmentos !bg-superficie">
          {FILTROS.map((opcion) => (
            <button
              key={opcion.id}
              type="button"
              aria-pressed={filtro === opcion.id}
              onClick={() => setFiltro(opcion.id)}
              className="segmento"
            >
              {opcion.texto}
              <span className="cifra text-xs opacity-60">{cuantos(opcion.id)}</span>
            </button>
          ))}
        </div>

        <button type="button" onClick={() => setCreando((valor) => !valor)} className="boton">
          <Icono nombre="mas" className={`h-4 w-4 transition-transform duration-300 ${creando ? "rotate-45" : ""}`} />
          {creando ? "Cerrar" : "Nuevo diseño"}
        </button>
      </div>

      {creando && (
        <section className="tarjeta p-5">
          <h2 className="text-base font-semibold tracking-tight">Nuevo diseño</h2>
          <p className="mt-1 text-[0.8125rem] text-tenue">
            Se crea retirado: revísalo y publícalo cuando quieras que salga en la web.
          </p>
          <div className="mt-4">
            <FormularioDiseno urlWeb={urlWeb} alTerminar={() => setCreando(false)} />
          </div>
        </section>
      )}

      {visibles.length === 0 ? (
        <p className="tarjeta p-8 text-center text-sm text-tenue">
          {filtro === "retirados" ? "No hay diseños retirados." : "No hay diseños en el catálogo."}
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {visibles.map((diseno) => (
            <li key={diseno.id}>
              <Tarjeta diseno={diseno} urlWeb={urlWeb} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Tarjeta({ diseno, urlWeb }: { diseno: DisenoCatalogo; urlWeb: string }) {
  const [editando, setEditando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [publicado, setPublicado] = useState(diseno.disponible);
  const [error, setError] = useState("");
  const [pendiente, iniciar] = useTransition();
  const imagen = rutaImagen(diseno.imagen_url, urlWeb);

  function alternar() {
    const nuevo = !publicado;
    // Optimista: el interruptor responde al momento y vuelve atrás si falla.
    setPublicado(nuevo);
    setError("");
    iniciar(async () => {
      const resultado = await cambiarDisponible(diseno.id, nuevo);
      if (!resultado.ok) {
        setPublicado(!nuevo);
        setError(resultado.mensaje);
      }
    });
  }

  function eliminar() {
    setError("");
    iniciar(async () => {
      const resultado = await eliminarDiseno(diseno.id);
      if (!resultado.ok) {
        setError(resultado.mensaje);
        setConfirmando(false);
      }
    });
  }

  return (
    <article className={`tarjeta group flex h-full flex-col p-3 transition-opacity duration-300 ${pendiente ? "opacity-70" : ""}`}>
      {/* Baldosa negra fija: las fotos la cubren entera y, si queda algún
          dibujo antiguo (trazo hueso para fondo oscuro), se lee igual. */}
      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[0.875rem] bg-[#141414]">
        {imagen ? (
          // Imágenes de otra app (la web): un <img> simple, sin optimizador.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imagen}
            alt={diseno.nombre}
            className={`transition-[filter,opacity,transform] duration-500 ${
              esDibujo(imagen) ? "h-4/5 w-4/5 object-contain" : "h-full w-full object-cover group-hover:scale-[1.03]"
            } ${
              publicado ? "" : "opacity-40 grayscale"
            }`}
          />
        ) : (
          <span className="text-sm text-white/50">Sin imagen</span>
        )}

        <button
          type="button"
          role="switch"
          aria-checked={publicado}
          onClick={alternar}
          title={publicado ? "Retirar de la web" : "Publicar en la web"}
          className={`absolute left-2.5 top-2.5 flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-xs font-medium transition-colors duration-200 ${
            publicado ? "bg-lima text-sobre-lima" : "bg-superficie text-tenue"
          }`}
        >
          <span
            className={`relative block h-4 w-7 shrink-0 rounded-full transition-colors duration-200 ${
              publicado ? "bg-sobre-lima" : "bg-borde"
            }`}
          >
            <span
              className={`absolute left-0 top-0.5 block h-3 w-3 rounded-full bg-white transition-transform duration-200 ${
                publicado ? "translate-x-3.5" : "translate-x-0.5"
              }`}
            />
          </span>
          {publicado ? "En la web" : "Retirado"}
        </button>

        {diseno.reservas > 0 && (
          <span className="insignia cifra absolute right-2.5 top-2.5">
            {diseno.reservas} {diseno.reservas === 1 ? "reserva" : "reservas"}
          </span>
        )}
      </div>

      {editando ? (
        <div className="px-1 pt-4">
          <FormularioDiseno diseno={diseno} urlWeb={urlWeb} alTerminar={() => setEditando(false)} />
        </div>
      ) : (
        <div className="flex flex-1 flex-col px-1 pt-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate font-semibold tracking-tight">{diseno.nombre}</h3>
              <p className="mt-0.5 truncate text-[0.8125rem] text-tenue">
                {[diseno.estilo, diseno.tamano_aprox].filter(Boolean).join(" · ") || "Sin estilo ni tamaño"}
              </p>
            </div>
            <p className="titular cifra shrink-0 text-lg">{euros(diseno.precio)}</p>
          </div>

          {error && (
            <p role="alert" className="mt-2 text-xs text-acento">
              {error}
            </p>
          )}

          <div className="mt-auto flex items-center gap-2 pt-4">
            <button
              type="button"
              onClick={() => setEditando(true)}
              className="flex-1 rounded-full bg-superficie-alta px-3 py-1.5 text-[0.8125rem] font-medium transition-colors duration-200 hover:bg-borde"
            >
              Editar
            </button>

            {/* Borrado en dos pasos y solo sin reservas: no hay deshacer. */}
            {diseno.reservas === 0 &&
              (confirmando ? (
                <>
                  <button
                    type="button"
                    onClick={eliminar}
                    className="rounded-full bg-acento px-3 py-1.5 text-[0.8125rem] font-medium text-white"
                  >
                    Sí, borrar
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmando(false)}
                    className="rounded-full px-3 py-1.5 text-[0.8125rem] text-tenue hover:text-texto"
                  >
                    No
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmando(true)}
                  className="rounded-full px-3 py-1.5 text-[0.8125rem] text-tenue transition-colors duration-200 hover:text-acento"
                >
                  Eliminar
                </button>
              ))}
          </div>
        </div>
      )}
    </article>
  );
}

function BotonGuardar({ nuevo }: { nuevo: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="boton !px-4 !py-2">
      {pending ? "Guardando…" : nuevo ? "Crear diseño" : "Guardar"}
    </button>
  );
}

function FormularioDiseno({
  diseno,
  urlWeb,
  alTerminar,
}: {
  diseno?: DisenoCatalogo;
  urlWeb: string;
  alTerminar: () => void;
}) {
  const [resultado, accion] = useActionState(guardarDiseno, formularioInicial);
  const [imagen, setImagen] = useState(diseno?.imagen_url ?? "");

  useEffect(() => {
    if (resultado.estado === "ok") alTerminar();
  }, [resultado, alTerminar]);

  const vista = rutaImagen(imagen, urlWeb);

  return (
    <form action={accion} className="grid gap-3">
      {diseno && <input type="hidden" name="id" value={diseno.id} />}

      <label className="grid gap-1 text-xs text-tenue">
        Nombre
        <input name="nombre" required defaultValue={diseno?.nombre} className={claseCampo} />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="grid gap-1 text-xs text-tenue">
          Precio (€)
          <input
            name="precio"
            inputMode="decimal"
            defaultValue={diseno?.precio ?? ""}
            placeholder="120"
            className={claseCampo}
          />
        </label>
        <label className="grid gap-1 text-xs text-tenue">
          Tamaño
          <input
            name="tamano_aprox"
            defaultValue={diseno?.tamano_aprox ?? ""}
            placeholder="10 × 14 cm"
            className={claseCampo}
          />
        </label>
      </div>

      <label className="grid gap-1 text-xs text-tenue">
        Estilo
        <input
          name="estilo"
          list="estilos-catalogo"
          defaultValue={diseno?.estilo ?? ""}
          placeholder="Fine line"
          className={claseCampo}
        />
        <datalist id="estilos-catalogo">
          {ESTILOS.map((estilo) => (
            <option key={estilo.id} value={estilo.nombre} />
          ))}
        </datalist>
      </label>

      <label className="grid gap-1 text-xs text-tenue">
        Imagen
        <span className="flex items-center gap-2">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#141414]">
            {vista && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={vista}
                alt=""
                className={esDibujo(vista) ? "h-4/5 w-4/5 object-contain" : "h-full w-full object-cover"}
              />
            )}
          </span>
          <input
            name="imagen_url"
            value={imagen}
            onChange={(evento) => setImagen(evento.target.value)}
            placeholder="/fotos/flash/rosa.webp"
            className={claseCampo}
          />
        </span>
      </label>

      <label className="grid gap-1 text-xs text-tenue">
        Descripción
        <textarea
          name="descripcion"
          rows={2}
          defaultValue={diseno?.descripcion ?? ""}
          className={`${claseCampo} resize-none`}
        />
      </label>

      {resultado.estado === "error" && (
        <p role="alert" className="text-sm text-acento">
          {resultado.mensaje}
        </p>
      )}

      <div className="flex items-center gap-2">
        <BotonGuardar nuevo={!diseno} />
        <button
          type="button"
          onClick={alTerminar}
          className="rounded-full px-4 py-2 text-sm text-tenue transition-colors hover:text-texto"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
