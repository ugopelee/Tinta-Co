"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { enviarSolicitud } from "@/app/acciones";
import { formularioInicial } from "@tinta/compartido/formularios";
import { estudio, tiposEvento, type TipoOportunidad } from "@tinta/compartido/estudio";
import type { Diseno } from "@tinta/compartido/tipos";
import { EVENTO_ELEGIR_PIEZA } from "@/lib/eventos";

/** Las cinco puertas del formulario, en dos familias. */
const GRUPOS: { titulo: string; opciones: { id: TipoOportunidad; texto: string }[] }[] = [
  {
    titulo: "Para tatuarte",
    opciones: [
      { id: "cita", texto: "Cita en el estudio" },
      { id: "evento", texto: "Un evento" },
    ],
  },
  {
    titulo: "Para trabajar juntos",
    opciones: [
      { id: "proveedor", texto: "Proveedor" },
      { id: "colaboracion", texto: "Colaboración" },
      { id: "otro", texto: "Otra cosa" },
    ],
  },
];

const TEXTO_BOTON: Record<TipoOportunidad, string> = {
  cita: "Solicitar cita",
  evento: "Pedir presupuesto",
  proveedor: "Enviar propuesta",
  colaboracion: "Enviar propuesta",
  otro: "Enviar mensaje",
};

const ETIQUETA_EMPRESA: Partial<Record<TipoOportunidad, string>> = {
  proveedor: "Empresa o marca",
  colaboracion: "Estudio, marca o @",
  otro: "Empresa o medio",
};

const MARCADOR_MENSAJE: Record<TipoOportunidad, string> = {
  cita: "Tamaño aproximado, referencias, si es tu primer tatuaje…",
  evento: "Horario, cuántos artistas, si quieres diseños propios del evento…",
  proveedor: "Qué ofreces, condiciones, si tienes muestras…",
  colaboracion: "Quién eres, qué te gustaría hacer y cuándo…",
  otro: "Cuéntanos la idea con el detalle que quieras.",
};

const claseCampo =
  "w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-texto outline-none transition-colors duration-200 placeholder:text-tenue/60 hover:border-white/20 focus:border-acento-suave/70 focus:bg-white/[0.05]";

const claseEtiqueta = "mb-2 block text-xs text-tenue";

function BotonEnviar({ texto }: { texto: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="group flex w-full items-center justify-between rounded-full bg-texto py-1.5 pl-6 pr-1.5 text-sm font-medium text-fondo transition-[background-color,transform] duration-150 ease-out hover:bg-acento-suave active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Enviando…" : texto}
      <span
        aria-hidden
        className="grid h-9 w-9 place-items-center rounded-full bg-fondo text-texto transition-transform duration-300 ease-[var(--ease-salida)] group-hover:rotate-45"
      >
        ↗
      </span>
    </button>
  );
}

/**
 * Un solo formulario para todo lo que entra por la web: citas, eventos y
 * propuestas de negocio. El tipo elegido decide qué campos se piden; el
 * servidor lo reparte al mismo tablero del CRM.
 */
