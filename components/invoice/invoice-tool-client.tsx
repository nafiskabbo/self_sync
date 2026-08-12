"use client";

import {
  removeInvoiceContact,
  saveInvoiceContact,
} from "@/lib/actions";
import { formatMoney, getCurrency } from "@/lib/invoice/currencies";
import {
  addDaysISO,
  lineAmount,
  todayISO,
  TOOLS,
  type InvoiceData,
  type Line,
  type ToolId,
} from "@/lib/invoice/model";
import { generateInvoicePdf } from "@/lib/invoice/pdf";
import type { InvoiceContact } from "@/lib/types";
import {
  Download,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { InvoicePreview } from "@/components/invoice/preview";
import { CURRENCIES } from "@/lib/invoice/currencies";

const fieldClass =
  "w-full rounded-lg border border-[var(--line)] bg-white/70 px-2.5 py-1.5 text-sm outline-none focus:border-[var(--moss)]";

const DEFAULT_NOTES =
  "Thank you for your business.\nPayment is due within 14 days.";

const CUSTOM = "__custom__";

type PartyFields = {
  name: string;
  email: string;
  phone: string;
  address: string;
};

function emptyParty(): PartyFields {
  return { name: "", email: "", phone: "", address: "" };
}

function contactToParty(c: InvoiceContact): PartyFields {
  return {
    name: c.name,
    email: c.email,
    phone: c.phone,
    address: c.address,
  };
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
      {children}
    </h2>
  );
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="flex items-baseline justify-between gap-2">
        <span className="font-medium text-[var(--ink-soft)]">{label}</span>
        {hint ? (
          <span className="text-xs text-[var(--muted)]">{hint}</span>
        ) : null}
      </span>
      {children}
    </label>
  );
}

