import Link from "next/link";
import type { Metadata } from "next";
import { estudio } from "@tinta/compartido/estudio";
import { Logo } from "@/components/Logo";
import { FormularioLogin } from "@/components/FormularioLogin";
import { BotonGoogle } from "@/components/BotonGoogle";
import { googleDisponible } from "@/lib/google";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default async function PaginaLogin({
  searchParams,
}: PageProps<"/login">) {
  const parametros = await searchParams;
  const conGoogle = await googleDisponible();

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
    <main id="contenido" tabIndex={-1} className="grid grid-cols-1 min-h-screen gap-3 p-3 lg:grid-cols-[1fr_1.1fr]">
      {/* Columna de marca: da contexto de dónde estás entrando. */}
      <section className="relative hidden flex-col justify-between overflow-hidden rounded-[1.25rem] bg-texto p-10 text-fondo lg:flex">
        {/* Aurora: tres focos de color que derivan despacio sobre el negro. */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div
            className="login-deriva absolute -left-24 top-[8%] h-[26rem] w-[26rem] rounded-full opacity-60 blur-[110px]"
            style={{ background: "var(--lima)" }}
          />
          <div
            className="login-deriva absolute -right-28 bottom-[6%] h-[24rem] w-[24rem] rounded-full opacity-45 blur-[120px]"
            style={{ background: "var(--azul)", animationDelay: "-6s" }}
          />
          <div
            className="login-deriva absolute right-[12%] top-[-8%] h-[16rem] w-[16rem] rounded-full opacity-35 blur-[100px]"
            style={{ background: "var(--acento)", animationDelay: "-11s" }}
          />
          <div className="login-puntos absolute inset-0" />
        </div>

        <div className="relative flex items-center gap-3">
          <Logo className="h-12 w-12" />
          <div>
            <p className="titular text-[0.95rem] leading-none">
              {estudio.nombre}
            </p>
            <p className="mt-1 text-xs text-fondo/60">Panel del estudio</p>
          </div>
        </div>

        <div className="relative">
          <p className="titular text-4xl leading-tight">
            Tinta, oficio y
            <span style={{ color: "var(--lima)" }}> buen trabajo.</span>
          </p>
          <p className="parrafo mt-5 max-w-sm text-sm text-fondo/60">
            Acceso exclusivo para el equipo de {estudio.nombre}.
          </p>
        </div>

        <p className="relative etiqueta text-fondo/50">
          {estudio.contacto.direccion}
        </p>
      </section>

      <section className="tarjeta flex items-center justify-center px-6 py-14">
        <div className="w-full max-w-sm">
          <div className="lg:hidden">
            <Link href="/" className="titular text-2xl">
              {estudio.nombre}
            </Link>
          </div>

          <h1 className="titular mt-6 text-3xl lg:mt-0">Inicia sesión</h1>
          <p className="mt-2 text-sm text-tenue">
            Entra con la cuenta que te ha dado el estudio. Si no tienes una, pídesela a la persona que administra el panel.
          </p>

          {/* Sin el proveedor activo en Supabase, el botón solo lleva a un
              error: mejor no ofrecerlo y dejar el acceso por email. */}
          {conGoogle && (
            <>
              <div className="mt-8">
                <BotonGoogle />
              </div>

              <div className="my-7 flex items-center gap-4">
                <span className="h-px flex-1 bg-borde" />
                <span className="etiqueta text-tenue">o</span>
                <span className="h-px flex-1 bg-borde" />
              </div>
            </>
          )}

          {parametros.error === "google" && (
            <p role="alert" className="mt-6 text-sm text-acento-suave">
              No hemos podido entrar con Google. Prueba con tu email y
              contraseña.
            </p>
          )}

          <div className={conGoogle ? "" : "mt-8"}>
            <FormularioLogin volver={volver} />
          </div>
        </div>
      </section>
    </main>
  );
}
