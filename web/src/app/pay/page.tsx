import { SiteHeader } from "@/components/site-header";
import { PayInvoiceForm } from "@/components/pay-invoice-form";

export const metadata = { title: "Pay invoice | Payvanta" };

export default function PayPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl space-y-6 px-6 py-8">
        <div>
          <h1 className="font-heading text-2xl font-bold">Pay an invoice</h1>
          <p className="text-muted">
            Payvanta checks the payee on Aevum before any money moves.
          </p>
        </div>
        <PayInvoiceForm />
      </main>
    </div>
  );
}
