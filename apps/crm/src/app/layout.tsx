import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, Geist_Mono, Instrument_Sans } from "next/font/google";
import { estudio } from "@tinta/compartido/estudio";
import "./globals.css";

const cuerpo = Instrument_Sans({
  variable: "--font-cuerpo",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const titulo = Bodoni_Moda({
  variable: "--font-titulo",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
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
  themeColor: estudio.paleta.fondo,
  colorScheme: "dark",
};

const paletaCss = `:root{${Object.entries(estudio.paleta)
  .map(([clave, valor]) => {
    const nombre = clave.replace(/[A-Z]/g, (letra) => `-${letra.toLowerCase()}`);
    return `--${nombre}:${valor};`;
  })
  .join("")}}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${cuerpo.variable} ${titulo.variable} ${mono.variable} h-full antialiased`}
    >
      <head>
        <style dangerouslySetInnerHTML={{ __html: paletaCss }} />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
