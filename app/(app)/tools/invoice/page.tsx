import { InvoiceToolClient } from "@/components/invoice/invoice-tool-client";
import { listInvoiceContacts } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function InvoiceToolPage() {
  const [fromContacts, clientContacts] = await Promise.all([
    listInvoiceContacts("from"),
    listInvoiceContacts("client"),
  ]);

  return (
    <div className="space-y-4 sm:space-y-5">
      <header className="space-y-0.5">
        <h1 className="font-[family-name:var(--font-display)] text-2xl text-[var(--moss-deep)] sm:text-3xl">
          Invoice
        </h1>
        <p className="text-sm text-[var(--muted)]">
          Build invoices, estimates, and receipts — light paper PDF
        </p>
      </header>
      <InvoiceToolClient
        fromContacts={fromContacts}
        clientContacts={clientContacts}
      />
    </div>
  );
}
