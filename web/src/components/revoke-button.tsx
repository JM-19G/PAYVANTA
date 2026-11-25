"use client";

import { useEffect, useRef, useState } from "react";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { ADDRESSES, EXPLORER, aevum, payablesAbi } from "@/lib/aevum";

const base = "rounded-lg border px-4 py-2 text-sm font-semibold";

export function RevokeButton({ onRevoked }: { onRevoked?: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash, chainId: aevum.id });
  const callback = useRef(onRevoked);

  useEffect(() => {
    callback.current = onRevoked;
  });

  const confirmed = receipt.data?.status === "success";
  const failed = receipt.isError || receipt.data?.status === "reverted";

  useEffect(() => {
    if (confirmed) callback.current?.();
  }, [confirmed]);

  const send = () => {
    setConfirming(false);
    writeContract({
      address: ADDRESSES.payables,
      abi: payablesAbi,
      functionName: "revokeAgent",
      chainId: aevum.id,
    });
  };

  if (confirmed && hash) {
    return (
      <a
        className="text-sm text-success hover:underline"
        href={`${EXPLORER}/tx/${hash}`}
        target="_blank"
        rel="noreferrer"
      >
        Agent revoked. View tx
      </a>
    );
  }

  if (isPending) return <span className="text-sm text-muted">Confirm in your wallet...</span>;
  if (hash && !failed) return <span className="text-sm text-muted">Revoking on Aevum...</span>;

  if (confirming) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted">Revoke access now?</span>
        <button className={`${base} border-danger bg-danger text-primary-text hover:opacity-90`} onClick={send}>
          Yes, revoke
        </button>
        <button className={`${base} border-border text-muted hover:bg-surface-alt`} onClick={() => setConfirming(false)}>
          Cancel
        </button>
      </div>
    );
  }

  const message = error
    ? ((error as { shortMessage?: string }).shortMessage ?? error.message)
    : failed
      ? "The transaction failed. Try again."
      : null;

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        className={`${base} border-danger text-danger hover:bg-danger/10`}
        onClick={() => {
          reset();
          setConfirming(true);
        }}
      >
        Revoke agent
      </button>
      {message && <p className="max-w-xs text-right text-xs text-danger">{message}</p>}
    </div>
  );
}
