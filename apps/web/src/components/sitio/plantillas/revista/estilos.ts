/**
 * CSS propio de Revista, acotado a `.revista`. Solo lo que Tailwind no cubre:
 * superficies del navegador (selección, foco, caret), capitular, el destape de
 * fotos y el menú móvil. Todo con variables --w-*.
 */
export const CSS_REVISTA = `
.revista { --r-salida: cubic-bezier(0.23, 1, 0.32, 1); caret-color: var(--w-acento-tinta); scrollbar-color: var(--w-linea) var(--w-fondo); }
.revista ::selection { background: var(--w-acento); color: var(--w-sobre-acento); }
.revista :focus-visible { outline: 2px solid var(--w-acento-tinta); outline-offset: 3px; }
.revista .r-banda :focus-visible { outline-color: var(--w-sobre-acento); }
.revista .r-banda em { color: inherit; }
.revista .r-banda ::selection { background: var(--w-sobre-acento); color: var(--w-acento); }
.revista input:focus-visible, .revista select:focus-visible, .revista textarea:focus-visible { outline-offset: 0; }
.revista a { text-underline-offset: 0.2em; }

.revista .r-capital::first-letter {
  font-family: var(--w-titulos), ui-serif, Georgia, serif;
  float: left; font-size: 4.6em; line-height: 0.82; padding: 0.06em 0.12em 0 0; color: var(--w-acento-tinta);
}

.revista [data-revela="oculto"] { clip-path: inset(0 0 100% 0); }
.revista [data-revela="oculto"] img { transform: scale(1.05); }
.revista [data-revela="visto"] { clip-path: inset(0 0 0 0); transition: clip-path 1000ms var(--r-salida); }
.revista [data-revela="visto"] img { transform: none; transition: transform 1300ms var(--r-salida); }

.revista .r-panel { animation: r-panel 240ms var(--r-salida) both; }
@keyframes r-panel { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }

.revista .r-mas { transition: transform 200ms var(--r-salida); }
.revista details[open] .r-mas { transform: rotate(90deg); }

@media (prefers-reduced-motion: reduce) {
  .revista .r-panel { animation: r-panel-suave 150ms ease both; }
  .revista .r-mas { transition: none; }
  .revista [data-revela] { clip-path: none !important; transition: none !important; }
  .revista [data-revela] img { transform: none !important; transition: none !important; }
}
@keyframes r-panel-suave { from { opacity: 0; } to { opacity: 1; } }
`;
