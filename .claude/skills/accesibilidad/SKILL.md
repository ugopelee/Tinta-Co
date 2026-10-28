---
name: accesibilidad
description: Audita y corrige la accesibilidad de una web o app para cumplir la normativa española y europea (RD 1112/2018, Ley 11/2023 / Directiva europea de accesibilidad, EN 301 549 → WCAG 2.1 AA; se diseña para WCAG 2.2 AA). Cubre color y contraste, daltonismo, botones, foco, teclado, lector de pantalla, formularios, tablas, texto, lenguaje claro, vídeo, animaciones, declaración de accesibilidad y checklist de la práctica de Desarrollo de Interfaces (2.º DAM). Solo se usa cuando el usuario la invoca con /accesibilidad.
disable-model-invocation: true
argument-hint: "[ruta, app o página a revisar — vacío = todo el proyecto]"
---

# Accesibilidad: cumplir la ley y WCAG 2.2 AA

Basada en «Interfaces accesibles para todas las personas» (Desarrollo de Interfaces,
Salesianos Zaragoza, 2.º DAM 2026/27) y en las guías de Apple, Google, Microsoft,
W3C y los carteles del Home Office británico.

El objetivo es siempre **nivel AA de WCAG 2.2**: cubre lo que piden todas las normas
de abajo. Los valores concretos, ejemplos de código y la tabla de criterios están en
[referencia.md](referencia.md). Léela antes de corregir nada.

## Marco legal (para explicarlo y para la declaración)

| Norma | A quién obliga | Desde |
|---|---|---|
| Real Decreto 1112/2018 | webs y apps del sector público | 2018 |
| Ley 11/2023 (aplica la Directiva europea de accesibilidad, EAA) | comercio electrónico, banca, transporte y otros servicios privados, **salvo microempresas** (< 10 personas y ≤ 2 M€) | 28-06-2025 |
| EN 301 549 | norma técnica: remite a WCAG 2.1 AA | referencia |

- WCAG 2.2 (2023) es la versión vigente; AA es el nivel exigido. A = mínimo, AAA = casos concretos.
- La EAA pide además **informar de cómo el servicio cumple la accesibilidad** (en la web o en las condiciones). En la práctica: una página «Declaración de accesibilidad» enlazada desde el pie, con nivel de conformidad, partes no accesibles conocidas, fecha de revisión y una vía de contacto que **no sea solo el teléfono**.
- No es asesoría jurídica: si es para un cliente real, que lo confirme un profesional.

## Cómo trabajar cuando se invoca

1. **Alcance.** Si `$ARGUMENTS` nombra una ruta/app, limítate a eso; si no, todo el proyecto.
   Localiza tokens de color, CSS global, layouts raíz y componentes reutilizables: arreglar
   ahí arregla todo.
2. **Auditoría automática.** Con los servidores en marcha, ejecuta
   [scripts/auditar.mjs](scripts/auditar.mjs) (axe-core con etiquetas WCAG 2.0/2.1/2.2 A-AA
   + comprobaciones propias: zoom bloqueado, `lang`, enlace de salto, `<main>`, `<h1>`,
   objetivos < 24 px, clicables sin semántica, foco sin estilo). Instrucciones de uso en la
   cabecera del script. Instálalo en el scratchpad, nunca en el proyecto. Para páginas tras
   login, pide credenciales al usuario (variables `LOGIN_*`), no crees usuarios en su base de datos.
   Pásalo al menos a 1280 y a 320 px (`ANCHO=320`), en claro y oscuro (`TEMA=oscuro`) si hay
   dos temas, y con `FORZADO=1 CAPTURA=…` para mirar la captura en contraste forzado.
   Falsos positivos habituales: elementos a mitad de un fundido ligado al scroll (opacidad
   parcial), contraste bajo `FORZADO`, campos `sr-only` de 1×1 px, el overlay `nextjs-portal`
   y los avisos `label-has-for` de jsx-a11y con etiquetas anidadas (son válidas).
   Complementa con `eslint-plugin-jsx-a11y` en modo `strict` si el proyecto lo tiene instalado
   (`--rule` con todas sus reglas y `-f json`).