export function InvoiceToolClient({
  fromContacts: initialFrom,
  clientContacts: initialClients,
}: {
  fromContacts: InvoiceContact[];
  clientContacts: InvoiceContact[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [fromList, setFromList] = useState(initialFrom);
  const [clientList, setClientList] = useState(initialClients);
  const [status, setStatus] = useState<string | null>(null);

  const [tool, setTool] = useState<ToolId>("invoice");
  const [fromId, setFromId] = useState<string>(
    initialFrom[0]?.id ?? CUSTOM,
  );
  const [clientId, setClientId] = useState<string>(
    initialClients[0]?.id ?? CUSTOM,
  );
  const [from, setFrom] = useState<PartyFields>(() =>
    initialFrom[0] ? contactToParty(initialFrom[0]) : emptyParty(),
  );
  const [to, setTo] = useState<PartyFields>(() =>
    initialClients[0] ? contactToParty(initialClients[0]) : emptyParty(),
  );

  const [number, setNumber] = useState("001");
  const [issueDate, setIssueDate] = useState(todayISO());
  const [dueDate, setDueDate] = useState(() => addDaysISO(todayISO(), 14));
  const [currency, setCurrency] = useState("USD");
  const [taxPct, setTaxPct] = useState("0");
  const [notes, setNotes] = useState(DEFAULT_NOTES);
  const [watermark, setWatermark] = useState(false);
  const [lines, setLines] = useState<Line[]>([
    { description: "Design & development", qty: "1", rate: "100.00" },
  ]);

  const meta = TOOLS.find((t) => t.id === tool) ?? TOOLS[0];
  const currencyObj = getCurrency(currency);
  const subtotal = useMemo(
    () => lines.reduce((sum, l) => sum + lineAmount(l), 0),
    [lines],
  );
  const hasTax = meta.hasTax;
  const tax = hasTax ? (subtotal * (parseFloat(taxPct) || 0)) / 100 : 0;
  const total = subtotal + tax;

  function patchFrom(patch: Partial<PartyFields>) {
    setFromId(CUSTOM);
    setFrom((prev) => ({ ...prev, ...patch }));
  }

  function patchTo(patch: Partial<PartyFields>) {
    setClientId(CUSTOM);
    setTo((prev) => ({ ...prev, ...patch }));
  }

  function selectFrom(id: string) {
    setFromId(id);
    if (id === CUSTOM) return;
    const found = fromList.find((c) => c.id === id);
    if (found) setFrom(contactToParty(found));
  }

  function selectClient(id: string) {
    setClientId(id);
    if (id === CUSTOM) return;
    const found = clientList.find((c) => c.id === id);
    if (found) setTo(contactToParty(found));
  }

  function setLine(i: number, key: keyof Line, value: string) {
    setLines((prev) =>
      prev.map((p, j) => (j === i ? { ...p, [key]: value } : p)),
    );
  }

  function addLine() {
    setLines((p) => [...p, { description: "", qty: "1", rate: "0" }]);
  }

  function removeLine(i: number) {
    setLines((p) => (p.length > 1 ? p.filter((_, j) => j !== i) : p));
  }

  function switchTool(next: ToolId) {
    if (next === tool) return;
    const nextMeta = TOOLS.find((t) => t.id === next);
    if (!nextMeta) return;
    setNumber((n) => {
      const stripped = n.replace(
        new RegExp(
          `^${meta.prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
        ),
        "",
      );
      return nextMeta.prefix + (stripped || "001");
    });
    setTool(next);
  }

  function handleIssueDateChange(iso: string) {
    const unchanged = dueDate === addDaysISO(issueDate, 14);
    setIssueDate(iso);
    if (unchanged && iso) setDueDate(addDaysISO(iso, 14));
  }

  function persistContact(
    kind: "from" | "client",
    party: PartyFields,
    selectedId: string,
  ) {
    if (!party.name.trim()) {
      setStatus("Name is required to save a contact.");
      return;
    }
    setStatus(null);
    startTransition(async () => {
      const existingId = selectedId === CUSTOM ? undefined : selectedId;
      const result = await saveInvoiceContact({
        kind,
        id: existingId,
        ...party,
      });
      if (!result.ok) {
        setStatus(result.error);
        return;
      }
      if (kind === "from") {
        setFromList((prev) => {
          const without = prev.filter((c) => c.id !== result.contact.id);
          return [...without, result.contact].sort((a, b) =>
            a.name.localeCompare(b.name),
          );
        });
        setFromId(result.contact.id);
        setFrom(contactToParty(result.contact));
      } else {
        setClientList((prev) => {
          const without = prev.filter((c) => c.id !== result.contact.id);
          return [...without, result.contact].sort((a, b) =>
            a.name.localeCompare(b.name),
          );
        });
        setClientId(result.contact.id);
        setTo(contactToParty(result.contact));
      }
      setStatus(
        existingId ? "Contact updated." : "Contact saved to your list.",
      );
      router.refresh();
    });
  }

  function deleteContact(kind: "from" | "client", id: string) {
    if (id === CUSTOM) return;
    startTransition(async () => {
      const result = await removeInvoiceContact(id);
      if (!result.ok) {
        setStatus(result.error);
        return;
      }
      if (kind === "from") {
        setFromList((prev) => prev.filter((c) => c.id !== id));
        if (fromId === id) {
          setFromId(CUSTOM);
        }
      } else {
        setClientList((prev) => prev.filter((c) => c.id !== id));
        if (clientId === id) {
          setClientId(CUSTOM);
        }
      }
      setStatus("Contact removed.");
      router.refresh();
    });
  }

  const data: InvoiceData = {
    tool,
    theme: "paper",
    watermark,
    fromName: from.name,
    fromEmail: from.email,
    fromPhone: from.phone,
    fromAddress: from.address,
    toName: to.name,
    toEmail: to.email,
    toPhone: to.phone,
    toAddress: to.address,
    number,
    issueDate,
    dueDate,
    currency,
    taxPct,
    notes,
    lines,
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,380px)]">
      <div className="min-w-0 space-y-4">
        <section className="space-y-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-5">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <SectionLabel>Document type</SectionLabel>
            <p className="max-w-xs text-right text-xs text-[var(--muted)]">
              {meta.blurb}
            </p>
          </div>
          <div
            role="tablist"
            aria-label="Invoice type"
            className="flex flex-wrap gap-1 rounded-xl bg-[var(--paper-2)] p-1"
          >
            {TOOLS.map((t) => {
              const active = t.id === tool;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => switchTool(t.id)}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-white text-[var(--moss-deep)] shadow-sm"
                      : "text-[var(--muted)] hover:text-[var(--ink)]"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
          <div className="border-b border-[var(--line)] px-4 py-3 sm:px-5">
            <SectionLabel>Parties</SectionLabel>
          </div>
          <div className="grid divide-y divide-[var(--line)] sm:grid-cols-2 sm:divide-x sm:divide-y-0">
            <PartyEditor
              title="From"
              listLabel="My from list"
              contacts={fromList}
              selectedId={fromId}
              party={from}
              pending={pending}
              onSelect={selectFrom}
              onPatch={patchFrom}
              onSave={() => persistContact("from", from, fromId)}
              onDelete={() => deleteContact("from", fromId)}
            />
            <PartyEditor
              title="Bill to"
              listLabel="Clients list"
              contacts={clientList}
              selectedId={clientId}
              party={to}
              pending={pending}
              onSelect={selectClient}
              onPatch={patchTo}
              onSave={() => persistContact("client", to, clientId)}
              onDelete={() => deleteContact("client", clientId)}
            />
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-5">
          <SectionLabel>Details</SectionLabel>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Document no.">
              <input
                className={fieldClass}
                value={number}
                onChange={(e) => setNumber(e.target.value)}
              />
            </Field>
            <Field label="Issue date">
              <input
                type="date"
                className={fieldClass}
                value={issueDate}
                onChange={(e) => handleIssueDateChange(e.target.value)}
              />
            </Field>
            {meta.dueLabel ? (
              <Field label={meta.dueLabel}>
                <input
                  type="date"
                  className={fieldClass}
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </Field>
            ) : null}
            <Field label="Currency">
              <select
                className={fieldClass}
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                aria-label="Currency"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} · {c.symbol} {c.name}
                  </option>
                ))}
              </select>
            </Field>
            {hasTax ? (
              <Field label="Tax %" hint="e.g. 7.5">
                <input
                  inputMode="decimal"
                  className={fieldClass}
                  value={taxPct}
                  onChange={(e) => setTaxPct(e.target.value)}
                />
              </Field>
            ) : null}
          </div>
          <Field label="Notes & payment terms">
            <textarea
              rows={2}
              className={fieldClass}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Field>
        </section>

        <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-3 sm:px-5">
            <SectionLabel>Line items</SectionLabel>
            <button
              type="button"
              onClick={addLine}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--line)] bg-white/70 px-3 py-1.5 text-sm text-[var(--ink-soft)] hover:border-[var(--moss)]"
            >
              <Plus size={14} />
              Add line
            </button>
          </div>
          <div className="hidden grid-cols-[minmax(0,1fr)_64px_96px_110px_36px] gap-2 px-4 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)] sm:grid sm:px-5">
            <span>Description</span>
            <span className="text-right">Qty</span>
            <span className="text-right">Rate</span>
            <span className="text-right">Amount</span>
            <span />
          </div>
          <div className="space-y-2 px-4 py-3 sm:px-5">
            {lines.map((line, i) => (
              <div
                key={i}
                className="grid items-center gap-2 sm:grid-cols-[minmax(0,1fr)_64px_96px_110px_36px]"
              >
                <input
                  className={fieldClass}
                  placeholder="Description"
                  value={line.description}
                  onChange={(e) => setLine(i, "description", e.target.value)}
                />
                <input
                  className={`${fieldClass} text-right`}
                  inputMode="decimal"
                  placeholder="Qty"
                  aria-label={`Qty line ${i + 1}`}
                  value={line.qty}
                  onChange={(e) => setLine(i, "qty", e.target.value)}
                />
                <input
                  className={`${fieldClass} text-right`}
                  inputMode="decimal"
                  placeholder="Rate"
                  aria-label={`Rate line ${i + 1}`}
                  value={line.rate}
                  onChange={(e) => setLine(i, "rate", e.target.value)}
                />
                <div className="text-right text-sm font-medium tabular-nums text-[var(--ink)]">
                  {formatMoney(lineAmount(line), currencyObj)}
                </div>
                <button
                  type="button"
                  onClick={() => removeLine(i)}
                  aria-label={`Remove line ${i + 1}`}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--muted)] transition hover:bg-[var(--paper-2)] hover:text-[var(--observe)]"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
          <div className="border-t border-[var(--line)] bg-[var(--paper-2)]/60 px-4 py-4 sm:px-5">
            <div className="ml-auto w-full max-w-[240px] space-y-2 text-sm">
              <div className="flex justify-between text-[var(--muted)]">
                <span>Subtotal</span>
                <span className="tabular-nums text-[var(--ink)]">
                  {formatMoney(subtotal, currencyObj)}
                </span>
              </div>
              {hasTax ? (
                <div className="flex justify-between text-[var(--muted)]">
                  <span>Tax ({taxPct || 0}%)</span>
                  <span className="tabular-nums text-[var(--ink)]">
                    {formatMoney(tax, currencyObj)}
                  </span>
                </div>
              ) : null}
              <div className="flex justify-between border-t border-[var(--line)] pt-2 text-base font-semibold text-[var(--moss-deep)]">
                <span>Total</span>
                <span className="tabular-nums">
                  {formatMoney(total, currencyObj)}
                </span>
              </div>
            </div>
          </div>
        </section>

        {status ? (
          <p className="text-sm text-[var(--muted)]" role="status">
            {status}
          </p>
        ) : null}
      </div>

      <aside className="lg:sticky lg:top-6 lg:self-start">
        <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
          <div className="border-b border-[var(--line)] px-4 py-3">
            <SectionLabel>Preview · Paper</SectionLabel>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Light theme PDF — same layout as download.
            </p>
          </div>
          <div className="bg-[linear-gradient(165deg,#ebe6db_0%,#e7e0d2_100%)] px-3 py-4">
            <InvoicePreview
              data={data}
              totals={{ subtotal, tax, total }}
            />
          </div>
          <div className="space-y-3 border-t border-[var(--line)] px-4 py-4">
            <label className="flex cursor-pointer items-start gap-2.5">
              <input
                type="checkbox"
                checked={watermark}
                onChange={(e) => setWatermark(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-[var(--line)] accent-[var(--moss)]"
              />
              <span className="text-sm text-[var(--ink-soft)]">
                Watermark with business name
              </span>
            </label>
            <button
              type="button"
              onClick={() => generateInvoicePdf(data)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--moss)] px-3 py-2.5 text-sm font-medium text-white transition hover:bg-[var(--moss-deep)]"
            >
              <Download size={16} />
              Download {meta.title.toLowerCase()} PDF
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

function PartyEditor({
  title,
  listLabel,
  contacts,
  selectedId,
  party,
  pending,
  onSelect,
  onPatch,
  onSave,
  onDelete,
}: {
  title: string;
  listLabel: string;
  contacts: InvoiceContact[];
  selectedId: string;
  party: PartyFields;
  pending: boolean;
  onSelect: (id: string) => void;
  onPatch: (patch: Partial<PartyFields>) => void;
  onSave: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="space-y-3 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
          {title}
        </p>
        {selectedId !== CUSTOM ? (
          <button
            type="button"
            disabled={pending}
            onClick={onDelete}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-[var(--muted)] hover:bg-[var(--observe-soft)] hover:text-[var(--observe)] disabled:opacity-50"
            title="Remove from saved list"
          >
            <Trash2 size={12} />
            Remove
          </button>
        ) : null}
      </div>
      <Field label={listLabel}>
        <select
          className={fieldClass}
          value={selectedId}
          onChange={(e) => onSelect(e.target.value)}
        >
          <option value={CUSTOM}>Custom…</option>
          {contacts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Name / business">
        <input
          className={fieldClass}
          value={party.name}
          onChange={(e) => onPatch({ name: e.target.value })}
        />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Email">
          <input
            type="email"
            className={fieldClass}
            value={party.email}
            onChange={(e) => onPatch({ email: e.target.value })}
          />
        </Field>
        <Field label="Phone">
          <input
            className={fieldClass}
            value={party.phone}
            onChange={(e) => onPatch({ phone: e.target.value })}
          />
        </Field>
      </div>
      <Field label="Address">
        <textarea
          rows={3}
          className={fieldClass}
          value={party.address}
          onChange={(e) => onPatch({ address: e.target.value })}
        />
      </Field>
      <button
        type="button"
        disabled={pending || !party.name.trim()}
        onClick={onSave}
        className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--line)] bg-white/70 px-3 py-1.5 text-sm text-[var(--ink-soft)] hover:border-[var(--moss)] disabled:opacity-50"
      >
        <Save size={14} />
        {selectedId === CUSTOM ? "Save to list" : "Update saved"}
      </button>
    </div>
  );
}
