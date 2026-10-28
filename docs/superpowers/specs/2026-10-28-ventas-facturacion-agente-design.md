# Task 3: Sales, invoicing and invoice-reading AI agent

Date: 2026-10-28. Branch: `feature/ventas-facturacion` (worktree `../tinta-co-tarea3`),
based on `respaldo/antes-tarea-3`, which snapshots the working tree as it was before
this task. To go back: `git switch respaldo/antes-tarea-3` (code) and
`supabase/revertir/20261028120000_modulo_ventas_facturacion.sql` (database).

## Intent

Course assignment (Sistemas de Gestión Empresarial): add a **sales module**, an
**invoicing module** and an **AI agent** to the Tinta&Co CRM. The agent is the one
described in the teacher's diagram "Agente lector de facturas": a Python + LangChain
program on a server that picks invoice files (PDF or photo) from folders on disk,
sends each one to Claude through OpenRouter, Claude extracts the data and asks to
call the tool `guardar_factura`, and the agent (never Claude) inserts the row in
Supabase. No memory: each invoice is a fresh conversation. The loop stops right
after the INSERT.

The user handed all decisions to the builder. Reference model: Odoo
(Sales: quotation -> sales order -> invoice; Accounting: customer invoices with
legal correlative numbering, vendor bills that arrive as drafts from AI
digitisation and are validated by a person).

## Goals

1. **Ventas** (Odoo `sale.order`): quotations with lines for a client, optionally
   linked to an existing appointment (`citas`). States: `presupuesto` ->
   `confirmada` -> `facturada`, plus `cancelada`. Lines can come from the flash
   catalogue (`disenos`, with its price), from the studio services
   (`estudio.servicios`) or be free text. Each line: quantity, unit price,
   discount %, VAT % (default 21).
2. **Facturación** (Odoo `account.move`, out_invoice): a confirmed sale becomes an
   invoice with a gapless correlative number per year (`F-2026-0001`), a snapshot
   of lines and totals, due date, and states `emitida` -> `cobrada`, or `anulada`.
   Issued invoices are never deleted or edited (Spanish invoicing rules); they are
   cancelled. Printable invoice view (browser print to PDF, print stylesheet).
   When an invoice linked to a cita is collected, the cita is marked paid too, so
   the existing cobros/charts stay consistent.
3. **Facturas de proveedor** (Odoo vendor bills): table filled by the agent, rows
   arrive as `por_revisar`; in the CRM the owner sees the original file, can fix
   fields, and validates (`validada`) or discards (`descartada`). Duplicates
   (same NIF + number) are rejected by a unique constraint.
4. **Agente** in `agente/` (Python, LangChain, `langchain-openrouter`, model
   `anthropic/claude-sonnet-5.5` configurable by env): mirrors the diagram's five
   parts — Modelo, Prompt del sistema, Herramienta `guardar_factura`, Memoria
   (none), Bucle (stops after the tool, `return_direct`). Reads
   `agente/facturas/entrada/**`, moves each file to `procesadas/` or `errores/`.
   Runs once or in watch mode (`--vigilar`). Uploads the original to the private
   Storage bucket `facturas-proveedor` and inserts the row with the service-role
   key (server-side only, never in the browser).
5. The Facturación page shows the money picture: invoiced, collected, pending,
   validated expenses and result (invoiced - expenses), plus the existing
   collections chart.

## Non-goals

- No real Verifactu/SII submission, no electronic signature of invoices.
- No accounting ledger (journals, chart of accounts), no payment reconciliation.
- No upload of supplier invoices from the CRM: files arrive through the agent's
  folders, as in the diagram.
- No sending invoices by email.

## Anti-goals

- Claude touching the database, or the service-role key reaching the browser or
  the repo.
- Invented data: the prompt forbids it, fields not present stay empty, and the
  tool validates amounts (base + VAT = total within 0.02).
- Breaking existing flows (citas cobro, facturación chart, informes).

## Constraints

- Next.js 16 in this repo differs from training data: read
  `node_modules/next/dist/docs/` before writing Next code.
- Code, file names and comments in Spanish, following the project
  (`CONTEXT.md` section 2). Commits: Conventional Commits.
- Only the project's colours, typography and components (`Bloque`, `Encabezado`,
  `TarjetaIndicador`, `Pastilla`, `Icono`, graficos). State colours live in
  `packages/compartido/src/config/estudio.ts`.
- Every server action checks the session itself (`conSesion` pattern); RLS with
  `es_propietario()` on all new tables.
- Migration in `supabase/migrations/`, tested first inside a transaction with
  ROLLBACK; revert script alongside.

## Data model (decided)

- `ventas`: id, numero (`P-2026-0001`, assigned by trigger), cliente_id,
  cita_id null, estado, fecha, valida_hasta, notas, created_at, updated_at.
- `lineas_venta`: id, venta_id (cascade), orden, descripcion, diseno_id null,
  cantidad > 0, precio_unitario >= 0, descuento 0..100, iva in (0, 4, 10, 21).
- `facturas`: id, numero unique, serie year, venta_id unique, cliente_id, cita_id,
  fecha_emision, fecha_vencimiento, base, cuota_iva, total, estado, fecha_cobro,
  metodo_pago, motivo_anulacion, created_at. No delete policy.
- `lineas_factura`: snapshot copy of the sale lines with computed importe.
- `facturas_proveedor`: id, numero, fecha, proveedor, nif, base, iva, total,
  archivo (storage path), nombre_archivo, estado, revisada_at, created_at;
  unique (nif, numero).
- Numbering through a `series` counter table updated with row lock inside
  `security definer` RPCs: `facturar_venta(venta_id)` (checks owner, state
  `confirmada`, copies lines, computes totals, numbers, marks sale `facturada`).

## Left to the builder

Exact layouts within the existing visual language, test tooling (vitest for pure
TS helpers, pytest for the agent), the sidebar placement (group "Caja").
