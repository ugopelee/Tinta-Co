/**
 * CSS propio de Cartel (lo que Tailwind no expresa cómodo): muescas de los
 * boletos, sello, cinta torcida, panel del menú móvil, preguntas y estados del
 * navegador. Todo cuelga de `.ct` para no salirse de la plantilla.
 */
export const CSS_CARTEL = `
.ct{--ct-ease:cubic-bezier(.23,1,.32,1);scroll-padding-top:5rem}
.ct ::selection{background:var(--w-acento);color:var(--w-sobre-acento)}
.ct :focus-visible{outline:3px solid var(--k-tinta,var(--w-tinta));outline-offset:3px}
.ct a{text-underline-offset:.2em;text-decoration-thickness:2px}

.ct-boton{transition:background-color 160ms var(--ct-ease),color 160ms var(--ct-ease),transform 160ms var(--ct-ease);-webkit-tap-highlight-color:transparent}
.ct-boton:active{transform:scale(.97)}
.ct-boton:disabled{cursor:wait;opacity:.7}
@media (hover:hover) and (pointer:fine){
  .ct-boton:hover{background:var(--k-tinta);color:var(--k-fondo)}
  .ct-subraya:hover{text-decoration-line:underline}
}

/* Boleto: muescas semicirculares a media altura, a izquierda y derecha. */
.ct-boleto{
  -webkit-mask:radial-gradient(circle at 0 50%,#0000 .75rem,#000 calc(.75rem + .5px)) left/51% 100% no-repeat,radial-gradient(circle at 100% 50%,#0000 .75rem,#000 calc(.75rem + .5px)) right/51% 100% no-repeat;
  mask:radial-gradient(circle at 0 50%,#0000 .75rem,#000 calc(.75rem + .5px)) left/51% 100% no-repeat,radial-gradient(circle at 100% 50%,#0000 .75rem,#000 calc(.75rem + .5px)) right/51% 100% no-repeat;
}

/* Sello: anillo discontinuo por dentro del círculo. */
.ct-sello{position:relative;isolation:isolate}
.ct-sello::before{content:"";position:absolute;inset:.3rem;border-radius:50%;border:2px dashed currentColor;opacity:.7;pointer-events:none}

@keyframes ct-cinta{to{transform:translate3d(-50%,0,0)}}
.ct-pista{animation:ct-cinta 40s linear infinite}

.ct-panel{clip-path:inset(0 0 100% 0);visibility:hidden;transition:clip-path 240ms var(--ct-ease),visibility 0s linear 240ms}
.ct-panel[data-abierto]{clip-path:inset(0 0 0 0);visibility:visible;transition:clip-path 240ms var(--ct-ease),visibility 0s}

.ct-pregunta>summary{list-style:none;cursor:pointer}
.ct-pregunta>summary::-webkit-details-marker{display:none}
.ct-mas{transition:transform 200ms var(--ct-ease)}
.ct-pregunta[open] .ct-mas{transform:rotate(45deg)}

@media (prefers-reduced-motion:reduce){
  .ct-pista{animation:none}
  .ct-boton,.ct-panel,.ct-panel[data-abierto],.ct-mas{transition:none}
  .ct-boton:active{transform:none}
}
`;
