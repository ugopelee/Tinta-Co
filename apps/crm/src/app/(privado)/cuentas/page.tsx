import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { crearClienteServidor } from "@tinta/compartido/supabase/servidor";
import type { Perfil } from "@tinta/compartido/tipos";
import { ListaCuentas } from "@/components/ListaCuentas";

export const metadata: Metadata = { title: "Cuentas" };

export default async function Cuentas() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: propio } = await supabase
    .from("perfiles")
    .select("rol")
    .eq("id", user!.id)
    .maybeSingle();

  if (propio?.rol !== "propietario") notFound();

  const { data } = await supabase
    .from("perfiles")
    .select("*")
    .order("created_at", { ascending: true });

  const perfiles = (data ?? []) as Perfil[];

  return (
    <div className="max-w-4xl px-4 py-6 lg:px-6 lg:py-7">
      <header className="mb-6">
        <h1 className="titular text-xl lg:text-[1.375rem]">Cuentas</h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-tenue">
          Todo el que se registra aparece aquí, pero registrarse no da acceso a
          nada. Solo el equipo ve las reservas y las fichas de clientes: dar
          permisos de propietario a una cuenta la mueve al equipo, y quitárselos
          la saca.
        </p>
      </header>

      <ListaCuentas perfiles={perfiles} idPropio={user!.id} />
    </div>
  );
}
