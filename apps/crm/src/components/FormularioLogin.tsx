"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { iniciarSesion } from "@/app/acciones";
import { formularioInicial } from "@tinta/compartido/formularios";

const claseCampo =
  "w-full rounded-xl border border-borde bg-superficie px-4 py-3 text-texto outline-none transition-colors duration-200 placeholder:text-tenue/70 focus:border-texto focus:ring-2 focus:ring-texto/10";

function Boton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="boton w-full py-3 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Entrando…" : "Entrar"}
    </button>
  );
}

export function FormularioLogin({ volver }: { volver: string }) {
  const [resultado, accion] = useActionState(iniciarSesion, formularioInicial);

  return (
    <form action={accion} className="space-y-5">
      <input type="hidden" name="volver" value={volver} />

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
          autoComplete="current-password"
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
