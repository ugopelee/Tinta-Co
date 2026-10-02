import { permanentRedirect } from "next/navigation";

/** El tablero de citas pasó a ser el de oportunidades; los enlaces viejos siguen valiendo. */
export default function Citas() {
  permanentRedirect("/oportunidades");
}
