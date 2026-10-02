import type { NextRequest } from "next/server";
import { crearClienteServidor } from "@tinta/compartido/supabase/servidor";
import { tiposEncargo, tiposOportunidad } from "@tinta/compartido/estudio";
import { metodosPago, type Cita } from "@tinta/compartido/tipos";
import { trimestreDe } from "@/lib/trimestres";

type Fila = Cita & { disenos: { nombre: string } | null };

/**
 * Celda de CSV. Comillas dobladas, y lo que empieza por = + - @ se escapa:
 * un nombre de cliente como «=HYPERLINK(…)» no debe ejecutarse al abrirlo
 * en Excel.
 */
function celda(valor: string | number | null) {
  if (valor === null) return "";
  let texto = String(valor);
  if (/^[=+\-@\t\r]/.test(texto)) texto = `'${texto}`;
  return /[";\n\r]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

/** Cobros del trimestre en CSV para la gestoría (separador «;», coma decimal). */
export async function GET(request: NextRequest) {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Sesión caducada.", { status: 401 });

  // El proxy no protege esto por su cuenta: se comprueba el rol aquí.
  const { data: perfil } = await supabase
    .from("perfiles")
    .select("rol")
    .eq("id", user.id)
    .maybeSingle();
  if (perfil?.rol !== "propietario") return new Response("Sin permiso.", { status: 403 });

  const t = trimestreDe(request.nextUrl.searchParams.get("t") ?? undefined);

  const { data, error } = await supabase
    .from("citas")
    .select("*, disenos(nombre)")
    .in("tipo", tiposEncargo)
    .eq("pagado", true)
    .gte("fecha_cobro", t.desde)
    .lt("fecha_cobro", t.hasta)
    .order("fecha_cobro", { ascending: true });

  if (error) {
    console.error("Error al exportar los cobros:", error);
    return new Response("No se han podido leer los cobros.", { status: 500 });
  }

  const cabecera = ["Fecha de cobro", "Cliente", "Email", "Teléfono", "Tipo", "Estilo o evento", "Diseño flash", "Método de pago", "Importe (€)"];

  const filas = ((data ?? []) as Fila[]).map((cita) =>
    [
      cita.fecha_cobro,
      cita.nombre,
      cita.email,
      cita.telefono,
      tiposOportunidad.find((tipo) => tipo.id === cita.tipo)?.nombre ?? cita.tipo,
      cita.estilo_interes ?? cita.tipo_evento,
      cita.disenos?.nombre ?? null,
      metodosPago.find((metodo) => metodo.id === cita.metodo_pago)?.nombre ?? null,
      Number(cita.importe ?? 0).toFixed(2).replace(".", ","),
    ]
      .map(celda)
      .join(";"),
  );

  // BOM: sin él, Excel en español abre el UTF-8 como Latin-1 y rompe las tildes.
  const csv = "﻿" + [cabecera.map(celda).join(";"), ...filas].join("\r\n") + "\r\n";

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="cobros-tintaco-${t.clave}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
