// Auditoría WCAG 2.2 AA con axe-core + comprobaciones propias automatizables.
//
// Instalar en un directorio temporal (no en el proyecto) y copiar allí este script:
//   npm init -y && npm i playwright-core axe-core
//   (usa el Chromium de Playwright si está en ~/AppData/Local/ms-playwright; si no,
//    `npx playwright install chromium` o pasa CHROME=<ruta a chrome.exe>)
// Uso: node auditar.mjs <url> [<url>...]
// Variables opcionales: LOGIN_URL, LOGIN_EMAIL, LOGIN_PASSWORD (inicia sesión antes),
// CHROME, ANCHO (por defecto 1280; prueba también 320), TEMA=oscuro, FORZADO=1
// (forced-colors; omite el contraste de axe, revisa la captura), QUIETO=1 (prefers-reduced-motion), SALIDA (ruta de un JSON),
// CAPTURA=<prefijo> (captura de página completa por URL: <prefijo>-0.png…).
import { chromium } from "playwright-core";
import { createRequire } from "node:module";
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import os from "node:os";

const require = createRequire(import.meta.url);
const axeFuente = readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");

function buscarChrome() {
  if (process.env.CHROME) return process.env.CHROME;
  const base = join(os.homedir(), "AppData/Local/ms-playwright");
  if (existsSync(base)) {
    const dir = readdirSync(base).filter((d) => /^chromium-\d+$/.test(d)).sort().pop();
    if (dir) return join(base, dir, "chrome-win64/chrome.exe");
  }
  return undefined; // playwright usará el canal por defecto
}

const urls = process.argv.slice(2);
const navegador = await chromium.launch({ executablePath: buscarChrome() });
const contexto = await navegador.newContext({
  viewport: { width: Number(process.env.ANCHO ?? 1280), height: 900 },
  colorScheme: process.env.TEMA === "oscuro" ? "dark" : "light",
  forcedColors: process.env.FORZADO ? "active" : "none",
  reducedMotion: process.env.QUIETO ? "reduce" : "no-preference",
});
const pagina = await contexto.newPage();

if (process.env.LOGIN_URL) {
  await pagina.goto(process.env.LOGIN_URL, { waitUntil: "networkidle" });
  await pagina.fill('input[type="email"]', process.env.LOGIN_EMAIL);
  await pagina.fill('input[type="password"]', process.env.LOGIN_PASSWORD);
  await Promise.all([pagina.waitForURL((u) => !u.pathname.includes("login"), { timeout: 20000 }), pagina.keyboard.press("Enter")]);
}

