import { redirect } from "next/navigation";
import { crearClienteServidor } from "@tinta/compartido/supabase/servidor";
import type { Perfil } from "@tinta/compartido/tipos";
import { BarraLateral } from "@/components/BarraLateral";

export default async function LayoutPrivado({ children }: LayoutProps<"/">) {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data } = await supabase
    .from("perfiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const perfil = data as Perfil | null;

  // Registrarse no da acceso: los datos son solo para propietarios.
  if (perfil?.rol !== "propietario") redirect("/sin-acceso");

  return (
    <div className="lg:flex">
      <BarraLateral
        nombre={perfil.nombre ?? perfil.email}
        email={perfil.email}
        esPropietario
      />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
