import type { Metadata, Viewport } from "next";
import { Geist_Mono, Instrument_Sans, Plus_Jakarta_Sans } from "next/font/google";
import { estudio } from "@tinta/compartido/estudio";
import "./globals.css";

const cuerpo = Instrument_Sans({
  variable: "--font-cuerpo",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

// Misma familia que la web: un panel se lee mejor con una grotesca que con
// una romana de contraste alto.
const titulo = Plus_Jakarta_Sans({
  variable: "--font-titulo",
  subsets: ["latin"],
  weight: ["500", "700", "800"],
});

const mono = Geist_Mono({
  variable: "--font-mono-ui",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: {
    default: `Panel · ${estudio.nombre}`,
    template: `%s · ${estudio.nombre}`,
  },
  description: `Panel de gestión de ${estudio.nombre}`,
  // Un panel privado no debe aparecer en buscadores.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: estudio.paleta.fondo },
    { media: "(prefers-color-scheme: light)", color: estudio.paletaClara.fondo },
  ],
};

function aVariables(paleta: Record<string, string>) {
  return Object.entries(paleta)
    .map(([clave, valor]) => {
      const nombre = clave.replace(/[A-Z]/g, (letra) => `-${letra.toLowerCase()}`);
      return `--${nombre}:${valor};`;
    })
    .join("");
}

// Oscuro por defecto; el atributo data-tema conmuta al claro.
const paletaCss = `
:root{${aVariables(estudio.paleta)}color-scheme:dark}
:root[data-tema="claro"]{${aVariables(estudio.paletaClara)}color-scheme:light}
`;

/**
 * Corre antes de pintar: sin esto la primera carga en modo claro daría un
 * fogonazo oscuro y la barra lateral saltaría de ancho. Lee las preferencias
 * guardadas y, para el tema, cae en la del sistema.
 */
const guionPreferencias = `
try{
  var t = localStorage.getItem("tema");
  if(!t) t = matchMedia("(prefers-color-scheme: light)").matches ? "claro" : "oscuro";
  document.documentElement.dataset.tema = t;
  document.documentElement.dataset.barra = localStorage.getItem("barra") || "abierta";
}catch(e){}
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${cuerpo.variable} ${titulo.variable} ${mono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <style dangerouslySetInnerHTML={{ __html: paletaCss }} />
        <script dangerouslySetInnerHTML={{ __html: guionPreferencias }} />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