3. **Auditoría manual en el código.** Lo automático detecta solo una parte. Recorre la
   [checklist](#checklist-de-la-práctica) y busca en el código los patrones de
   referencia.md («Qué buscar en el código»): opacidades sobre texto, `outline: none`,
   `div onClick`, botones solo con icono, `placeholder` como etiqueta, tablas con `div`,
   estados solo por color, `disabled` sin explicación, gestos sin alternativa, límites de
   tiempo, animaciones infinitas sin `prefers-reduced-motion`, textos en MAYÚSCULAS/cursiva largos,
   mensajes de error técnicos.
4. **Calcula los contrastes**, no los estimes: fórmula WCAG (en referencia.md), contando
   las mezclas con opacidad sobre el fondo real. Corrige el token, no cada uso.
5. **Corrige** respetando el estilo del proyecto (nombres, idioma de los comentarios,
   Tailwind/CSS existente). Preferencias: HTML nativo antes que ARIA; un arreglo en el
   componente compartido antes que en cada página; no cambiar la identidad visual más de
   lo necesario (oscurecer/aclarar un tono hasta pasar, no rediseñar).
6. **Verifica**: vuelve a pasar el script, prueba Tab por cada pantalla, zoom al 200 % y
   ancho de 320 px, simulación de daltonismo (DevTools › Rendering › Emulate vision
   deficiencies) y `forced-colors`. Comprueba que compila (`tsc`/lint/build).
7. **Informa** con la checklist marcada: qué se cumplía, qué se ha corregido (archivo:línea),
   qué queda pendiente y por qué (p. ej. requiere contenido del cliente: subtítulos,
   textos alternativos de fotos reales). No digas «cumple AA» si no lo has verificado.

## Principios (POUR)

- **Perceptible**: se puede ver u oír — alternativas de texto, subtítulos, contraste.
- **Operable**: se puede manejar — todo con teclado, tiempo suficiente, sin destellos.
- **Comprensible**: se entiende — lenguaje claro, errores explicados, comportamiento previsible.
- **Robusto**: funciona con cualquier tecnología — HTML correcto y nombres accesibles.

Espectro de personas (Microsoft): permanente / temporal / situacional. Diseñar para
quien no tiene un brazo ayuda a quien lleva un bebé (efecto bordillo).

## Checklist de la práctica

Se revisa en la defensa, un punto por elemento. Cada punto tiene detalle en referencia.md.

**Color**
- [ ] Contraste 4,5:1 texto normal · 3:1 texto grande (24 px o 19 px negrita) · 3:1 iconos, bordes de campos, gráficos y foco
- [ ] Nada se comunica solo con color (estado = color + icono + palabra)
- [ ] Paleta probada con el simulador (protanopía, deuteranopía, tritanopía, borrosa)
- [ ] Enlaces subrayados (o 3:1 con el texto de alrededor + otra pista)
- [ ] Gráficos con etiquetas directas / valores escritos / texturas, no solo leyenda de colores

**Botones**
- [ ] Parecen botones (forma, borde o fondo con 3:1) y siguen siéndolo en `forced-colors`
- [ ] Foco visible en todos los fondos (`:focus-visible`, nunca `outline: none` sin sustituto)
- [ ] 44–48 px de zona pulsable y separados (mínimo legal WCAG 2.2: 24 × 24 px)
- [ ] Con nombre y verbo («Guardar factura», no «OK»); iconos con `aria-label`
- [ ] Botón o enlace correcto: cambia de página → `<a href>`; hace algo → `<button>`
- [ ] Mejor no desactivar: el botón se pulsa y explica qué falta

**Teclado y lector**
- [ ] Todo se puede hacer con teclado, en orden lógico, sin trampas de foco
- [ ] «Saltar al contenido principal» como primer elemento enfocable
- [ ] Títulos `h1`–`h2`–`h3` reales y regiones `header`, `nav`, `main`, `footer`
- [ ] Imágenes con `alt` informativo; decorativas con `alt=""` / `aria-hidden`
- [ ] Campos con `<label>`, obligatorio dicho con palabras, error unido con `aria-describedby`
- [ ] Tablas de datos con `table`, `caption`, `th scope`

**Contenido**
- [ ] Lenguaje claro: qué pasa y qué hacer, sin jerga técnica
- [ ] Texto al 200 % y a 320 px de ancho sin romper ni scroll horizontal; zoom no bloqueado
- [ ] Vídeos con subtítulos y transcripción; avisos visuales, no solo sonidos
- [ ] Animaciones que se apagan (`prefers-reduced-motion`), pausa en carruseles/vídeos, nada que destelle > 3 veces/s
- [ ] Sin límites de tiempo (o avisar y poder ampliar)

**Legal**
- [ ] `<html lang>` correcto
- [ ] Declaración de accesibilidad enlazada desde el pie, con contacto que no sea solo teléfono
