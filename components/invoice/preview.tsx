import type { CSSProperties } from "react";
import { formatMoney, getCurrency } from "@/lib/invoice/currencies";
import {
  displayDate,
  lineAmount,
  PAPER_THEME,
  TOOLS,
  type InvoiceData,
} from "@/lib/invoice/model";

type Totals = { subtotal: number; tax: number; total: number };

function Party({
  label,
  name,
  email,
  phone,
  address,
}: {
  label: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}) {
  return (
    <div className="min-w-0">
      <div className="text-[8px] font-bold uppercase tracking-[0.16em] text-[var(--inv-muted)]">
        {label}
      </div>
      <div className="mt-1.5 text-[12px] font-bold leading-snug text-[var(--inv-ink)]">
        {name}
      </div>
      <div className="mt-1 space-y-0.5 text-[10px] leading-relaxed text-[var(--inv-muted)]">
        {email ? <div className="break-all">{email}</div> : null}
        {phone ? <div>{phone}</div> : null}
        {address ? (
          <div className="whitespace-pre-line break-words">{address}</div>
        ) : null}
      </div>
    </div>
  );
}

function MetaChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[7.5px] font-bold uppercase tracking-[0.14em] text-[var(--inv-muted)]">
        {label}
      </div>
      <div className="mt-1 text-[11px] font-semibold tabular-nums text-[var(--inv-ink)]">
        {value}
      </div>
    </div>
  );
}

export function InvoicePreview({
  data,
  totals,
}: {
  data: InvoiceData;
  totals: Totals;
}) {
  const tool = TOOLS.find((t) => t.id === data.tool) ?? TOOLS[0];
  const theme = PAPER_THEME;
  const currency = getCurrency(data.currency);

  const pageVars = {
    "--inv-accent": theme.accent,
    "--inv-paper": theme.paper,
    "--inv-ink": theme.ink,
    "--inv-muted": theme.muted,
    "--inv-rule": theme.rule,
    "--inv-table-head": theme.tableHeadBg,
  } as CSSProperties;

  return (
    <div
      className="relative mx-auto w-full overflow-hidden rounded-sm bg-[var(--inv-paper)] shadow-[0_1px_2px_rgba(0,0,0,0.06),0_12px_28px_rgba(0,0,0,0.12)] ring-1 ring-black/5"
      style={pageVars}
    >
      {data.watermark ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden"
        >
          <div className="-rotate-30 select-none break-words px-10 text-center text-[32px] font-bold uppercase leading-tight tracking-[0.22em] text-[var(--inv-ink)] opacity-[0.05]">
            {data.fromName || "WATERMARK"}
          </div>
        </div>
      ) : null}
      <div className="relative z-10">
        <div className="px-7 pt-5">
          <div className="text-[20px] font-bold uppercase tracking-[0.16em] text-[var(--inv-ink)]">
            {tool.title}
          </div>
          <div className="mt-1 text-[10px] tracking-wide text-[var(--inv-muted)]">
            {data.fromName}
          </div>
          <div className="mt-3 border-t border-[var(--inv-rule)]" />
        </div>

        <div className="px-7 py-4">
          <div className="grid grid-cols-2 gap-x-8 gap-y-1">
            <Party
              label="From"
              name={data.fromName}
              email={data.fromEmail}
              phone={data.fromPhone}
              address={data.fromAddress}
            />
            <Party
              label="Bill to"
              name={data.toName}
              email={data.toEmail}
              phone={data.toPhone}
              address={data.toAddress}
            />
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3 border-y border-[var(--inv-rule)] py-3">
            <MetaChip
              label="Document no."
              value={`${tool.prefix}${data.number}`}
            />
            <MetaChip label="Issued" value={displayDate(data.issueDate)} />
            {tool.dueLabel && data.dueDate ? (
              <MetaChip
                label={tool.dueLabel}
                value={displayDate(data.dueDate)}
              />
            ) : (
              <div />
            )}
          </div>

          <table className="mt-5 w-full table-fixed border-collapse">
            <thead>
              <tr className="bg-[var(--inv-table-head)]">
                <th className="px-2.5 py-2 text-left text-[8px] font-bold uppercase tracking-[0.14em] text-[var(--inv-muted)]">
                  Description
                </th>
                <th className="w-[44px] px-2 py-2 text-right text-[8px] font-bold uppercase tracking-[0.14em] text-[var(--inv-muted)]">
                  Qty
                </th>
                <th className="w-[72px] px-2 py-2 text-right text-[8px] font-bold uppercase tracking-[0.14em] text-[var(--inv-muted)]">
                  Rate
                </th>
                <th className="w-[80px] px-2.5 py-2 text-right text-[8px] font-bold uppercase tracking-[0.14em] text-[var(--inv-muted)]">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {data.lines.map((line, i) => (
                <tr
                  key={i}
                  className="border-b border-[var(--inv-rule)] odd:bg-[var(--inv-table-head)]/55"
                >
                  <td className="px-2.5 py-2 text-[11px] leading-snug text-[var(--inv-ink)]">
                    {line.description || "—"}
                  </td>
                  <td className="px-2 py-2 text-right text-[11px] tabular-nums text-[var(--inv-muted)]">
                    {parseFloat(line.qty) || 0}
                  </td>
                  <td className="px-2 py-2 text-right text-[11px] tabular-nums text-[var(--inv-ink)]">
                    {formatMoney(parseFloat(line.rate) || 0, currency)}
                  </td>
                  <td className="px-2.5 py-2 text-right text-[11px] font-semibold tabular-nums text-[var(--inv-ink)]">
                    {formatMoney(lineAmount(line), currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 flex justify-end">
            <div className="w-[200px] overflow-hidden rounded-md border border-[var(--inv-rule)] bg-[var(--inv-table-head)]/70">
              <div className="space-y-0 px-3 py-2.5 text-[11px]">
                <div className="flex items-baseline justify-between gap-4 py-1 text-[var(--inv-muted)]">
                  <span>Subtotal</span>
                  <span className="tabular-nums text-[var(--inv-ink)]">
                    {formatMoney(totals.subtotal, currency)}
                  </span>
                </div>
                {tool.hasTax ? (
                  <div className="flex items-baseline justify-between gap-4 py-1 text-[var(--inv-muted)]">
                    <span>Tax ({data.taxPct}%)</span>
                    <span className="tabular-nums text-[var(--inv-ink)]">
                      {formatMoney(totals.tax, currency)}
                    </span>
                  </div>
                ) : null}
              </div>
              <div className="flex items-baseline justify-between gap-4 border-t border-[var(--inv-rule)] bg-[var(--inv-paper)] px-3 py-2.5 text-[13px] font-bold text-[var(--inv-ink)]">
                <span>Total</span>
                <span className="tabular-nums">
                  {formatMoney(totals.total, currency)}
                </span>
              </div>
            </div>
          </div>

          {data.notes.trim() ? (
            <div className="mt-5">
              <div className="text-[8px] font-bold uppercase tracking-[0.16em] text-[var(--inv-muted)]">
                Notes
              </div>
              <p className="mt-1.5 whitespace-pre-line text-[10px] leading-relaxed text-[var(--inv-ink)]">
                {data.notes}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
