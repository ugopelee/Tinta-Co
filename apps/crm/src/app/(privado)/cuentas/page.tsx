import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { crearClienteServidor } from "@tinta/compartido/supabase/servidor";
import type { Perfil } from "@tinta/compartido/tipos";
import { ListaCuentas } from "@/components/ListaCuentas";
import { Encabezado } from "@/components/Encabezado";

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
    <div className="max-w-4xl">
      <Encabezado
        miga="Ajustes · acceso"
        titulo="Cuentas"
        nota="Todo el que se registra aparece aquí, pero registrarse no da acceso a nada. Dar permisos de propietario a una cuenta la mueve al equipo, y quitárselos la saca."
      />

      <ListaCuentas perfiles={perfiles} idPropio={user!.id} />
    </div>
  );
}
