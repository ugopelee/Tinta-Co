# Contexto del trabajo — Tinta&Co

Archivo de arranque. Si empiezas una sesión nueva (o se ha limpiado el
contexto), lee **esto primero**: resume qué es el proyecto, cómo está montado,
qué decisiones ya están tomadas y qué queda pendiente, para no tener que releer
media conversación ni medio repositorio.

Última actualización: 24 de septiembre de 2026.

---

## 1. Qué es

Monorepo con **dos aplicaciones Next.js 16 (App Router, Turbopack, React 19)**
para un estudio de tatuaje ficticio, **Tinta&Co**, sobre **Supabase**.

```
apps/web    → web pública (portada, catálogo flash, reserva, cuenta de cliente). Puerto 3000
apps/crm    → panel privado del estudio (citas, clientes, facturación, cuentas). Puerto 3001
packages/compartido → identidad, tipos, clientes de Supabase, formularios
```

Comandos desde la raíz:

```bash
npm run dev          # web (3000)
npm run dev:crm      # crm (3001)
npm run build        # construye las dos
npm run lint         # eslint en las dos
```

`.claude/launch.json` ya tiene configuradas las dos apps (`tinta-co`,
`tinta-co-crm`) para la vista previa del navegador integrado.

## 2. Reglas del repositorio

- **Esta no es la versión de Next.js conocida**: antes de escribir código hay
  que leer la guía correspondiente en `node_modules/next/dist/docs/`. Lo dice
  `AGENTS.md`, que `next dev` reescribe solo; si aparece como cambio sin
  confirmar, se confirma junto con el trabajo.
- **Todo el código en castellano**: nombres de archivo, componentes, variables,
  props y comentarios. `BarraLateral`, `crearClienteServidor`, `contadores`…
- Los comentarios explican **por qué**, no qué. Densidad baja pero presente.
- `packages/compartido/src/config/estudio.ts` es la **fuente única** de la
  identidad: nombre, textos, paletas (oscura y clara), servicios, estilos,
  estados de cita. Cambiar un color ahí lo cambia en las dos apps.
- **Cache Components está desactivado** (no hay `cacheComponents` en
  `next.config.ts`), así que aplica el modelo de caché anterior:
  `fetch(..., { next: { revalidate: n } })`.
- En el CRM (desde el 01/10/2026): gráficos con **Recharts** y iconos con
  **lucide-react**. `Icono.tsx` conserva los nombres en castellano y mapea a
  lucide; las piezas comunes de los gráficos (ejes, rejilla, tooltip, tramo
  apilado redondeado) viven en `components/graficos.tsx`.

## 3. Estado actual

Commits (rama `master`, la principal para PR es `main`):

```
1da98d8 Rehace la piel del CRM y le añade modo claro
844198d Añade facturación al CRM
b33d631 Rehace el panel del CRM y endurece el inicio de sesión
09cf557 Revive las animaciones al subir y afina portada y servicios
2b4523e Rehace el catálogo como galería y afina la portada
2ac6076 Sube la reserva a la portada y rehace la navegación
e20436c Rediseña la portada y da acceso propio a la web
645052d Separa la web y el CRM en dos aplicaciones desplegables
de89d87 Web y CRM de Tinta&Co sobre Supabase
```

### Datos (Supabase)

Tablas: `perfiles`, `clientes`, `citas`, `actividades`, `disenos`.
Las citas entran **solo desde el formulario público**; en el CRM no se crean,
se gestionan. Cada cita lleva su propio cobro (`importe`, `pagado`,
`fecha_cobro`, `metodo_pago`): la facturación no es una tabla aparte.

Estados de cita, en orden de flujo: `solicitada → confirmada → realizada`, más
`cancelada`. Cada uno con su color validado en `estudio.ts`.

**Oportunidades** (28/09/2026): la tabla sigue llamándose `citas`, pero cada
fila tiene `tipo` = `cita` | `evento` (bodas, fiestas, empresa, festival). Los
eventos llevan `tipo_evento`, `lugar` y `asistentes`. En la web, el formulario
de reserva tiene un selector «Cita en el estudio / Un evento» y la tarjeta
`EnlaceEventos` lo pone en modo evento. En el CRM el tablero es
`/oportunidades` (filtro `?tipo=cita|evento`); `/citas` redirige ahí.

**Propuestas de negocio** (28/09/2026): `tipo` admite además `proveedor`,
`colaboracion` y `otro`, con columna `empresa`. Entran desde la sección
«05 — Colabora» de la portada (`components/Colabora.tsx`, acción
`proponerColaboracion`) y **no crean ficha de cliente**. En `estudio.ts` cada
tipo lleva `familia`: `encargo` (cita, evento) o `propuesta`. El CRM separa
las dos bandejas: encargos en el Kanban y propuestas en
`BandejaPropuestas` (lista con el mensaje a la vista, «Responder» por email
y estados renombrados con `nombresEstadoPropuesta`: Nueva, En conversación,
Acordada, Descartada). Panel, facturación, cobros pendientes y ficha de
cliente filtran con `tiposEncargo`.

