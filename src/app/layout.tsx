import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, Geist_Mono, Instrument_Sans } from "next/font/google";
import { estudio } from "@/config/estudio";
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

// Reservada a etiquetas, numeración de secciones y cifras.
const mono = Geist_Mono({
  variable: "--font-mono-ui",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: {
    default: `${estudio.nombre} — ${estudio.eslogan}`,
    template: `%s · ${estudio.nombre}`,
  },
  description: estudio.descripcion,
  applicationName: estudio.nombre,
  openGraph: {
    title: `${estudio.nombre} — ${estudio.eslogan}`,
    description: estudio.descripcion,
    locale: "es_ES",
    type: "website",
    siteName: estudio.nombre,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: estudio.paleta.fondo,
  colorScheme: "dark",
};

// La paleta vive en src/config/estudio.ts y entra aquí como variables CSS.
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
        {/* Sin JS las animaciones de entrada no se ejecutan: el contenido
            debe verse igualmente en lugar de quedarse en opacidad 0. */}
        <noscript>
          <style>{`[data-revelar]{opacity:1 !important;transform:none !important}`}</style>
        </noscript>
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
