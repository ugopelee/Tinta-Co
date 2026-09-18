"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { registrarse } from "@/app/acciones";
import { formularioInicial } from "@tinta/compartido/formularios";

const claseCampo =
  "w-full rounded-lg border border-borde bg-fondo px-4 py-3 text-texto outline-none transition-colors duration-300 placeholder:text-tenue/70 focus:border-acento focus:ring-1 focus:ring-acento";

function Boton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="boton-barrido w-full rounded-lg bg-acento px-6 py-3 font-medium text-white transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Creando cuenta…" : "Crear cuenta"}
    </button>
  );
}

export function FormularioRegistro() {
  const [resultado, accion] = useActionState(registrarse, formularioInicial);

  return (
    <form action={accion} className="space-y-5">
      <div>
        <label className="mb-2 block text-sm text-tenue" htmlFor="nombre">
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
        <label className="mb-2 block text-sm text-tenue" htmlFor="email">
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
        <label className="mb-2 block text-sm text-tenue" htmlFor="password">
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
        <label className="mb-2 block text-sm text-tenue" htmlFor="repetir">
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

      <Boton />

      {resultado.estado === "error" && (
        <p role="alert" className="text-sm text-acento-suave">
          {resultado.mensaje}
        </p>
      )}
    </form>
  );
}
