import { GState, jsPDF } from "jspdf";
import { formatPdfMoney, getCurrency } from "./currencies";
import {
  displayDate,
  lineAmount,
  THEMES,
  TOOLS,
  type InvoiceData,
  type Theme,
} from "./model";

const W = 595.28;
const H = 841.89;
const M = 46;

type PdfCtx = {
  doc: jsPDF;
  data: InvoiceData;
  theme: Theme;
  X: number;
  C: number;
};

function newLine(ctx: PdfCtx, y: number, color: string) {
  ctx.doc.setDrawColor(color);
  ctx.doc.setLineWidth(0.75);
  ctx.doc.line(ctx.X, y, W - M, y);
}

export function generateInvoicePdf(data: InvoiceData) {
  const tool = TOOLS.find((t) => t.id === data.tool) ?? TOOLS[0];
  const theme = THEMES.find((t) => t.id === data.theme) ?? THEMES[0];

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const ctx: PdfCtx = {
    doc,
    data,
    theme,
    X: M + (theme.headerMode === "sidebar" ? 22 : 0),
    C: W - M * 2 - (theme.headerMode === "sidebar" ? 22 : 0),
  };

  let y = drawHeader(ctx, tool.title, data.fromName);
  y = drawMetaAndParties(ctx, y, tool.dueLabel, `${tool.prefix}${data.number}`);
  y = drawItems(ctx, y);
  y = drawTotals(ctx, y, tool.hasTax);
  drawNotes(ctx, y);
  drawWatermarks(ctx);

  const filename = `${tool.prefix}${data.number || "001"}`
    .replace(/[^a-zA-Z0-9-]+/g, "-")
    .replace(/^-|-$/g, "");
  doc.save(`${filename}.pdf`);
}

function drawHeader(
  ctx: PdfCtx,
  title: string,
  company: string
): number {
  const { doc, theme, X } = ctx;

  if (theme.headerMode === "band") {
    doc.setFillColor(theme.bandBg);
    doc.rect(0, 0, W, 112, "F");
    doc.setTextColor(theme.onAccent);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(21);
    doc.setCharSpace(1.4);
    doc.text(title, X, 60);
    doc.setCharSpace(0);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(theme.onAccentSoft);
    doc.text(company, X, 82);
    doc.setFillColor(theme.bandRule);
    doc.rect(0, 112, W, 3, "F");
    return 150;
  }

  if (theme.headerMode === "dark") {
    doc.setFillColor(theme.paper);
    doc.rect(0, 0, W, H, "F");
    doc.setFillColor(theme.bandBg);
    doc.rect(0, 0, W, 128, "F");
    doc.setTextColor(theme.accent);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(21);
    doc.setCharSpace(1.4);
    doc.text(title, X, 62);
    doc.setCharSpace(0);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(theme.muted);
    doc.text(company, X, 84);
    doc.setFillColor(theme.bandRule);
    doc.rect(0, 128, W, 2, "F");
    return 158;
  }

  if (theme.headerMode === "sidebar") {
    doc.setFillColor(theme.accent);
    doc.rect(0, 0, 16, H, "F");
    doc.setTextColor(theme.ink);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(21);
    doc.setCharSpace(1.5);
    doc.text(title, X, 74);
    doc.setCharSpace(0);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(theme.muted);
    doc.text(company, X, 94);
    newLine(ctx, 112, theme.rule);
    return 140;
  }

  // minimal
  doc.setTextColor(theme.ink);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setCharSpace(1.4);
  doc.text(title, X, 68);
  doc.setCharSpace(0);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(theme.muted);
  doc.text(company, X, 86);
  newLine(ctx, 100, theme.rule);
  return 122;
}

function partyBlock(
  ctx: PdfCtx,
  x: number,
  width: number,
  label: string,
  name: string,
  email: string,
  phone: string,
  address: string,
  y: number
): number {
  const { doc, theme } = ctx;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setCharSpace(1);
  doc.setTextColor(theme.muted);
  doc.text(label.toUpperCase(), x, y);
  doc.setCharSpace(0);

  let yy = y + 15;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(theme.ink);
  doc.text(name, x, yy);
  yy += 16;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(theme.muted);
  const contact = [email, phone].filter(Boolean);
  for (const c of contact) {
    doc.text(c, x, yy);
    yy += 13;
  }
  if (address.trim()) {
    for (const l of doc.splitTextToSize(address.trim(), width)) {
      doc.text(l, x, yy);
      yy += 13;
    }
  }
  return yy;
}