export function FormularioReserva({ disenos }: { disenos: Diseno[] }) {
  const [resultado, accion] = useActionState(enviarSolicitud, formularioInicial);
  const formulario = useRef<HTMLFormElement>(null);
  const mensaje = useRef<HTMLTextAreaElement>(null);
  const [tipo, setTipo] = useState<TipoOportunidad>("cita");
  const [disenoElegido, setDisenoElegido] = useState("");
  const [fechaElegida, setFechaElegida] = useState("");

  const esCita = tipo === "cita";
  const esEvento = tipo === "evento";
  const esPropuesta = !esCita && !esEvento;

  // El catálogo manda la pieza por nombre: se apunta en el mensaje.
  useEffect(() => {
    const alElegirPieza = (evento: Event) => {
      setTipo("cita");
      const nombre = (evento as CustomEvent<string>).detail;
      // La pieza del escaparate es un diseño de la tabla: se deja elegida.
      const diseno = disenos.find((d) => d.nombre === nombre);
      if (diseno) setDisenoElegido(diseno.id);
      requestAnimationFrame(() => {
        if (mensaje.current) {
          mensaje.current.value = `Me interesa la pieza «${nombre}» del catálogo flash.`;
        }
      });
    };
    window.addEventListener(EVENTO_ELEGIR_PIEZA, alElegirPieza);
    return () => window.removeEventListener(EVENTO_ELEGIR_PIEZA, alElegirPieza);
  }, [disenos]);

  useEffect(() => {
    // reset() dispara onReset, que es donde se limpian los campos
    // controlados. Así no hay setState síncrono dentro del efecto.
    if (resultado.estado === "ok") formulario.current?.reset();
  }, [resultado]);

  const hoy = new Date().toISOString().slice(0, 10);

  return (
    <form
      ref={formulario}
      action={accion}
      onReset={() => {
        setDisenoElegido("");
        setFechaElegida("");
      }}
      className="space-y-5"
    >
      {/* Señuelo para bots: fuera de pantalla y saltado por el tabulador. */}
      <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="apodo">No rellenes este campo</label>
        <input id="apodo" name="apodo" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <fieldset className="space-y-3">
        <legend className={claseEtiqueta}>¿Qué necesitas?</legend>
        {GRUPOS.map((grupo) => (
          <div key={grupo.titulo} className="flex flex-wrap items-center gap-1.5">
            <span className="mono w-full text-tenue/70">{grupo.titulo}</span>
            {grupo.opciones.map((opcion) => (
              <label
                key={opcion.id}
                className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-sm transition-[background-color,border-color,color,transform] duration-150 ease-out active:scale-[0.97] has-[:focus-visible]:outline has-[:focus-visible]:outline-1 has-[:focus-visible]:outline-acento-suave ${
                  tipo === opcion.id
                    ? "border-texto bg-texto text-fondo"
                    : "border-white/12 text-tenue hover:border-white/30 hover:text-texto"
                }`}
              >
                <input
                  type="radio"
                  name="tipo"
                  value={opcion.id}
                  checked={tipo === opcion.id}
                  onChange={() => setTipo(opcion.id)}
                  className="sr-only"
                />
                {opcion.texto}
              </label>
            ))}
          </div>
        ))}
        {esEvento && <p className="surgir text-xs leading-relaxed text-tenue">{estudio.eventos.entradilla}</p>}
      </fieldset>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={claseEtiqueta} htmlFor="nombre">
            Nombre *
          </label>
          <input
            id="nombre"
            name="nombre"
            required
            maxLength={120}
            autoComplete="name"
            placeholder="Cómo te llamas"
            className={claseCampo}
          />
        </div>

        <div>
          <label className={claseEtiqueta} htmlFor="email">
            Email *
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            maxLength={160}
            autoComplete="email"
            placeholder="tu@email.com"
            className={claseCampo}
          />
        </div>

        <div>
          <label className={claseEtiqueta} htmlFor="telefono">
            Teléfono
          </label>
          <input
            id="telefono"
            name="telefono"
            type="tel"
            maxLength={40}
            autoComplete="tel"
            placeholder="600 000 000"
            className={claseCampo}
          />
        </div>

        {esPropuesta ? (
          <div key="empresa" className="surgir">
            <label className={claseEtiqueta} htmlFor="empresa">
              {ETIQUETA_EMPRESA[tipo]}
            </label>
            <input
              id="empresa"
              name="empresa"
              maxLength={120}
              autoComplete="organization"
              placeholder="Opcional"
              className={claseCampo}
            />
          </div>
        ) : (
          <div key="fecha">
            <label className={claseEtiqueta} htmlFor="fecha_deseada">
              {esEvento ? "Fecha del evento" : "Fecha deseada"}
            </label>
            <input
              id="fecha_deseada"
              name="fecha_deseada"
              type="date"
              min={hoy}
              value={fechaElegida}
              onChange={(evento) => setFechaElegida(evento.target.value)}
              className={claseCampo}
            />
          </div>
        )}
      </div>

      {esEvento && (
        <div key="evento" className="surgir grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={claseEtiqueta} htmlFor="tipo_evento">
              Tipo de evento *
            </label>
            <select id="tipo_evento" name="tipo_evento" required defaultValue="" className={claseCampo}>
              <option value="" disabled>
                Elige uno
              </option>
              {tiposEvento.map((opcion) => (
                <option key={opcion.id} value={opcion.id}>
                  {opcion.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={claseEtiqueta} htmlFor="asistentes">
              Invitados aprox.
            </label>
            <input
              id="asistentes"
              name="asistentes"
              type="number"
              min={1}
              max={5000}
              inputMode="numeric"
              placeholder="120"
              className={claseCampo}
            />
          </div>

          <div className="sm:col-span-2">
            <label className={claseEtiqueta} htmlFor="lugar">
              Lugar
            </label>
            <input id="lugar" name="lugar" maxLength={200} placeholder="Finca, ciudad o dirección" className={claseCampo} />
          </div>
        </div>
      )}

      {esCita && (
        <div key="cita" className="surgir grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={claseEtiqueta} htmlFor="diseno_id">
              Diseño del catálogo
            </label>
            <select
              id="diseno_id"
              name="diseno_id"
              value={disenoElegido}
              onChange={(evento) => setDisenoElegido(evento.target.value)}
              className={claseCampo}
            >
              <option value="">Ninguno en concreto</option>
              {disenos.map((diseno) => (
                <option key={diseno.id} value={diseno.id}>
                  {diseno.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={claseEtiqueta} htmlFor="zona_cuerpo">
              Zona del cuerpo
            </label>
            <select id="zona_cuerpo" name="zona_cuerpo" defaultValue="" className={claseCampo}>
              <option value="">Todavía no lo tengo claro</option>
              {estudio.zonasCuerpo.map((zona) => (
                <option key={zona} value={zona}>
                  {zona}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div>
        <label className={claseEtiqueta} htmlFor="mensaje">
          {esPropuesta ? "Tu propuesta *" : esEvento ? "Cuéntanos el plan" : "Cuéntanos tu idea"}
        </label>
        <textarea
          ref={mensaje}
          id="mensaje"
          name="mensaje"
          required={esPropuesta}
          rows={3}
          maxLength={2000}
          placeholder={MARCADOR_MENSAJE[tipo]}
          className={`${claseCampo} resize-y`}
        />
      </div>

      <div className="space-y-3 pt-1">
        <BotonEnviar texto={TEXTO_BOTON[tipo]} />
        <p className="text-xs leading-relaxed text-tenue sm:max-w-xs">{estudio.reserva.aviso}</p>
      </div>

      {resultado.estado !== "inicial" && (
        <p
          role="status"
          aria-live="polite"
          className={`rounded-2xl border px-4 py-3 text-sm ${
            resultado.estado === "ok"
              ? "border-acento-suave/40 bg-acento-suave/10 text-texto"
              : "border-white/10 bg-white/[0.03] text-tenue"
          }`}
        >
          {resultado.mensaje}
        </p>
      )}
    </form>
  );
}
