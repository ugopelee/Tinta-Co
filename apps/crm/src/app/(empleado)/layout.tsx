import { redirect } from "next/navigation";
import { crearClienteServidor } from "@tinta/compartido/supabase/servidor";
import { estudio } from "@tinta/compartido/estudio";
import type { Perfil } from "@tinta/compartido/tipos";
import { cerrarSesion } from "@/app/acciones";
import { Icono } from "@/components/Icono";
import { Logo } from "@/components/Logo";
import { SelectorTema } from "@/components/SelectorTema";

/**
 * Portal del equipo. Un empleado no ve clientes, citas ni caja: solo lo suyo.
 * Sin barra lateral; una cabecera mínima con su nombre y la salida.
 */
export default async function LayoutEmpleado({ children }: LayoutProps<"/">) {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data } = await supabase.from("perfiles").select("*").eq("id", user.id).maybeSingle();
  const perfil = data as Perfil | null;

  // El propietario tiene su panel completo; el resto, la pantalla de aviso.
  if (perfil?.rol === "propietario") redirect("/equipo");
  if (perfil?.rol !== "empleado") redirect("/sin-acceso");

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-4">
        <span className="flex items-center gap-2.5">
          <Logo className="h-9 w-9" />
          <span className="text-[0.95rem] font-semibold tracking-tight">
            {estudio.nombre}
            <span className="ml-2 font-normal text-tenue">· Portal del equipo</span>
          </span>
        </span>

        <span className="flex items-center gap-1">
          <span className="mr-2 hidden text-sm text-tenue sm:inline">{perfil.nombre ?? perfil.email}</span>
          <SelectorTema />
          <form action={cerrarSesion}>
            <button
              type="submit"
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
              className="flex h-8 w-8 items-center justify-center rounded-full text-tenue transition-colors duration-200 hover:bg-superficie-alta hover:text-acento"
            >
              <Icono nombre="salir" className="h-4 w-4" />
            </button>
          </form>
        </span>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-10">{children}</main>
    </div>
  );
}
