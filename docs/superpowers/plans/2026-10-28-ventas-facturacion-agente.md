# Ventas, facturación y agente lector de facturas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add sales (quotations -> orders), customer invoicing with legal numbering, supplier-invoice review, and a Python/LangChain agent that reads supplier invoices into Supabase.

**Architecture:** Supabase holds five new tables with RLS (`es_propietario()`), numbering done in `security definer` SQL functions. The CRM (Next.js 16) gets `/ventas`, an extended `/facturacion`, and `/facturacion/proveedores`, using server actions with the existing `conSesion` pattern. The agent in `agente/` is standalone Python: LangChain `create_agent` + `ChatOpenRouter` with one tool that uploads the file to Storage and inserts the row.

**Tech Stack:** Next.js 16.3 / React 19 / Tailwind 4 / Supabase JS, vitest (new, CRM only), Python 3.14 (`py`), langchain >= 1, langchain-openrouter, supabase-py, python-dotenv, pytest.

**Spec:** `docs/superpowers/specs/2026-10-28-ventas-facturacion-agente-design.md`

## Global Constraints

- Read `node_modules/next/dist/docs/` for any Next API you touch (this Next differs from training data).
- Identifiers, file names, UI copy and comments in Spanish, like the rest of the repo (`CONTEXT.md` §2). Comments explain why, low density. No emoji.
- Only existing visual language: components in `apps/crm/src/components` (`Encabezado`, `Bloque`, `TarjetaIndicador`, `Pastilla`/`PastillaColor`, `Icono`, `graficos.tsx`), CSS tokens from `globals.css`. State colours go in `packages/compartido/src/config/estudio.ts` next to `estadosCita`, reusing its hex values (`#ffa814`, `#2a76ff`, `#12b955`, `#f0362b`, `#8a8a8a`).
- Every server action starts with the session check (`conSesion()` in `apps/crm/src/app/acciones.ts`) and returns `{ ok: false, mensaje }` with readable Spanish text on failure.
- Money: `numeric(12,2)` in SQL; rounding to cents in TS with `Math.round(x * 100) / 100`. VAT rates allowed: 0, 4, 10, 21 (default 21).
- Never read or print `.env*` files. The Supabase service-role key only lives in `agente/.env` (gitignored) and never in the CRM.
- Commits: Conventional Commits in English, e.g. `feat(ventas): ...`, ending with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Verification commands from repo root: `npm run lint`, `npm run build --workspace=crm`, `npm test --workspace=crm`; agent: `cd agente && py -m pytest -q`.

## Review Focus

1. Issuing two invoices at once (double click, two tabs) must never produce duplicated or skipped numbers -> Task 1 SQL test: calling `facturar_venta` twice on the same sale fails the second time and the counter advances by one.
2. A sale without lines, or with zero total, must not be invoiceable -> Task 1 (`facturar_venta` raises) and Task 3 (confirm button disabled + action check).
3. The same supplier invoice dropped twice in the folder must not create two rows -> Task 5 test: duplicate insert (unique `nif, numero`) moves the file to `errores/` with reason "duplicada".
4. Claude returning amounts that do not add up (base + iva != total) or an invented/empty number -> Task 5 test: the tool rejects it and nothing is inserted.
5. A photo (`.jpg/.png/.webp`) and a PDF both work; any other extension is ignored, not crashed on -> Task 5 test on `construir_mensaje`.

---

### Task 1: Database schema, RLS, numbering and revert script

**Files:**
- Create: `supabase/migrations/20261028120000_modulo_ventas_facturacion.sql`
- Create: `supabase/revertir/20261028120000_modulo_ventas_facturacion.sql`
- Modify: `packages/compartido/src/tipos.ts` (types), `packages/compartido/src/config/estudio.ts` (states)

**Interfaces (produces):**
- Tables exactly as in the spec "Data model", plus `series (clave text primary key, ultimo int not null)` where `clave` is e.g. `'P-2026'`, `'F-2026'`.
- `public.siguiente_numero(prefijo text) returns text` -> `'F-2026-0001'` (4-digit pad, year from `now() at time zone 'Europe/Madrid'`), `insert ... on conflict do update set ultimo = ultimo + 1 returning`.
- Trigger on `ventas` before insert sets `numero := siguiente_numero('P')` when null.
- `public.facturar_venta(p_venta uuid) returns uuid` (security definer, `set search_path = public`): requires `es_propietario()`, sale `estado = 'confirmada'`, at least one line and total > 0; `select ... for update` on the sale; inserts `facturas` (numero `siguiente_numero('F')`, `fecha_vencimiento = fecha_emision + 30`, totals computed from lines with discount, rounded per line to cents), copies lines into `lineas_factura` with `importe` (base of the line), sets the sale to `facturada`; returns the invoice id. Error messages in Spanish via `raise exception`.
- `facturas_proveedor.estado` in (`por_revisar`, `validada`, `descartada`) default `por_revisar`; `unique (nif, numero)`.
- Private Storage bucket `facturas-proveedor` (PDF, JPEG, PNG, WEBP; 10 MB) with owner-only read policy, like the `nominas` bucket in `20261002120000_modulo_rrhh.sql`.
- RLS on all new tables: `for all using (es_propietario()) with check (es_propietario())`, except `facturas` and `lineas_factura`: select + update for owner, no insert (only through `facturar_venta`) and no delete.
- TS types in `tipos.ts`: `Venta`, `LineaVenta`, `Factura`, `LineaFactura`, `FacturaProveedor` mirroring columns. In `estudio.ts`: `estadosVenta` (presupuesto `#ffa814`, confirmada `#2a76ff`, facturada `#12b955`, cancelada `#f0362b`), `estadosFactura` (emitida `#2a76ff`, cobrada `#12b955`, anulada `#8a8a8a`), `estadosFacturaProveedor` (por_revisar `#ffa814`, validada `#12b955`, descartada `#8a8a8a`), `tiposIva = [21, 10, 4, 0] as const`, and types `EstadoVenta`, `EstadoFactura`, `EstadoFacturaProveedor`.

