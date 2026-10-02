import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import { estudio } from "@tinta/compartido/estudio";
import "./globals.css";

// Una sola grotesca neutra para todo el panel: la jerarquía la hacen el
// tamaño y el peso. Inter tiene cifras tabulares y se lee bien pequeña.
const cuerpo = Inter({
  variable: "--font-cuerpo",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
    { media: "(prefers-color-scheme: dark)", color: estudio.panelOscuro.fondo },
    { media: "(prefers-color-scheme: light)", color: estudio.panelClaro.fondo },
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

// Claro por defecto; el atributo data-tema conmuta al oscuro.
const paletaCss = `
:root{${aVariables(estudio.panelClaro)}color-scheme:light}
:root[data-tema="oscuro"]{${aVariables(estudio.panelOscuro)}color-scheme:dark}
`;

/**
 * Corre antes de pintar: sin esto la primera carga en modo claro daría un
 * fogonazo oscuro y la barra lateral saltaría de ancho. Lee las preferencias
 * guardadas y, para el tema, cae en la del sistema.
 */
const guionPreferencias = `
try{
  var t = localStorage.getItem("tema");
  if(!t) t = matchMedia("(prefers-color-scheme: dark)").matches ? "oscuro" : "claro";
  document.documentElement.dataset.tema = t;
  document.documentElement.dataset.barra = localStorage.getItem("barra") || "abierta";
}catch(e){}
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${cuerpo.variable} ${mono.variable} h-full antialiased`}
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
