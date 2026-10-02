import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist_Mono, Inter, Instrument_Serif } from "next/font/google";
import { estudio } from "@tinta/compartido/estudio";
import "./globals.css";

// Una sola grotesca neutra, en pesos bajos: el carácter lo ponen el aire,
// la serif en cursiva y el lienzo de puntos, no el grosor de las letras.
const cuerpo = Inter({
  variable: "--font-cuerpo",
  subsets: ["latin"],
});

// Serif de contraste para una palabra por titular. En cursiva recuerda al
// trazo de un lettering.
const serif = Instrument_Serif({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

// Reservada a etiquetas y cifras pequeñas.
const mono = Geist_Mono({
  variable: "--font-mono-ui",
  subsets: ["latin"],
  weight: ["400"],
});

// Solo para el menú: una grotesca con carácter, que se lea en mayúsculas
// pequeñas sin parecer la letra de sistema.
const menu = Bricolage_Grotesque({
  variable: "--font-menu-ui",
  subsets: ["latin"],
  weight: ["500", "600"],
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
      className={`${cuerpo.variable} ${serif.variable} ${mono.variable} ${menu.variable} h-full antialiased`}
    >
      <head>
        <style dangerouslySetInnerHTML={{ __html: paletaCss }} />
        {/* Sin JS las animaciones de entrada no se ejecutan: el contenido
            debe verse igualmente en lugar de quedarse en opacidad 0. */}
        <noscript>
          <style>{`[data-revelar]{opacity:1 !important;transform:none !important;filter:none !important}`}</style>
        </noscript>
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
