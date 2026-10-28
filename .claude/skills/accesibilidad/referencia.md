# Referencia de accesibilidad (WCAG 2.2 AA)

## Cifras

| Elemento | AA (obligatorio) | AAA |
|---|---|---|
| Texto normal | 4,5:1 | 7:1 |
| Texto grande (≥ 24 px, o ≥ 19 px negrita) | 3:1 | 4,5:1 |
| Iconos, bordes de campos, gráficos, indicador de foco | 3:1 | 3:1 |
| Enlace sin subrayar frente al texto que lo rodea | 3:1 | — |

La relación va de 1:1 a 21:1. Ejemplos medidos sobre blanco: gris `#767676` = 4,5 (aprueba),
`#999999` = 2,8 (suspende), blanco sobre verde típico = 3,3 (solo texto grande), verde GOV.UK = 6,2.

| Quién | Zona pulsable mínima |
|---|---|
| Apple | 44 × 44 pt |
| Google (Material) | 48 × 48 dp (aunque el icono mida 24) |
| WCAG 2.2 AA (2.5.8) | 24 × 24 px, o separación suficiente |

Texto (British Dyslexia Association, Apple, Google): 16–19 px, interlineado 1,5, alineado a la
izquierda (nunca justificado), destacar con **negrita** (no cursiva, subrayado ni MAYÚSCULAS en bloques).
Zoom: legible al 200 % de texto y a 400 % / 320 px de ancho en una columna (1.4.4, 1.4.10).
Destellos: nunca más de 3 por segundo (2.3.1).

### Fórmula de contraste

```js
const lum = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.substr(i, 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const contraste = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
// Opacidad: mezcla el color con el fondo antes de medir: c = fg·α + bg·(1−α) por canal.
```

## Criterios WCAG 2.2 A/AA que más se incumplen

| Criterio | Qué pide |
|---|---|
| 1.1.1 Contenido no textual | `alt` que describe la información; decorativas `alt=""` |
| 1.2.2 / 1.2.5 Subtítulos, audiodescripción | vídeos con subtítulos revisados + transcripción |
| 1.3.1 Información y relaciones | encabezados, listas, tablas, etiquetas en el HTML, no solo visual |
| 1.3.5 Propósito de los campos | `autocomplete` en nombre, email, teléfono… |
| 1.4.1 Uso del color | el color nunca es la única pista |
| 1.4.3 / 1.4.11 Contraste | 4,5 / 3 texto; 3 para componentes y gráficos |
| 1.4.4 / 1.4.10 Redimensionar, reflujo | 200 % y 320 px sin perder nada |
| 1.4.12 Espaciado de texto | no romper si el usuario aumenta interlineado/espaciado |
| 1.4.13 Contenido al pasar el ratón | tooltips descartables (Esc), que se puedan recorrer y persistentes |
| 2.1.1 / 2.1.2 Teclado, sin trampas | todo con teclado; se puede salir de modales y menús |
| 2.2.1 Tiempo ajustable | sin cuentas atrás, o avisar y ampliar |
| 2.2.2 Pausar | todo lo que se mueve > 5 s se puede pausar |
| 2.4.1 Evitar bloques | enlace «Saltar al contenido principal» |
| 2.4.2 Título de página | `<title>` único por página |
| 2.4.3 Orden del foco | lógico, igual al visual |
| 2.4.4 Propósito de enlaces | nada de «pulsa aquí» |
| 2.4.6 Encabezados y etiquetas | descriptivos |
| 2.4.7 / 2.4.11 Foco visible / no tapado | se ve siempre; ni cabeceras fijas ni banners lo tapan |
| 2.5.7 Arrastrar | toda acción de arrastre tiene alternativa con un botón |
| 2.5.8 Tamaño del objetivo | ≥ 24 × 24 px |
| 3.1.1 Idioma | `<html lang="es">` |
| 3.2.6 Ayuda consistente | la ayuda/contacto siempre en el mismo sitio |
| 3.3.1 / 3.3.3 Errores | identificar el campo y sugerir la corrección |
| 3.3.7 Entrada redundante | no pedir dos veces lo mismo en un proceso |
| 3.3.8 Autenticación accesible | permitir pegar contraseñas y gestores; sin acertijos |
| 4.1.2 Nombre, función, valor | controles nativos o ARIA completo; `aria-expanded`, `aria-pressed`… |
| 4.1.3 Mensajes de estado | avisos en `role="status"` / `aria-live` |

