import Link from "next/link";
import type { Metadata } from "next";
import { MarcoCuenta } from "@/components/MarcoCuenta";
import { FormularioAlta } from "@/components/FormulariosCuenta";

export const metadata: Metadata = { title: "Crear cuenta" };

export default function CrearCuenta() {
  return (
    <MarcoCuenta
      titulo="Crea tu cuenta"
      entradilla="Con una cuenta guardas tus datos y no tienes que repetirlos en cada reserva."
      pie={
        <>
          ¿Ya tienes cuenta?{" "}
          <Link href="/acceder" className="enlace-sutil text-texto">
            Accede aquí
          </Link>
        </>
      }
    >
      <FormularioAlta />
    </MarcoCuenta>
  );
}
