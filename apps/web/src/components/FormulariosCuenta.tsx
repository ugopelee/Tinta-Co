"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { crearCuenta, iniciarSesion } from "@/app/cuenta/acciones";
import { formularioInicial } from "@tinta/compartido/formularios";

const claseCampo =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-texto outline-none backdrop-blur transition-colors duration-300 placeholder:text-tenue/70 focus:border-acento focus:ring-1 focus:ring-acento";

const claseEtiqueta = "mb-2 block text-sm text-tenue";

function Boton({ texto, cargando }: { texto: string; cargando: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="boton-barrido w-full rounded-xl bg-acento px-6 py-3.5 font-medium text-white transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? cargando : texto}
    </button>
  );
}

export function FormularioAcceso() {
  const [resultado, accion] = useActionState(iniciarSesion, formularioInicial);

  return (
    <form action={accion} className="space-y-5">
      <div>
        <label className={claseEtiqueta} htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className={claseCampo}
        />
      </div>

      <div>
        <label className={claseEtiqueta} htmlFor="password">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className={claseCampo}
        />
      </div>

      <Boton texto="Entrar" cargando="Entrando…" />

      {resultado.estado === "error" && (
        <p role="alert" className="text-sm text-acento-suave">
          {resultado.mensaje}
        </p>
      )}
    </form>
  );
}

export function FormularioAlta() {
  const [resultado, accion] = useActionState(crearCuenta, formularioInicial);

  return (
    <form action={accion} className="space-y-5">
      <div>
        <label className={claseEtiqueta} htmlFor="nombre">
          Nombre
        </label>
        <input
          id="nombre"
          name="nombre"
          required
          maxLength={120}
          autoComplete="name"
          className={claseCampo}
        />
      </div>

      <div>
        <label className={claseEtiqueta} htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className={claseCampo}
        />
      </div>

      <div>
        <label className={claseEtiqueta} htmlFor="password">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={claseCampo}
        />
        <p className="mt-2 text-xs text-tenue">Mínimo 8 caracteres.</p>
      </div>

      <div>
        <label className={claseEtiqueta} htmlFor="repetir">
          Repite la contraseña
        </label>
        <input
          id="repetir"
          name="repetir"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={claseCampo}
        />
      </div>

      <Boton texto="Crear cuenta" cargando="Creando cuenta…" />

      {resultado.estado === "error" && (
        <p role="alert" className="text-sm text-acento-suave">
          {resultado.mensaje}
        </p>
      )}
    </form>
  );
}
