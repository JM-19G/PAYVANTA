"use client";

import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { aevum } from "@/lib/aevum";

function short(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

const primaryBtn =
  "rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-text hover:opacity-90 disabled:opacity-60";

export function ConnectButton() {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: switching } = useSwitchChain();

  if (!isConnected || !address) {
    return (
      <button
        className={primaryBtn}
        disabled={isPending || connectors.length === 0}
        onClick={() => connect({ connector: connectors[0] })}
      >
        {isPending ? "Connecting..." : "Connect wallet"}
      </button>
    );
  }

  if (!chain) {
    return (
      <button
        className="rounded-lg border border-warning px-4 py-2 text-sm font-semibold text-warning hover:bg-warning/10 disabled:opacity-60"
        disabled={switching}
        onClick={() => switchChain({ chainId: aevum.id })}
      >
        {switching ? "Switching..." : "Switch to Aevum"}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="rounded-full bg-surface-alt px-3 py-1 text-muted">Aevum testnet</span>
      <span className="rounded-full bg-surface-alt px-3 py-1 text-muted">{short(address)}</span>
      <button
        className="rounded-lg border border-border px-3 py-1 text-muted hover:bg-surface-alt"
        onClick={() => disconnect()}
      >
        Disconnect
      </button>
    </div>
  );
}
