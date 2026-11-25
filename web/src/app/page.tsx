import Image from "next/image";

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
  const spent = 1;
  const cap = 2;
  const pct = Math.round((spent / cap) * 100);

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Image src="/logo.svg" alt="Payvanta logo" width={32} height={32} />
            <span className="font-heading text-lg font-bold">Payvanta</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="rounded-full bg-surface-alt px-3 py-1 text-muted">Aevum testnet</span>
            <span className="rounded-full bg-surface-alt px-3 py-1 text-muted">0x3F72...1a2a</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        <div>
          <h1 className="font-heading text-2xl font-bold">Dashboard</h1>
          <p className="text-muted">Verify. Understand. Pay confidently.</p>
        </div>

        <section className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-surface p-6 md:col-span-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="font-heading text-lg font-bold">Agent policy</h2>
                <span className="rounded-full bg-success/15 px-3 py-1 text-xs font-semibold text-success">Active</span>
              </div>
              <button className="rounded-lg border border-danger px-4 py-2 text-sm font-semibold text-danger hover:bg-danger/10">
                Revoke agent
              </button>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-4">
              <div className="rounded-xl bg-surface-alt p-4">
                <p className="text-sm text-muted">Per payment</p>
                <p className="font-heading text-xl font-bold">1 tUSD8</p>
              </div>
              <div className="rounded-xl bg-surface-alt p-4">
                <p className="text-sm text-muted">Daily cap</p>
                <p className="font-heading text-xl font-bold">2 tUSD8</p>
              </div>
              <div className="rounded-xl bg-surface-alt p-4">
                <p className="text-sm text-muted">Expires</p>
                <p className="font-heading text-xl font-bold">1 Dec 2026</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-6">
            <h2 className="font-heading text-lg font-bold">Today&apos;s spend</h2>
            <div className="mt-4 flex items-center gap-5">
              <div
                className="relative h-24 w-24 shrink-0 rounded-full"
                style={{ background: `conic-gradient(var(--primary) ${pct}%, var(--surface-alt) 0)` }}
              >
                <div className="absolute inset-3 flex items-center justify-center rounded-full bg-surface font-heading text-lg font-bold">
                  {pct}%
                </div>
              </div>
              <div>
                <p className="font-heading text-xl font-bold">{spent.toFixed(2)} / {cap.toFixed(2)}</p>
                <p className="text-sm text-muted">tUSD8</p>
              </div>
            </div>
            <p className="mt-4 text-xs text-muted">Resets daily at 00:00 UTC (1:00 AM WAT).</p>
          </div>
        </section>

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