## Por perfil (carteles del Home Office)

**Lector de pantalla** (VoiceOver, TalkBack, NVDA, Narrador). Sí: describir imágenes, transcripciones,
composición lineal y lógica, HTML5 semántico, todo con teclado, enlaces y títulos descriptivos.
No: información solo en imagen/vídeo, contenido desparramado, estructura basada solo en tamaño
y posición, forzar ratón o pantalla táctil, enlaces poco informativos.

**Baja visión.** Sí: buen contraste y tipografía legible, toda la información en la web (no en
descargables), color + forma + texto, composición lineal, botones y avisos en su contexto.
No: contraste pobre, letra pequeña, información escondida en PDFs, solo color, acciones lejos del contexto.

**Daltonismo** (1 de cada 12 hombres, 1 de cada 200 mujeres; rojo-verde lo más común).
Color nunca como única pista; estados con texto o icono; gráficos con etiquetas o texturas;
enlaces subrayados. Evitar como única diferencia: rojo/verde, verde/marrón, azul/morado, verde/azul.
Mejor: azul/naranja, azul/bermellón, negro/amarillo, oscuro/blanco. Paleta segura Okabe-Ito:
`#000000 #E69F00 #56B4E9 #009E73 #F0E442 #0072B2 #D55E00 #CC79A7`.

**Sordera.** Sí: términos sencillos, subtítulos y transcripción, diseño lineal, contenido dividido,
elegir la vía de comunicación (chat, formulario, email). No: modismos, contenido solo en audio,
menús complejos, bloques largos, **teléfono como única vía de contacto**.

**Movilidad reducida** (teclado, pulsador, voz, ratón de cabeza). Sí: acciones grandes, campos
separados, operable solo con teclado o voz, pensar en táctil, atajos. No: exigir precisión,
interacciones apiñadas, mucho desplazamiento de ratón, expiraciones breves, demasiados pasos.

**Cognición, dislexia, TDAH, autismo, ansiedad.** Frases cortas y palabras de uso diario; un paso
cada vez con progreso visible; lo mismo siempre en el mismo sitio; sin distracciones. Dislexia:
imágenes de apoyo, alineado a la izquierda, contenido breve, no exigir ortografía perfecta, no
obligar a recordar de pantallas anteriores. Autismo: colores simples (no brillantes y chillones),
lenguaje literal, botones descriptivos y previsibles. Ansiedad: tiempo suficiente, explicar qué
pasará después, revisar antes de enviar, ayuda fácil de encontrar.

## Patrones de código

```html
<!-- Saltar al contenido: primer elemento del body, visible solo con foco -->
<a href="#contenido" class="saltar">Saltar al contenido principal</a>
<main id="contenido" tabindex="-1">…</main>
```
```css
.saltar { position: absolute; left: 1rem; top: -100%; z-index: 100; }
.saltar:focus { top: 1rem; }

:focus-visible { outline: 3px solid <color con 3:1 sobre todos los fondos>; outline-offset: 3px; }

/* Temas de contraste de Windows: el fondo desaparece, el borde no */
.boton { border: 2px solid transparent; }
@media (forced-colors: active) { .boton { border-color: ButtonText; } }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important;
    transition-duration: .01ms !important; scroll-behavior: auto !important; }
}
```
```html
<button type="button" aria-label="Borrar factura"><svg aria-hidden="true">…</svg></button>

<label for="nif">NIF del cliente (obligatorio)</label>
<input id="nif" required aria-invalid="true" aria-describedby="nif-error" autocomplete="off">
<p id="nif-error">Faltan caracteres: el NIF tiene 9, por ejemplo 12345678Z</p>

<table><caption>Facturas</caption><tr><th scope="col">Importe</th>…</tr></table>

<p role="status" aria-live="polite">Factura guardada</p>
```

- Si el botón ya tiene texto visible, no lleva `aria-label` (el texto es su nombre).
- Desactivados: mejor botón activo + mensaje junto a él («Para guardar, falta el NIF del cliente»).
  Si se mantiene `disabled`, que se explique con texto visible.