- [ ] **Step 1:** Write the migration (header comment in the style of the RRHH one) and the revert script (drops in reverse order, bucket policies and bucket, functions, `series`).
- [ ] **Step 2:** Add types and states; `npm run build --workspace=crm` passes.
- [ ] **Step 3:** Commit `feat(db): add sales and invoicing schema`. (The controller tests the SQL inside `begin; ... rollback;` on the real project, including Review Focus 1 and 2, before applying it.)

### Task 2: Amount helpers with tests

**Files:**
- Create: `apps/crm/src/lib/importes.ts`, `apps/crm/src/lib/importes.test.ts`
- Modify: `apps/crm/package.json` (add `vitest` dev dependency and `"test": "vitest run"`)

**Interfaces (produces):**
- `type LineaImporte = { cantidad: number; precio_unitario: number; descuento: number; iva: number }`
- `importeLinea(linea: LineaImporte): number` -> base of the line after discount, rounded to cents.
- `totales(lineas: LineaImporte[]): { base: number; cuotaIva: number; total: number; porIva: { iva: number; base: number; cuota: number }[] }` — VAT computed per rate group (like an invoice footer), sorted by rate desc.
- `euros(valor: number): string` — `es-ES` EUR with 2 decimals (existing pages define their own 0-decimal `euros`; leave those alone).

- [ ] **Step 1: Failing tests:** `importeLinea({cantidad: 2, precio_unitario: 85, descuento: 10, iva: 21}) === 153`; `totales` for `[{1, 100, 0, 21}, {1, 50, 0, 10}]` -> `{ base: 150, cuotaIva: 26, total: 176, porIva: [{iva:21, base:100, cuota:21}, {iva:10, base:50, cuota:5}] }`; `totales([])` -> all zero; rounding: `importeLinea({cantidad: 3, precio_unitario: 0.1, descuento: 0, iva: 21}) === 0.3`.
- [ ] **Step 2:** `npm test --workspace=crm` fails; implement; passes.
- [ ] **Step 3:** Commit `feat(crm): add invoice amount helpers`.

### Task 3: Ventas in the CRM

**Files:**
- Create: `apps/crm/src/app/(privado)/ventas/page.tsx` (list + filter `?estado=`), `ventas/nueva/page.tsx`, `ventas/[id]/page.tsx`, `apps/crm/src/app/acciones-ventas.ts`, `apps/crm/src/components/EditorVenta.tsx` (client: client select, lines editor with catalogue/service/free line, live totals via `totales`)
- Modify: `apps/crm/src/components/BarraLateral.tsx` (group "Caja": Ventas `/ventas` before Facturación), `Icono.tsx` if a new icon is needed, `apps/crm/src/app/(privado)/clientes/[id]/page.tsx` (link "Nuevo presupuesto" -> `/ventas/nueva?cliente=<id>`)

**Interfaces:**
- Consumes: Task 1 tables/types/states, Task 2 `totales`, `importeLinea`, `euros`.
- Produces (in `acciones-ventas.ts`, all `"use server"`):
  - `guardarVenta(datos: { id?: string; cliente_id: string; cita_id: string | null; valida_hasta: string | null; notas: string | null; lineas: Omit<LineaVenta, "id" | "venta_id">[] }): Promise<{ ok: true; id: string } | { ok: false; mensaje: string }>` — only while `presupuesto`; replaces lines.
  - `cambiarEstadoVenta(id: string, estado: "confirmada" | "cancelada" | "presupuesto")` — confirm requires >= 1 line and total > 0.
  - `facturarVenta(id: string)` -> calls RPC `facturar_venta`, `revalidatePath` for `/ventas` and `/facturacion`, returns `{ ok: true, facturaId }`.
- `/ventas/nueva?cliente=&cita=` pre-fills; with `cita`, the client and (if any) the cita's design as first line at its price.
- Detail page: read-only when not `presupuesto`; buttons by state (Confirmar, Volver a presupuesto, Cancelar, Crear factura -> navigates to `/facturacion/<id>`).

