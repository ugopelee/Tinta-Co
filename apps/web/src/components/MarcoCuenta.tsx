import Link from "next/link";
import type { ReactNode } from "react";
import { estudio } from "@tinta/compartido/estudio";

/** Marco de cristal compartido por acceder y crear cuenta. */
export function MarcoCuenta({
  titulo,
  entradilla,
  children,
  pie,
}: {
  titulo: string;
  entradilla: string;
  children: ReactNode;
  pie: ReactNode;
}) {
  return (
    <main className="relative z-10 flex min-h-screen items-center justify-center overflow-hidden px-5 py-16 sm:px-6">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 h-[38rem] w-[38rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20 blur-[140px]"
        style={{ background: "var(--acento)" }}
      />

      <div className="relative w-full max-w-md">
        <Link href="/" className="titular text-2xl">
          {estudio.nombre}
        </Link>

        <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8">
          <h1 className="titular text-3xl">{titulo}</h1>
          <p className="parrafo mt-2 text-sm text-tenue">{entradilla}</p>

          <div className="mt-8">{children}</div>
        </div>

        <div className="mt-6 text-sm text-tenue">{pie}</div>

        <Link
          href="/"
          className="enlace-sutil mt-8 inline-block text-sm text-tenue transition-colors hover:text-texto"
        >
          ← Volver a la web
        </Link>
      </div>
    </main>
  );
}
