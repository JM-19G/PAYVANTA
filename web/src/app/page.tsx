import { PolicyOverview } from "@/components/policy-overview";
import { SiteHeader } from "@/components/site-header";

const EXPLORER_TX =
  "https://explorer-test.qday.info/tx/0xa172e9ec6b34294f8c446361debe4bc3576228d92d4f036401294b7cd37d9e61";

type Activity = {
  id: string;
  payee: string;
  amount: string;
  status: "Paid" | "Blocked";
  note: string;
  href?: string;
};

const activity: Activity[] = [
  { id: "invoice-001", payee: "Acme Ltd", amount: "1.00", status: "Paid", note: "Paid by agent", href: EXPLORER_TX },
  { id: "invoice-003", payee: "Unregistered address", amount: "0.50", status: "Blocked", note: "Payee name mismatch" },
  { id: "invoice-002", payee: "Acme Ltd", amount: "1.50", status: "Blocked", note: "Over the per-payment cap" },
  { id: "invoice-001", payee: "Acme Ltd", amount: "1.00", status: "Blocked", note: "Invoice already paid" },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        <div>
          <h1 className="font-heading text-2xl font-bold">Dashboard</h1>
          <p className="text-muted">Verify. Understand. Pay confidently.</p>
        </div>

        <PolicyOverview />

        <section className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="font-heading text-lg font-bold">Recent activity</h2>
          <ul className="mt-4 divide-y divide-border">
            {activity.map((a, i) => (
              <li key={i} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <p className="font-semibold">{a.id} to {a.payee}</p>
                  <p className="text-sm text-muted">{a.note}</p>
                </div>
                <div className="flex items-center gap-4">
                  {a.href && (
                    <a href={a.href} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">
                      View tx
                    </a>
                  )}
                  <span className="text-sm text-muted">{a.amount} tUSD8</span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      a.status === "Paid" ? "bg-success/15 text-success" : "bg-danger/15 text-danger"
                    }`}
                  >
                    {a.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