**Marca**: `@tinta/compartido/marca` (`Marca`) dibuja el mismo símbolo que
`icon.svg`. Sustituye a la antigua «T» en la barra lateral, el login y la
navegación de la web.

### Acceso

- Email y contraseña con Supabase Auth.
- **Registrarse no da acceso al panel**: el perfil nace sin rol y solo un
  `rol = "propietario"` entra; el resto va a `/sin-acceso`.
- Cada server action comprueba la sesión por su cuenta, sin fiarse del proxy.
- **Google (OAuth) está apagado en el proyecto de Supabase**
  (`/auth/v1/settings` devuelve `"google": false`). El botón ya no se pinta
  cuando el proveedor está apagado (`apps/crm/src/lib/google.ts`). Para
  encenderlo hace falta, fuera del código: credenciales OAuth en Google Cloud,
  pegarlas en Supabase → Authentication → Providers → Google, y añadir
  `http://localhost:3001/auth/callback` (y la URL de producción) como redirect.
  En cuanto esté encendido, el botón vuelve a aparecer solo.

## 4. Lenguaje visual del CRM

Rehecho el 01/10/2026 calcando el estilo de un panel de reservas de
restaurante (captura de referencia), con las funciones de Tinta&Co:

- **Lienzo gris claro (`#efeeeb`) con tarjetas blancas sin borde** y radio
  de `1.25rem`. La barra lateral es otra tarjeta: marca + nombre, botón negro
  grande («Revisar solicitudes»), buscador (Ctrl K), menú agrupado con
  rótulos en versalitas (Caja, Ajustes) y, abajo, la persona con tema y salir.
- **Sin barra superior**: cada vista abre con `Encabezado` (miga gris
  «Resumen · hoy», título grande, controles a la derecha).
- **Negro como color de acción** (activo del menú, botones `.boton`,
  segmento elegido en `.segmentos`) y **lima (`--lima`) como único acento**,
  siempre de relleno con `--sobre-lima` encima (`.chip-lima`). `--acento`
  (rojo) queda solo para errores y avisos.
- Listas en filas grises redondeadas (`.fila`) con insignias blancas
  (`.insignia`), como la lista de llegadas de la referencia. Estados con aro
  hueco de su color (`Pastilla`).
- Tipografía: **Inter** para todo; titulares en 600 con tracking cerrado.
- Claro por defecto; el oscuro sigue disponible. Paletas en `estudio.ts`
  (`panelClaro`, `panelOscuro`), separadas de la paleta de la web.

- Colores de estado vivos (`estadosCita`) y tokens `--verde`, `--amarillo`,
  `--azul` en las paletas del panel; nada de hex sueltos en componentes.
- `/agenda`: calendario mensual de encargos por `fecha_deseada` (sin tabla
  propia), días cerrados rayados según `estudio.contacto.diasAbiertos`, aviso
  si un encargo futuro cae en día cerrado, próximas y sin fecha.
- `/ayuda`: guía rápida, preguntas frecuentes, contacto de soporte
  (`estudio.soporte`), estado real de los servicios y atajos de teclado.
- `/catalogo`: gestión de la tabla `disenos` (publicar/retirar con
  interruptor optimista, editar, crear —nace retirado— y borrar en dos pasos
  solo si no tiene reservas). Las imágenes se piden a la web
  (`NEXT_PUBLIC_URL_WEB` + `/flash/…`) sobre baldosa negra, porque los
  dibujos son trazo hueso para fondo oscuro.
- Logotipo del CRM: `public/logo.png` (máquinas cruzadas) vía
  `components/Logo.tsx`; favicon `app/icon.png` generado con sharp.
- Fotos reales del catálogo (01/10/2026): 13 fotos de Unsplash (licencia
  Unsplash, uso libre) en `apps/web/public/fotos/flash/*.webp`;
  `disenos.imagen_url` apunta ahí. Sustituyen a unas de Flickr que eran de
  aficionado. Créditos en `apps/web/public/fotos/flash/CREDITOS.md` y en
  Ayuda y soporte (`apps/crm/src/lib/creditos.ts`).
- `/informes`: trimestre natural (`lib/trimestres.ts`, `?t=2026-T3`):
  cobrado con variación, cobros, ticket medio, clientes, rosco por método,
  barras por estilo, mes a mes, mejores clientes y flash más pedidos.
  `/informes/exportar` descarga el CSV de cobros para la gestoría («;»,
  coma decimal, BOM, celdas escapadas contra inyección de fórmulas) y
  comprueba sesión y rol.
- Ojo con los puertos: en esta máquina el 3000 lo ocupa otro proyecto
  (Mesaria). La web de Tinta&Co se ha estado lanzando en el 3002 y
  `apps/crm/.env.local` tiene `NEXT_PUBLIC_URL_WEB=http://localhost:3002`
  (antes 3000). Si la web vuelve al 3000, hay que devolverlo.
