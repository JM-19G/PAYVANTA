"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useBlock, useReadContract, useWaitForTransactionReceipt } from "wagmi";
import { formatUnits, parseEventLogs } from "viem";
import {
  ADDRESSES,
  EXPLORER,
  TUSD8_DECIMALS,
  aevum,
  payablesAbi,
  registryAbi,
} from "@/lib/aevum";

const ZERO = "0x0000000000000000000000000000000000000000";
const card = "rounded-2xl border border-border bg-surface p-6";

const shortHash = (v: string) => `${v.slice(0, 10)}...${v.slice(-8)}`;
const shortAddr = (v: string) => `${v.slice(0, 6)}...${v.slice(-4)}`;

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-t border-border py-3 text-sm">
      <span className="text-muted">{label}</span>
      <span className="break-all text-right font-medium">{children}</span>
    </div>
  );
}

function Message({ tone, title, children }: { tone: "danger" | "muted"; title: string; children?: ReactNode }) {
  return (
    <div className={card}>
      <h1 className={`font-heading text-xl font-bold ${tone === "danger" ? "text-danger" : ""}`}>{title}</h1>
      {children && <div className="mt-2 text-sm text-muted">{children}</div>}
      <Link href="/" className="mt-4 inline-block text-sm text-primary hover:underline">
        Back to dashboard
      </Link>
    </div>
  );
}

export function ReceiptView() {
  const params = useSearchParams();
  const tx = params.get("tx") ?? "";
  const validTx = /^0x[0-9a-fA-F]{64}$/.test(tx);
  const hash = (validTx ? tx : undefined) as `0x${string}` | undefined;

  const receipt = useWaitForTransactionReceipt({ hash, chainId: aevum.id });
  const data = receipt.data;

  const block = useBlock({
    blockNumber: data?.blockNumber,
    chainId: aevum.id,
    query: { enabled: Boolean(data) },
  });

  const events = data
    ? parseEventLogs({ abi: payablesAbi, eventName: "InvoicePaid", logs: data.logs }).filter(
        (log) => log.address.toLowerCase() === ADDRESSES.payables.toLowerCase(),
      )
    : [];
  const paidEvent = events[0];

  const payeeAddress = (paidEvent?.args.payee ?? ZERO) as `0x${string}`;
  const payee = useReadContract({
    address: ADDRESSES.registry,
    abi: registryAbi,
    functionName: "getPayee",
    args: [payeeAddress],
    chainId: aevum.id,
    query: { enabled: Boolean(paidEvent) },
  });

  const explorerTx = `${EXPLORER}/tx/${tx}`;

  if (!validTx) {
    return (
      <Message tone="muted" title="No transaction to show">
        Open a receipt from a completed payment, or add a valid transaction hash to the link.
      </Message>
    );
  }

  if (receipt.isError) {
    return (
      <Message tone="danger" title="Transaction not found">
        Aevum has no record of this transaction yet. Wait a moment and reload the page.
      </Message>
    );
  }

  if (!data) {
    return (
      <Message tone="muted" title="Waiting for confirmation">
        Checking the transaction on Aevum...
      </Message>
    );
  }

  if (data.status !== "success") {
    return (
      <Message tone="danger" title="Payment failed">
        This transaction was reverted on Aevum, so no money moved.{" "}
        <a className="text-primary hover:underline" href={explorerTx} target="_blank" rel="noreferrer">
          View on the explorer
        </a>
      </Message>
    );
  }

  if (!paidEvent) {
    return (
      <Message tone="muted" title="Not a Payvanta payment">
        This transaction succeeded, but it did not pay an invoice through the Payvanta contract.{" "}
        <a className="text-primary hover:underline" href={explorerTx} target="_blank" rel="noreferrer">
          View on the explorer
        </a>
      </Message>
    );
  }

  const { amount, owner, payee: payeeAddr, invoiceId, paidByAgent } = paidEvent.args;
  const amountText = Number(formatUnits(amount, TUSD8_DECIMALS)).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });
  const timestamp = block.data
    ? `${new Date(Number(block.data.timestamp) * 1000).toLocaleString("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Africa/Lagos",
      })} WAT`
    : "Loading...";
  const payeeName = payee.data?.[0];

  return (
    <div className={card}>
      <div className="flex flex-col items-center text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success">
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12l5 5L20 7" />
          </svg>
        </div>
        <h1 className="mt-4 font-heading text-2xl font-bold">Payment successful</h1>
        <span className="mt-2 rounded-full bg-success/15 px-3 py-1 text-xs font-semibold text-success">
          Confirmed on Aevum
        </span>
        <p className="mt-4 font-heading text-3xl font-bold">{amountText} tUSD8</p>
      </div>

      <div className="mt-6">
        <Row label="Recipient">
          {payeeName ? `${payeeName} ` : ""}
          <span className="text-muted">({shortAddr(payeeAddr)})</span>
        </Row>
        <Row label="Sent from">{shortAddr(owner)}</Row>
        <Row label="Paid by">{paidByAgent ? "Agent (within policy)" : "Owner (manual approval)"}</Row>
        <Row label="Invoice ID (hash)">{shortHash(invoiceId)}</Row>
        <Row label="Network">QDay Aevum Testnet</Row>
        <Row label="Confirmed">{timestamp}</Row>
        <Row label="Block">{data.blockNumber.toString()}</Row>
        <Row label="Transaction">
          <a className="text-primary hover:underline" href={explorerTx} target="_blank" rel="noreferrer">
            {shortHash(tx)}
          </a>
        </Row>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <a
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-text hover:opacity-90"
          href={explorerTx}
          target="_blank"
          rel="noreferrer"
        >
          View on explorer
        </a>
        <Link className="rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-surface-alt" href="/">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
