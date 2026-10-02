import type { Metadata } from "next";
import { estudio } from "@tinta/compartido/estudio";
import { cerrarSesion } from "@/app/acciones";

export const metadata: Metadata = { title: "Sin acceso" };

const URL_WEB = process.env.NEXT_PUBLIC_URL_WEB ?? "/";

export default function SinAcceso() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        <p className="chip-lima">Sin permisos</p>
        <h1 className="titular mt-5 text-3xl">Este panel es del propietario</h1>
        <p className="parrafo mt-5 text-tenue">
          Tu cuenta existe, pero las reservas y las fichas de clientes de{" "}
          {estudio.nombre} solo las ve el propietario del estudio.
        </p>

        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <form action={cerrarSesion}>
            <button
              type="submit"
              className="w-full rounded-full border border-borde px-6 py-3 text-sm transition-colors hover:border-texto sm:w-auto"
            >
              Cerrar sesión
            </button>
          </form>
          <a
            href={URL_WEB}
            className="rounded-full border border-borde px-6 py-3 text-sm transition-colors hover:border-texto"
          >
            Ir a la web
          </a>
        </div>
      </div>
    </main>
  );
}