- Consentimientos (01/10/2026): tabla `consentimientos` (migración
  `crear_consentimientos`, RLS solo `es_propietario()`: son datos de
  salud). Una fila por firma, nunca se edita ni se borra desde el panel; la
  más reciente manda. Vigencia 12 meses y aviso a 30 días
  (`lib/consentimientos.ts`). Se ve en `/consentimientos`, en la ficha del
  cliente (resumen de salud + alta), como aviso alto en el Resumen y como
  «Sin firma» en Próximas de la Agenda.
- Apartados propuestos y aún no hechos: plantillas de respuesta y
  horarios/disponibilidad.

### Piezas del panel (`apps/crm/src/app/(privado)/page.tsx`)

| Componente | Qué hace |
|---|---|
| `TarjetaProximaCita` | Cita destacada con banda de marca, estado, progreso del flujo y tres datos |
| `Cartera` | Indicadores con selector de periodo (hoy / 7 / 30 días) y embudo de estados |
| `PanelAtencion` | Tarjeta invertida con lo que necesita decisión, calculado de los datos |
| `Medidor` | Media luna (Recharts) con el porcentaje de citas realizadas ya cobradas |
| `Bloque` | Caja genérica reutilizada por todas las vistas |

Los avisos del panel salen de reglas reales, no de estimaciones: solicitudes
con más de 3 días sin respuesta, citas confirmadas cuya fecha ya pasó, citas
realizadas sin cobrar y citas confirmadas sin fecha.

## 4 bis. Portada de la web (`apps/web`)

Rehecha el 24/09/2026 (segunda versión) en estilo **minimalista**, en la línea
del portfolio `PortFolio_UgoPeleato`: Inter en peso normal, una palabra en
Instrument Serif cursiva por titular, mucho aire, píldora de cristal centrada
como navegación. Referencia de animación: vídeo *cube-motion* (un único
sistema de puntos que se transforma).

**Un solo lienzo fijo** (`components/puntos/LienzoPuntos.tsx`) detrás de toda
la página. Cada sección declara `data-forma` (qué forma) y `data-lado`
(`derecha`, `arriba`, `fondo`); el lienzo lee la sección que cruza el centro
de la pantalla y lleva los mismos puntos de una forma a otra, deslizándose
entre posiciones.

| Sección | `data-forma` | Forma |
|---|---|---|
| `#inicio` | `esfera` | Esfera de Fibonacci con núcleo sólido |
| `#estudio` | `texto:12` | «12» en serif hecho de puntos (espera a `document.fonts.ready`) |
| `#servicios` | `servicio-0..3` | Sol 3D, doble hélice, aro de piercing, corazón abombado |
| `#catalogo` | `diseno:<imagen_url>` | La pieza flash señalada, muestreada del SVG |
| `#reserva`, pie | `onda` | Malla de puntos ondulante vista desde arriba |

- `puntos/formas.ts`: generadores (siempre `n` puntos 3D en la esfera unidad).
  `puntos/nucleo.ts`: DPR, pausa con la pestaña oculta, movimiento reducido
  (un fotograma, se repinta al hacer scroll), puntero y ruido.
- Añadir una forma: crear el generador en `formas.ts` y registrarlo en
  `obtener()` de `LienzoPuntos`.
- Servicios y catálogo avanzan solos (5 s / 4,5 s) y se detienen con el
  puntero encima. Tocar una pieza del catálogo la preselecciona en el
  formulario (`lib/eventos.ts` → `#formulario-reserva`).
- Componentes: `Navegacion` (scroll-spy con fondo deslizante; en móvil abajo
  y sin «Estudio»), `Encabezado` (cabecera común de sección), `detalles.tsx`
  (`PalabraRotatoria`, `EnlaceMagnetico`, `HoraMadrid`), `Servicios`,
  `Catalogo`.
- Trampa conocida: un `filter` o `backdrop-filter` en un padre rompe cosas en
  hijos (`Revelar` termina en `filter: none` para no anular el cristal).

## 5. Pendiente

- [ ] **Encender Google en Supabase** (paso manual, ver §3). El código ya está
      listo a los dos lados.
- [ ] La web pública (`apps/web`) tiene el mismo botón de Google sin la
      comprobación de disponibilidad: si se quiere, se aplica el mismo helper.
- [ ] **Portfolios** (trabajo aparte, todavía sin empezar): `.claude/launch.json`
      ya reserva `portfolios/server.mjs` para `ugo-peleato` (4010) y
      `diego-sarabia` (4020), pero la carpeta `portfolios/` no existe.
      Requisitos acordados: portfolio completo hecho con un framework
      (Vue / React / Angular…), **nunca Bootstrap**, **solo front** (sin
      backend), **sin plantillas descargadas**, con las **animaciones
      documentadas** indicando qué librería o técnica se ha usado en cada una,
      y documentando el **proceso de investigación de diseño** (UI/UX).
