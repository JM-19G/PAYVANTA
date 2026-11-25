"use client";

import { useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { ADDRESSES, TUSD8_DECIMALS, aevum, payablesAbi } from "@/lib/aevum";

const ZERO = "0x0000000000000000000000000000000000000000";

const num = (value: bigint) => Number(formatUnits(value, TUSD8_DECIMALS));
const tusd = (value: bigint) =>
  `${num(value).toLocaleString("en-US", { maximumFractionDigits: 2 })} tUSD8`;

const badge = {
  Active: "bg-success/15 text-success",
  Revoked: "bg-danger/15 text-danger",
  Expired: "bg-warning/15 text-warning",
} as const;

const card = "rounded-2xl border border-border bg-surface p-6";

export function PolicyOverview() {
  const { address } = useAccount();
  const [now] = useState(() => Math.floor(Date.now() / 1000));
  const day = BigInt(Math.floor(now / 86400));
  const owner = (address ?? ZERO) as `0x${string}`;

  const policy = useReadContract({
    address: ADDRESSES.payables,
    abi: payablesAbi,
    functionName: "policies",
    args: [owner],
    chainId: aevum.id,
    query: { enabled: Boolean(address), refetchInterval: 15_000 },
  });

  const spentToday = useReadContract({
    address: ADDRESSES.payables,
    abi: payablesAbi,
    functionName: "spentOnDay",
    args: [owner, day],
    chainId: aevum.id,
    query: { enabled: Boolean(address), refetchInterval: 15_000 },
  });

  if (!address) {
    return (
      <section className={card}>
        <h2 className="font-heading text-lg font-bold">Agent policy</h2>
        <p className="mt-2 text-muted">Connect your wallet to load your agent policy from Aevum.</p>
      </section>
    );
  }

  if (policy.isLoading || !policy.data) {
    return (
      <section className={card}>
        <h2 className="font-heading text-lg font-bold">Agent policy</h2>
        <p className="mt-2 text-muted">
          {policy.isError ? "Could not read the policy from Aevum. Check your connection and try again." : "Loading your policy from Aevum..."}
        </p>
      </section>
    );
  }

  const [agent, perTxCap, dailyCap, expiry, active] = policy.data;

  if (agent.toLowerCase() === ZERO) {
    return (
      <section className={card}>
        <h2 className="font-heading text-lg font-bold">Agent policy</h2>
        <p className="mt-2 text-muted">No agent policy is set for this wallet yet.</p>
      </section>
    );
  }

  const status = !active ? "Revoked" : BigInt(now) > expiry ? "Expired" : "Active";
  const spent = spentToday.data ?? BigInt(0);
  const pct = dailyCap > BigInt(0) ? Math.min(100, Number((spent * BigInt(100)) / dailyCap)) : 0;
  const expiryDate = new Date(Number(expiry) * 1000).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <section className="grid gap-6 md:grid-cols-3">
      <div className={`${card} md:col-span-2`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="font-heading text-lg font-bold">Agent policy</h2>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge[status]}`}>{status}</span>
          </div>
          <button className="rounded-lg border border-danger px-4 py-2 text-sm font-semibold text-danger hover:bg-danger/10">
            Revoke agent
          </button>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-4">
          <div className="rounded-xl bg-surface-alt p-4">
            <p className="text-sm text-muted">Per payment</p>
            <p className="font-heading text-xl font-bold">{tusd(perTxCap)}</p>
          </div>
          <div className="rounded-xl bg-surface-alt p-4">
            <p className="text-sm text-muted">Daily cap</p>
            <p className="font-heading text-xl font-bold">{tusd(dailyCap)}</p>
          </div>
          <div className="rounded-xl bg-surface-alt p-4">
            <p className="text-sm text-muted">Expires</p>
            <p className="font-heading text-xl font-bold">{expiryDate}</p>
          </div>
        </div>
        <p className="mt-4 text-xs text-muted">Agent wallet: {agent.slice(0, 6)}...{agent.slice(-4)}</p>
      </div>

      <div className={card}>
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
            <p className="font-heading text-xl font-bold">
              {num(spent).toFixed(2)} / {num(dailyCap).toFixed(2)}
            </p>
            <p className="text-sm text-muted">tUSD8</p>
          </div>
        </div>
        <p className="mt-4 text-xs text-muted">Resets daily at 00:00 UTC (1:00 AM WAT).</p>
      </div>
    </section>
  );
}
