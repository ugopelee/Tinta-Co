import Link from "next/link";
import type { Metadata } from "next";
import { MarcoCuenta } from "@/components/MarcoCuenta";
import { BotonGoogle } from "@/components/BotonGoogle";
import { FormularioAcceso } from "@/components/FormulariosCuenta";

export const metadata: Metadata = { title: "Acceder" };

export default async function Acceder({ searchParams }: PageProps<"/acceder">) {
  const parametros = await searchParams;

  return (
    <MarcoCuenta
      titulo="Accede a tu cuenta"
      entradilla="Entra para seguir tus citas y tu historial en el estudio."
      pie={
        <>
          ¿Todavía no tienes cuenta?{" "}
          <Link href="/crear-cuenta" className="enlace-sutil text-texto">
            Créala aquí
          </Link>
        </>
      }
    >
      <BotonGoogle />

      {parametros.error === "google_sin_configurar" && (
        <p
          role="alert"
          className="parrafo mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-tenue"
        >
          El acceso con Google todavía no está configurado en este proyecto.
          Entra con tu email y contraseña mientras tanto.
        </p>
      )}

      {parametros.error === "google" && (
        <p role="alert" className="mt-4 text-sm text-acento-suave">
          No hemos podido entrar con Google. Prueba con tu email y contraseña.
        </p>
      )}

      <div className="my-7 flex items-center gap-4">
        <span className="h-px flex-1 bg-white/10" />
        <span className="etiqueta text-tenue">o</span>
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <FormularioAcceso />
    </MarcoCuenta>
  );
}
