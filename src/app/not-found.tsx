import Link from "next/link";
import type { Metadata } from "next";
import { estudio } from "@/config/estudio";

export const metadata: Metadata = { title: "Página no encontrada" };

export default function NoEncontrada() {
  return (
    <main className="relative z-10 flex min-h-screen items-center px-6">
      <div className="mx-auto w-full max-w-2xl">
        <p className="etiqueta text-acento">Error 404</p>
        <h1 className="titular mt-6 text-[clamp(2.5rem,8vw,5rem)] leading-[0.98]">
          Esta página se ha <em>borrado</em>
        </h1>
        <p className="parrafo mt-6 max-w-md text-tenue">
          La dirección que has abierto no existe o ha cambiado. Vuelve al inicio
          y sigue desde ahí.
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/"
            className="boton-barrido rounded-full bg-acento px-8 py-4 text-center font-medium text-white transition-colors duration-300"
          >
            Volver al inicio
          </Link>
          <a
            href={`mailto:${estudio.contacto.email}`}
            className="rounded-full border border-borde px-8 py-4 text-center transition-all duration-300 hover:border-texto hover:bg-superficie/60"
          >
            Escríbenos
          </a>
        </div>
      </div>
    </main>
  );
}
