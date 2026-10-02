import { redirect } from "next/navigation";
import { crearClienteServidor } from "@tinta/compartido/supabase/servidor";
import { tiposEncargo } from "@tinta/compartido/estudio";
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

  // Cifras de la barra: solo cuentas, sin traerse las filas.
  const [citas, clientes, sinResponder, cobros] = await Promise.all([
    supabase.from("citas").select("id", { count: "exact", head: true }),
    supabase.from("clientes").select("id", { count: "exact", head: true }),
    supabase
      .from("citas")
      .select("id", { count: "exact", head: true })
      .eq("estado", "solicitada"),
    supabase
      .from("citas")
      .select("id", { count: "exact", head: true })
      .eq("estado", "realizada")
      .eq("pagado", false)
      .in("tipo", tiposEncargo),
  ]);

  const contadores = {
    oportunidades: citas.count ?? 0,
    clientes: clientes.count ?? 0,
    sinResponder: sinResponder.count ?? 0,
    cobros: cobros.count ?? 0,
  };

  return (
    <div className="min-h-screen lg:flex lg:gap-3 lg:p-3">
      <BarraLateral
        nombre={perfil.nombre ?? perfil.email}
        email={perfil.email}
        contadores={contadores}
        esPropietario
      />

      <main className="min-w-0 flex-1 px-4 pb-8 pt-2 lg:px-4 lg:pt-1">
        {children}
      </main>
    </div>
  );
}
