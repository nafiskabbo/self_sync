export type ToolId =
  | "invoice"
  | "proforma"
  | "estimate"
  | "receipt"
  | "credit-note";

export type Tool = {
  id: ToolId;
  label: string;
  title: string;
  prefix: string;
  dueLabel?: string;
  hasTax: boolean;
  blurb: string;
};

export const TOOLS: Tool[] = [
  {
    id: "invoice",
    label: "Invoice",
    title: "INVOICE",
    prefix: "INV-",
    dueLabel: "Due date",
    hasTax: true,
    blurb: "Standard invoice for goods or services delivered.",
  },
  {
    id: "proforma",
    label: "Proforma",
    title: "PROFORMA INVOICE",
    prefix: "PF-",
    dueLabel: "Due date",
    hasTax: true,
    blurb: "Advance billing before goods ship or work starts.",
  },
  {
    id: "estimate",
    label: "Estimate",
    title: "ESTIMATE",
    prefix: "EST-",
    dueLabel: "Valid until",
    hasTax: true,
    blurb: "Quote for a proposed project or purchase.",
  },
  {
    id: "receipt",
    label: "Receipt",
    title: "RECEIPT",
    prefix: "RCT-",
    hasTax: false,
    blurb: "Proof of payment already collected.",
  },
  {
    id: "credit-note",
    label: "Credit note",
    title: "CREDIT NOTE",
    prefix: "CN-",
    hasTax: true,
    blurb: "Offset or refund against a previous invoice.",
  },
];

export type HeaderMode = "minimal" | "band" | "sidebar" | "dark";

/** Only the light/paper theme is shipped in SelfSync. */
export type ThemeId = "paper";

export type Theme = {
  id: ThemeId;
  name: string;
  blurb: string;
  swatch: [string, string];
  headerMode: HeaderMode;
  accent: string;
  onAccent: string;
  onAccentSoft: string;
  paper: string;
  ink: string;
  muted: string;
  rule: string;
  bandBg: string;
  bandRule: string;
  tableHeadBg: string;
};

export const PAPER_THEME: Theme = {
  id: "paper",
  name: "Paper",
  blurb: "Ink on white, hairline rules. Plain and precise.",
  swatch: ["#18181b", "#e4e4e7"],
  headerMode: "minimal",
  accent: "#18181b",
  onAccent: "#ffffff",
  onAccentSoft: "#8b8b93",
  paper: "#ffffff",
  ink: "#18181b",
  muted: "#71717a",
  rule: "#e4e4e7",
  bandBg: "#18181b",
  bandRule: "#18181b",
  tableHeadBg: "#fafafa",
};

export const THEMES: Theme[] = [PAPER_THEME];

export type Line = { description: string; qty: string; rate: string };

export type InvoiceData = {
  tool: ToolId;
  theme: ThemeId;
  watermark: boolean;
  fromName: string;
  fromEmail: string;
  fromPhone: string;
  fromAddress: string;
  toName: string;
  toEmail: string;
  toPhone: string;
  toAddress: string;
  number: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  taxPct: string;
  notes: string;
  lines: Line[];
};

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function todayISO(): string {
  return toISOString(new Date());
}

export function toISOString(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function addDaysISO(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return toISOString(d);
}

export function displayDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function lineAmount(line: Line): number {
  return (parseFloat(line.qty) || 0) * (parseFloat(line.rate) || 0);
}
