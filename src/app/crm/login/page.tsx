import Link from "next/link";
import type { Metadata } from "next";
import { estudio } from "@/config/estudio";
import { FormularioLogin } from "@/components/crm/FormularioLogin";
import { BotonGoogle } from "@/components/crm/BotonGoogle";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default async function PaginaLogin({
  searchParams,
}: PageProps<"/crm/login">) {
  const parametros = await searchParams;
  const volver =
    typeof parametros.volver === "string" && parametros.volver.startsWith("/crm")
      ? parametros.volver
      : "/crm";

  return (
    <main className="relative z-10 flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="titular text-2xl">
          {estudio.nombre}
        </Link>
        <p className="mt-2 text-sm text-tenue">Inicia sesión en tu cuenta</p>

        <div className="mt-8 rounded-2xl border border-borde bg-superficie p-8">
          <BotonGoogle />

          {parametros.error === "google_sin_configurar" && (
            <p
              role="alert"
              className="parrafo mt-4 rounded-lg border border-borde bg-fondo px-4 py-3 text-sm text-tenue"
            >
              El acceso con Google todavía no está configurado en este proyecto.
              Entra con tu email y contraseña mientras tanto.
            </p>
          )}

          {parametros.error === "google" && (
            <p role="alert" className="mt-4 text-sm text-acento-suave">
              No hemos podido entrar con Google. Prueba con tu email y
              contraseña.
            </p>
          )}

          <div className="my-7 flex items-center gap-4">
            <span className="h-px flex-1 bg-borde" />
            <span className="etiqueta text-tenue">o</span>
            <span className="h-px flex-1 bg-borde" />
          </div>

          <FormularioLogin volver={volver} />
        </div>

        <p className="mt-6 text-sm text-tenue">
          ¿No tienes cuenta?{" "}
          <Link href="/crm/registro" className="enlace-sutil text-texto">
            Crear una
          </Link>
        </p>

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
