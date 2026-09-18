import Link from "next/link";
import type { Metadata } from "next";
import { estudio } from "@tinta/compartido/estudio";
import { FormularioLogin } from "@/components/FormularioLogin";
import { BotonGoogle } from "@/components/BotonGoogle";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default async function PaginaLogin({
  searchParams,
}: PageProps<"/login">) {
  const parametros = await searchParams;

  // Solo rutas internas: "//otro-dominio.com" empieza por "/" pero el
  // navegador lo trataría como absoluto.
  const propuesta = parametros.volver;
  const volver =
    typeof propuesta === "string" &&
    propuesta.startsWith("/") &&
    !propuesta.startsWith("//")
      ? propuesta
      : "/";

  return (
    <main className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      {/* Columna de marca: da contexto de dónde estás entrando. */}
      <section className="relative hidden flex-col justify-between overflow-hidden border-r border-borde bg-superficie/40 p-10 lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-32 top-1/3 h-[34rem] w-[34rem] rounded-full opacity-20 blur-[130px]"
          style={{ background: "var(--acento)" }}
        />

        <div className="relative flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-acento text-sm font-semibold text-white">
            T
          </span>
          <div>
            <p className="titular text-[0.95rem] leading-none">
              {estudio.nombre}
            </p>
            <p className="mt-1 text-xs text-tenue">Panel del estudio</p>
          </div>
        </div>

        <div className="relative">
          <p className="titular text-4xl leading-tight">
            Las citas, los clientes y su historial
            <span className="text-texto/35"> en un solo sitio.</span>
          </p>
          <p className="parrafo mt-5 max-w-sm text-sm text-tenue">
            Este panel es privado. Si no formas parte del estudio, no verás
            ningún dato aunque tengas cuenta.
          </p>
        </div>

        <p className="relative etiqueta text-tenue/60">
          {estudio.contacto.direccion}
        </p>
      </section>

      <section className="flex items-center justify-center px-6 py-14">
        <div className="w-full max-w-sm">
          <div className="lg:hidden">
            <Link href="/" className="titular text-2xl">
              {estudio.nombre}
            </Link>
          </div>

          <h1 className="titular mt-6 text-3xl lg:mt-0">Inicia sesión</h1>
          <p className="mt-2 text-sm text-tenue">
            Entra con tu cuenta del estudio para ver el panel.
          </p>

          <div className="mt-8">
            <BotonGoogle />
          </div>

          {parametros.error === "google_sin_configurar" && (
            <p
              role="alert"
              className="parrafo mt-4 rounded-lg border border-borde bg-superficie px-4 py-3 text-sm text-tenue"
            >
              El acceso con Google todavía no está configurado en este
              proyecto. Entra con tu email y contraseña mientras tanto.
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

          <p className="mt-7 text-sm text-tenue">
            ¿No tienes cuenta?{" "}
            <Link href="/registro" className="enlace-sutil text-texto">
              Crear una
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
