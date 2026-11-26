import { Toaster } from "sonner";
import {
  Big_Shoulders,
  Bricolage_Grotesque,
  Hanken_Grotesk,
  Instrument_Sans,
  Instrument_Serif,
  Inter,
  Newsreader,
  UnifrakturCook,
} from "next/font/google";

/**
 * Las ocho fuentes de la web, con las variables --fw-* que lee `tema.ts`.
 * Aquí y no en el layout raíz: el resto del panel no las necesita. Sin
 * preload, solo se bajan al abrir el editor (y la elegida en la vista previa
 * ya la carga la web, que es otra app).
 */
// next/font exige literales en cada llamada (no admite spread).

const serif = Instrument_Serif({ subsets: ["latin"], display: "swap", preload: false, variable: "--fw-serif", weight: "400", style: ["normal", "italic"] });
const grotesca = Bricolage_Grotesque({ subsets: ["latin"], display: "swap", preload: false, variable: "--fw-grotesca" });
const gotica = UnifrakturCook({ subsets: ["latin"], display: "swap", preload: false, variable: "--fw-gotica", weight: "700" });
const rotulo = Big_Shoulders({ subsets: ["latin"], display: "swap", preload: false, variable: "--fw-rotulo", weight: "800" });
const inter = Inter({ subsets: ["latin"], display: "swap", preload: false, variable: "--fw-inter" });
const hanken = Hanken_Grotesk({ subsets: ["latin"], display: "swap", preload: false, variable: "--fw-hanken" });
const instrument = Instrument_Sans({ subsets: ["latin"], display: "swap", preload: false, variable: "--fw-instrument" });
const newsreader = Newsreader({ subsets: ["latin"], display: "swap", preload: false, variable: "--fw-newsreader" });

const clases = [serif, grotesca, gotica, rotulo, inter, hanken, instrument, newsreader]
  .map((f) => f.variable)
  .join(" ");

export default function LayoutWeb({ children }: { children: React.ReactNode }) {
  return (
    <div className={clases}>
      {children}
      {/* Los colores salen de las variables del panel, así sigue el tema claro/oscuro elegido. */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "var(--superficie)",
            color: "var(--texto)",
            border: "1px solid var(--borde)",
            borderRadius: "0.875rem",
          },
        }}
      />
    </div>
  );
}