- [ ] **Step 1:** Implement actions and pages; `npm run lint` and `npm run build --workspace=crm` pass.
- [ ] **Step 2:** Commit `feat(ventas): add quotations and sales orders`.

### Task 4: Facturación (customer invoices)

**Files:**
- Modify: `apps/crm/src/app/(privado)/facturacion/page.tsx` (KPIs: facturado, cobrado, pendiente de cobro, gastos validados, resultado; table of invoices; keep the existing chart and `TablaCobros` section)
- Create: `apps/crm/src/app/(privado)/facturacion/[id]/page.tsx` (invoice document: studio data from `estudio`, client, lines, VAT breakdown from `totales`, print button; `@media print` hides sidebar/actions), `apps/crm/src/app/acciones-facturas.ts`

**Interfaces:**
- Consumes: Task 1, Task 2.
- Produces: `marcarFacturaCobrada(id: string, metodo: MetodoPago)` (sets `cobrada`, `fecha_cobro = today`; if `cita_id`, also sets the cita `pagado = true, fecha_cobro, metodo_pago, importe = total`), `anularFactura(id: string, motivo: string)` (motivo required, only from `emitida`).

- [ ] **Step 1:** Implement; lint + build pass.
- [ ] **Step 2:** Commit `feat(facturacion): add customer invoices`.

### Task 5: Agente lector de facturas (Python)

**Files:**
- Create: `agente/agente.py`, `agente/herramientas.py`, `agente/requirements.txt`, `agente/.env.example`, `agente/README.md` (Spanish: what each of the five parts is, install, run, folders), `agente/tests/test_agente.py`, `agente/facturas/{entrada,procesadas,errores}/.gitkeep`
- Modify: `.gitignore` (ignore `agente/facturas/**` except `.gitkeep`, `agente/.venv`, `__pycache__`)

**Interfaces:**
- Env: `OPENROUTER_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, optional `MODELO` (default `anthropic/claude-sonnet-5.5`), `CARPETA_FACTURAS` (default `agente/facturas`).
- `herramientas.py`: `class DatosFactura(BaseModel)` (numero: str min 1, fecha: date, proveedor: str min 1, nif: str | None, base: Decimal, iva: Decimal, total: Decimal; validator `abs(base + iva - total) <= 0.02`); `crear_guardar_factura(supabase, ruta: Path) -> BaseTool` returning a `@tool("guardar_factura", args_schema=DatosFactura, return_direct=True)` that uploads the file to bucket `facturas-proveedor` at `<yyyy>/<uuid>-<name>`, inserts into `facturas_proveedor`, returns `"guardada <id>"`; on unique violation removes the upload and raises `FacturaDuplicada`.
- `agente.py`: `PROMPT_SISTEMA` (the diagram's prompt, verbatim in Spanish), `construir_mensaje(ruta: Path) -> HumanMessage | None` (PDF -> file content block base64; jpg/jpeg/png/webp -> image block; other -> None), `procesar(ruta: Path, modelo, supabase) -> Resultado` (fresh `create_agent(model, tools=[...], system_prompt=PROMPT_SISTEMA)` per file, no checkpointer = no memory; moves file to `procesadas/` or `errores/` and writes `<file>.error.txt` with the reason), `main()` with `--vigilar` (poll every 10 s) and default single pass. Logs one line per file.
- Tests (no network): fake chat model returning a scripted tool call (LangChain `GenericFakeChatModel` or a minimal `BaseChatModel` subclass with `bind_tools`) and a fake supabase client recording calls. Cases: happy path inserts once and moves to `procesadas`; amounts not adding up -> nothing inserted, file in `errores`; duplicate -> `errores` with "duplicada"; `construir_mensaje` for `.pdf`, `.jpg`, `.txt`.

- [ ] **Step 1:** Write failing tests; `py -m pytest -q` fails.
- [ ] **Step 2:** Implement; tests pass in a venv `agente/.venv` (`py -m venv agente/.venv`, install requirements + pytest).
- [ ] **Step 3:** Commit `feat(agente): add supplier invoice reading agent`.

### Task 6: Supplier invoice review in the CRM

**Files:**
- Create: `apps/crm/src/app/(privado)/facturacion/proveedores/page.tsx` (tabs by state, `por_revisar` first), `apps/crm/src/app/facturas-proveedor/[id]/route.ts` (signed URL redirect, same pattern as `nominas/[id]/route.ts`), `apps/crm/src/components/RevisionFacturaProveedor.tsx` (editable fields + Validar / Descartar)
- Modify: `acciones-facturas.ts` (add `revisarFacturaProveedor(id: string, datos: Pick<FacturaProveedor, "numero" | "fecha" | "proveedor" | "nif" | "base" | "iva" | "total">, estado: "validada" | "descartada")`, rejects when base + iva differs from total by more than 0.02), `BarraLateral.tsx` (link "Proveedores" under Caja with counter `porRevisar`), the place where `Contadores` is filled (`apps/crm/src/app/(privado)/layout.tsx`)

- [ ] **Step 1:** Implement; lint + build pass.
- [ ] **Step 2:** Commit `feat(facturacion): review supplier invoices read by the agent`.