function drawMetaAndParties(
  ctx: PdfCtx,
  y: number,
  dueLabel: string | undefined,
  docNo: string
): number {
  const { doc, data, theme, X, C } = ctx;

  const colGap = 28;
  const colW = (C - colGap) / 2;
  const billX = X + colW + colGap;

  const fromBottom = partyBlock(
    ctx,
    X,
    colW,
    "From",
    data.fromName,
    data.fromEmail,
    data.fromPhone,
    data.fromAddress,
    y
  );
  const toBottom = partyBlock(
    ctx,
    billX,
    colW,
    "Bill to",
    data.toName,
    data.toEmail,
    data.toPhone,
    data.toAddress,
    y
  );

  let yy = Math.max(fromBottom, toBottom) + 16;
  newLine(ctx, yy, theme.rule);
  yy += 16;

  const metaItems: Array<[string, string]> = [
    ["Document no.", docNo],
    ["Issued", displayDate(data.issueDate)],
  ];
  if (dueLabel && data.dueDate) metaItems.push([dueLabel, displayDate(data.dueDate)]);

  const metaColW = C / metaItems.length;
  metaItems.forEach(([label, value], i) => {
    const mx = X + i * metaColW;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setCharSpace(0.6);
    doc.setTextColor(theme.muted);
    doc.text(label.toUpperCase(), mx, yy);
    doc.setCharSpace(0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(theme.ink);
    doc.text(value, mx, yy + 14);
  });

  yy += 28;
  newLine(ctx, yy, theme.rule);
  return yy + 18;
}

function drawItems(ctx: PdfCtx, y: number): number {
  const { doc, data, theme, X, C } = ctx;

  const descW = C - 230;
  const qtyX = X + C - 200;
  const rateX = X + C - 105;
  const amountX = X + C;

  doc.setFillColor(theme.tableHeadBg);
  doc.rect(X, y, C, 24, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setCharSpace(0.7);
  doc.setTextColor(theme.muted);
  doc.text("DESCRIPTION", X + 10, y + 15);
  doc.text("QTY", qtyX, y + 15, { align: "right" });
  doc.text("RATE", rateX, y + 15, { align: "right" });
  doc.text("AMOUNT", amountX - 8, y + 15, { align: "right" });
  doc.setCharSpace(0);

  let yy = y + 24;
  let row = 0;
  for (const line of data.lines) {
    const descLines = doc.splitTextToSize(line.description || "—", descW - 16);
    const rowH = Math.max(22, descLines.length * 13 + 8);

    if (yy + rowH > H - 90) {
      doc.addPage();
      yy = 40;
    }
    if (row % 2 === 1) {
      doc.setFillColor(theme.tableHeadBg);
      doc.rect(X, yy, C, rowH, "F");
    }
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(theme.ink);
    doc.text(line.description || "—", X + 10, yy + 15);
    doc.setTextColor(theme.muted);
    doc.text(String(parseFloat(line.qty) || 0), qtyX, yy + 15, { align: "right" });
    doc.setTextColor(theme.ink);
    doc.text(formatPdfMoney(parseFloat(line.rate) || 0, getCurrency(data.currency)), rateX, yy + 15, {
      align: "right",
    });
    doc.setFont("helvetica", "bold");
    doc.text(formatPdfMoney(lineAmount(line), getCurrency(data.currency)), amountX - 8, yy + 15, {
      align: "right",
    });
    yy += rowH;
    row += 1;
  }

  newLine(ctx, yy + 2, theme.rule);
  return yy + 18;
}

function drawTotals(ctx: PdfCtx, y: number, hasTax: boolean): number {
  const { doc, data, theme, X, C } = ctx;
  const currency = getCurrency(data.currency);

  const subtotal = data.lines.reduce((s, l) => s + lineAmount(l), 0);
  const pct = parseFloat(data.taxPct) || 0;
  const tax = hasTax ? (subtotal * pct) / 100 : 0;
  const total = subtotal + tax;

  const boxW = 200;
  const boxLeft = X + C - boxW;
  const pad = 10;
  const rowH = 16;
  const headRows = 1 + (hasTax ? 1 : 0);
  const headH = pad + headRows * rowH + 4;
  const totalH = 28;
  const boxH = headH + totalH;

  doc.setFillColor(theme.tableHeadBg);
  doc.roundedRect(boxLeft, y, boxW, boxH, 3, 3, "F");
  doc.setDrawColor(theme.rule);
  doc.setLineWidth(0.75);
  doc.roundedRect(boxLeft, y, boxW, boxH, 3, 3, "S");

  let yy = y + pad + 10;
  const row = (label: string, value: string, muted = true) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(muted ? theme.muted : theme.ink);
    doc.text(label, boxLeft + pad, yy);
    doc.setTextColor(theme.ink);
    doc.text(value, boxLeft + boxW - pad, yy, { align: "right" });
    yy += rowH;
  };

  row("Subtotal", formatPdfMoney(subtotal, currency));
  if (hasTax) row(`Tax (${data.taxPct}%)`, formatPdfMoney(tax, currency));

  const totalTop = y + headH;
  doc.setFillColor(theme.paper);
  doc.rect(boxLeft + 0.5, totalTop, boxW - 1, totalH - 0.5, "F");
  doc.setDrawColor(theme.rule);
  doc.line(boxLeft, totalTop, boxLeft + boxW, totalTop);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(theme.ink);
  doc.text("Total", boxLeft + pad, totalTop + 18);
  doc.text(formatPdfMoney(total, currency), boxLeft + boxW - pad, totalTop + 18, {
    align: "right",
  });

  return y + boxH + 12;
}

function drawNotes(ctx: PdfCtx, y: number) {
  const { doc, data, theme, X, C } = ctx;
  if (!data.notes.trim()) return;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setCharSpace(1);
  doc.setTextColor(theme.muted);
  doc.text("NOTES", X, y);
  doc.setCharSpace(0);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(theme.ink);
  let yy = y + 14;
  for (const l of doc.splitTextToSize(data.notes.trim(), C)) {
    doc.text(l, X, yy);
    yy += 13;
  }
}

function drawWatermarks(ctx: PdfCtx) {
  const { doc, data, theme } = ctx;
  if (!data.watermark) return;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(38);
  const lines = doc.splitTextToSize((data.fromName || "WATERMARK").toUpperCase(), 420).slice(0, 4);

  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    const pageH = doc.internal.pageSize.getHeight();
    doc.saveGraphicsState();
    doc.setGState(new GState({ opacity: 0.06 }));
    doc.setTextColor(theme.ink);
    const cx = W / 2;
    const cy = pageH / 2;
    for (let i = 0; i < lines.length; i++) {
      const w = doc.getTextWidth(lines[i]);
      const pivotX = cx + 22 * i;
      const pivotY = cy - 38.1 * i;
      doc.text(lines[i], pivotX + w / 2, pageH - pivotY, { align: "center", angle: -30 });
    }
    doc.restoreGraphicsState();
  }
}