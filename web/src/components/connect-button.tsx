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
  const { connect, connectors, isPending, error, reset } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: switching } = useSwitchChain();

  const connector =
    connectors.find((c) => c.id === "io.metamask" || c.name === "MetaMask") ?? connectors[0];

  if (!isConnected || !address) {
    const message = error
      ? ((error as { shortMessage?: string }).shortMessage ?? error.message)
      : !connector
        ? "No wallet detected. Unlock MetaMask, then reload the page."
        : null;

    return (
      <div className="flex flex-col items-end gap-1">
        <button
          className={primaryBtn}
          disabled={isPending || !connector}
          onClick={() => {
            if (!connector) return;
            reset();
            connect({ connector });
          }}
        >
          {isPending ? "Connecting..." : "Connect wallet"}
        </button>
        {message && <p className="max-w-xs text-right text-xs text-danger">{message}</p>}
      </div>
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
