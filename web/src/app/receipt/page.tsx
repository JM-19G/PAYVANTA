import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { ReceiptView } from "@/components/receipt-view";

export const metadata = { title: "Receipt | Payvanta" };

export default function ReceiptPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-xl px-6 py-8">
        <Suspense
          fallback={
            <div className="rounded-2xl border border-border bg-surface p-6 text-muted">
              Loading receipt...
            </div>
          }
        >
          <ReceiptView />
        </Suspense>
      </main>
    </div>
  );
}