const informe = [];
for (const url of urls) {
  await pagina.goto(url, { waitUntil: "networkidle", timeout: 60000 });
  // Recorre la página para que se muestre lo que aparece al hacer scroll
  // (axe no mide el contraste de lo que sigue con opacidad 0).
  await pagina.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 400) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, 0);
  });
  await pagina.waitForTimeout(1200);
  await pagina.addScriptTag({ content: axeFuente });
  const axe = await pagina.evaluate(async () =>
    window.axe.run(document, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"] },
      resultTypes: ["violations"],
    }),
  );

  // Con forced-colors axe mezcla colores del autor y del sistema: el contraste no es fiable.
  if (process.env.FORZADO) axe.violations = axe.violations.filter((v) => v.id !== "color-contrast");
  if (process.env.CAPTURA) await pagina.screenshot({ path: `${process.env.CAPTURA}-${informe.length}.png`, fullPage: true });

  // Comprobaciones que axe no hace o hace a medias.
  const extra = await pagina.evaluate(() => {
    const avisos = [];
    const meta = document.querySelector('meta[name="viewport"]')?.content ?? "";
    if (/user-scalable\s*=\s*(no|0)|maximum-scale\s*=\s*1(\.0)?\b/.test(meta)) avisos.push(`Zoom bloqueado en meta viewport: ${meta}`);
    if (!document.documentElement.lang) avisos.push("<html> sin atributo lang");
    const primerFoco = document.querySelector("a[href], button, input, select, textarea, [tabindex]:not([tabindex='-1'])");
    const saltar = primerFoco && primerFoco.tagName === "A" && (primerFoco.getAttribute("href") ?? "").startsWith("#");
    if (!saltar) avisos.push("El primer elemento enfocable no es un enlace «Saltar al contenido»");
    if (!document.querySelector("main")) avisos.push("Sin región <main>");
    if (!document.querySelector("h1")) avisos.push("Sin <h1>");
    // Reflujo (1.4.10): a 320 px no debe haber scroll horizontal.
    if (document.documentElement.scrollWidth > window.innerWidth + 1)
      avisos.push(`Scroll horizontal: contenido de ${document.documentElement.scrollWidth} px en ${window.innerWidth} px`);
    // Objetivos táctiles por debajo de 24×24 (WCAG 2.5.8).
    const pequenos = [];
    for (const el of document.querySelectorAll("a[href], button, input:not([type=hidden]), select, [role=button]")) {
      const r = el.getBoundingClientRect();
      if (r.width <= 2 || r.height <= 2) continue; // oculto visualmente (sr-only): se pulsa su etiqueta
      if ((r.width < 24 || r.height < 24) && !(el.tagName === "A" && getComputedStyle(el).display === "inline")) {
        pequenos.push(`${el.tagName.toLowerCase()} «${(el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 40)}» ${Math.round(r.width)}×${Math.round(r.height)}`);
      }
    }
    if (pequenos.length) avisos.push(`Objetivos < 24 px (${pequenos.length}): ${pequenos.slice(0, 12).join(" · ")}`);
    // Elementos clicables que no son botón ni enlace.
    const falsos = [...document.querySelectorAll("div[onclick], span[onclick], [class*=cursor-pointer]:not(a):not(button):not(label):not(input):not(select):not(summary)")]
      .filter((el) => !el.getAttribute("role")).slice(0, 8).map((el) => el.outerHTML.slice(0, 90));
    if (falsos.length) avisos.push(`Clicables sin semántica: ${falsos.join(" · ")}`);
    return avisos;
  });

  // Navegación con teclado: ¿se ve el foco en los primeros 15 tabuladores?
  const sinFoco = [];
  await pagina.evaluate(() => document.activeElement?.blur());
  for (let i = 0; i < 15; i++) {
    await pagina.keyboard.press("Tab");
    const r = await pagina.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body || el.tagName === "NEXTJS-PORTAL") return null;
      const cs = getComputedStyle(el);
      const visible = (cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0) || cs.boxShadow !== "none";
      return { visible, quien: `${el.tagName.toLowerCase()} «${(el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 30)}»` };
    });
    if (r && !r.visible) sinFoco.push(r.quien);
  }
  if (sinFoco.length) extra.push(`Foco sin outline/box-shadow visible (puede tener otro estilo, revisar): ${[...new Set(sinFoco)].join(" · ")}`);

  informe.push({ url, axe: axe.violations.map((v) => ({ id: v.id, impacto: v.impact, ayuda: v.help, nodos: v.nodes.map((n) => ({ selector: n.target.join(" "), resumen: n.failureSummary?.split("\n").slice(1, 3).join(" ") })) })), extra });

  console.log(`\n=== ${url}`);
  for (const v of axe.violations) {
    console.log(`  [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length})`);
    for (const n of v.nodes.slice(0, 6)) console.log(`      ${n.target.join(" ")}  ${(n.failureSummary ?? "").split("\n")[1]?.trim() ?? ""}`);
  }
  for (const a of extra) console.log(`  [manual] ${a}`);
  if (!axe.violations.length && !extra.length) console.log("  Sin incidencias automáticas.");
}
if (process.env.SALIDA) writeFileSync(process.env.SALIDA, JSON.stringify(informe, null, 2));
await navegador.close();
