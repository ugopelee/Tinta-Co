import {
  Big_Shoulders,
  Bricolage_Grotesque,
  Hanken_Grotesk,
  Inter,
  Instrument_Sans,
  Instrument_Serif,
  Newsreader,
  UnifrakturCook,
} from "next/font/google";

/**
 * Fuentes de la web editable, una variable --fw-* por cada opción del
 * editor (tema.ts las mapea a --w-titulos y --w-texto). Sin preload: solo
 * se descarga la que la plantilla use de verdad.
 */
// next/font exige literales en cada llamada (no admite spread), por eso se repiten las opciones.

const serif = Instrument_Serif({ subsets: ["latin"], display: "swap", preload: false, weight: "400", style: ["normal", "italic"], variable: "--fw-serif" });
const grotesca = Bricolage_Grotesque({ subsets: ["latin"], display: "swap", preload: false, variable: "--fw-grotesca" });
const gotica = UnifrakturCook({ subsets: ["latin"], display: "swap", preload: false, weight: "700", variable: "--fw-gotica" });
const rotulo = Big_Shoulders({ subsets: ["latin"], display: "swap", preload: false, weight: "800", variable: "--fw-rotulo" });
const inter = Inter({ subsets: ["latin"], display: "swap", preload: false, variable: "--fw-inter" });
const hanken = Hanken_Grotesk({ subsets: ["latin"], display: "swap", preload: false, variable: "--fw-hanken" });
const instrument = Instrument_Sans({ subsets: ["latin"], display: "swap", preload: false, variable: "--fw-instrument" });
const newsreader = Newsreader({ subsets: ["latin"], display: "swap", preload: false, style: ["normal", "italic"], variable: "--fw-newsreader" });

/** Clases que declaran las variables --fw-*; van en el contenedor de la web. */
export const clasesFuentesSitio = [serif, grotesca, gotica, rotulo, inter, hanken, instrument, newsreader]
  .map((f) => f.variable)
  .join(" ");
