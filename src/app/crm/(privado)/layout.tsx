import Link from "next/link";
import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";
import { cerrarSesion } from "../acciones";
import { estudio } from "@/config/estudio";
import type { Perfil } from "@/lib/tipos";

export default async function LayoutPrivado({ children }: LayoutProps<"/crm">) {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/crm/login");

  const { data } = await supabase
    .from("perfiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const perfil = data as Perfil | null;

  // El CRM no existe para quien no es propietario: ni pantalla de aviso ni
  // pista de que haya algo aquí. Se le devuelve a la web pública.
  if (perfil?.rol !== "propietario") {
    redirect("/");
  }

  return (
    <div className="relative z-10 flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-borde bg-fondo/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-baseline gap-4">
            <Link href="/crm" className="titular text-xl">
              {estudio.nombre}
            </Link>
            <span className="etiqueta text-tenue">CRM</span>
          </div>

          <div className="flex items-center gap-5 text-sm">
            <Link
              href="/crm"
              className="text-tenue transition-colors hover:text-texto"
            >
              Tablero
            </Link>
            {perfil.rol === "propietario" && (
              <Link
                href="/crm/cuentas"
                className="text-tenue transition-colors hover:text-texto"
              >
                Cuentas
              </Link>
            )}
            <span className="hidden text-tenue sm:inline">{perfil.email}</span>
            <Link
              href="/"
              className="text-tenue transition-colors hover:text-texto"
            >
              Ver web
            </Link>
            <form action={cerrarSesion}>
              <button
                type="submit"
                className="rounded-full border border-borde px-4 py-1.5 text-tenue transition-colors hover:border-acento hover:text-texto"
              >
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>
    </div>
  );
}
