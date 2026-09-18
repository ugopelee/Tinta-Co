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
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-10">
        <h1 className="titular text-3xl">Cuentas</h1>
        <p className="parrafo mt-2 text-sm text-tenue">
          Todo el que se registra aparece aquí, pero registrarse no da acceso a
          nada. Solo el equipo ve las reservas y las fichas de clientes: dar
          permisos de propietario a una cuenta la mueve al equipo, y quitárselos
          la saca.
        </p>
      </div>

      <ListaCuentas perfiles={perfiles} idPropio={user!.id} />
    </div>
  );
}