- Gestos (deslizar, mantener, dos dedos, arrastrar): siempre un botón alternativo.
- Modales: `<dialog>` o `role="dialog" aria-modal="true"` + `aria-labelledby`, foco dentro, Esc cierra,
  el foco vuelve al disparador.
- Menús desplegables / acordeones: `<button aria-expanded aria-controls>`; Esc cierra.
- Pestañas / controles segmentados: `aria-pressed` o `role="tablist"` con `aria-selected`.
- Gráficos (canvas/SVG): `role="img"` + `aria-label` con los datos clave, o tabla alternativa.
- Lienzos decorativos y animaciones de fondo: `aria-hidden="true"`, y quietos con reduced-motion.
- Fechas, horas y cifras: escribirlas de forma que se lean bien («20 minutos», no «20'»).

### Lenguaje claro

| Mal | Bien |
|---|---|
| Se ha producido un error en la validación de los datos introducidos. | Falta el NIF del cliente. |
| No se puede completar la operación por restricciones de integridad referencial. | No se puede borrar este cliente porque tiene 12 pedidos. |
| Proceda a cumplimentar la totalidad de los campos obligatorios. | Rellena los campos marcados como obligatorios. |
| Su sesión ha caducado por inactividad prolongada. | Has estado 20 minutos sin usar la aplicación. Vuelve a entrar para seguir. |

## Qué buscar en el código

```
outline-none | outline: none | focus:outline-none     → foco eliminado
onClick en div/span/li sin role ni tabIndex            → clicable sin semántica
<button> con solo <svg>/<Icono> y sin aria-label       → botón sin nombre
placeholder= sin <label>                              → campo sin etiqueta
text-*/40..80, opacity-* sobre texto                   → contraste roto por opacidad
<div className="fila"> repetido como tabla             → tabla falsa
disabled= sin texto que explique                       → desactivado mudo
<img sin alt / alt="imagen"                            → alternativa ausente o inútil
animation: … infinite sin prefers-reduced-motion       → movimiento que no se apaga
setTimeout/expira/caduca/countdown                     → límites de tiempo
user-scalable=no | maximum-scale=1                    → zoom bloqueado
uppercase / italic en párrafos                         → legibilidad (dislexia)
tel: como único contacto                              → excluye a personas sordas
drag/onPointerDown/swipe sin botón alternativo        → 2.5.7
```

## Herramientas de comprobación

- **WAVE** (wave.webaim.org o extensión): errores, contraste, avisos sobre la página.
- **Lighthouse** (Chrome DevTools): nota 0–100. Detecta problemas automáticos; no sustituye probar.
- **Simulación**: DevTools › Rendering › *Emulate vision deficiencies* (protanopía, deuteranopía,
  tritanopía, visión borrosa) y *Emulate CSS media feature* `forced-colors` / `prefers-reduced-motion`.
- **Lectores**: VoiceOver Mac (Cmd+F5), VoiceOver iPhone (triple clic lateral), TalkBack Android
  (Ajustes › Accesibilidad), NVDA Windows (gratuito, nvaccess.org), Narrador (Ctrl+Win+Intro).
- **Prueba de la clase**: dar de alta un cliente con los ojos cerrados y el lector encendido, y otra
  vez sin tocar el ratón. Lo que no se pueda hacer así, se arregla.

## Guías oficiales

- Apple HIG › Accessibility — developer.apple.com/design/human-interface-guidelines/accessibility
- Material Design › Accessibility — m3.material.io/foundations
- Microsoft Inclusive Design — inclusive.microsoft.design
- WCAG 2.2 — w3.org/WAI/standards-guidelines/wcag
- Carteles del Home Office — github.com/UKHomeOffice/posters

## Plantilla de declaración de accesibilidad

1. Compromiso: «[Entidad] se compromete a hacer accesible su sitio web conforme a la Ley 11/2023 / RD 1112/2018».
2. Situación de cumplimiento: plenamente / parcialmente conforme con WCAG 2.2 AA (EN 301 549).
3. Contenido no accesible conocido y motivo; alternativas que se ofrecen.
4. Fecha de elaboración y de última revisión, y método (autoevaluación, herramientas usadas).
5. Observaciones y contacto: email y formulario (no solo teléfono), plazo de respuesta.
6. Procedimiento de reclamación si la respuesta no satisface (sector público: unidad responsable;
   privado: autoridad de consumo / vigilancia de mercado).
