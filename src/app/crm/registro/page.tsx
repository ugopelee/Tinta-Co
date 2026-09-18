import Link from "next/link";
import type { Metadata } from "next";
import { estudio } from "@/config/estudio";
import { FormularioRegistro } from "@/components/crm/FormularioRegistro";

export const metadata: Metadata = { title: "Crear cuenta" };

export default function PaginaRegistro() {
  return (
    <main className="relative z-10 flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="titular text-2xl">
          {estudio.nombre}
        </Link>
        <p className="mt-2 text-sm text-tenue">Crea tu cuenta</p>

        <div className="mt-8 rounded-2xl border border-borde bg-superficie p-8">
          <FormularioRegistro />
        </div>

        <p className="mt-6 text-sm text-tenue">
          ¿Ya tienes cuenta?{" "}
          <Link href="/crm/login" className="enlace-sutil text-texto">
            Inicia sesión
          </Link>
        </p>

        <p className="parrafo mt-6 rounded-lg border border-borde bg-superficie/60 px-4 py-3 text-xs text-tenue">
          Crear una cuenta no da acceso a las reservas ni a las fichas de
          clientes: eso solo lo ve el propietario del estudio, que es quien
          concede permisos.
        </p>
      </div>
    </main>
  );
}
