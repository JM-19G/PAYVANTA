"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { formatUnits, isAddress, keccak256, parseUnits, toBytes } from "viem";
import {
  ADDRESSES,
  EXPLORER,
  TUSD8_DECIMALS,
  aevum,
  erc20Abi,
  payablesAbi,
  registryAbi,
} from "@/lib/aevum";
import { useNowSeconds } from "@/lib/use-now";

const ZERO = "0x0000000000000000000000000000000000000000";
const ZERO_HASH = `0x${"0".repeat(64)}` as `0x${string}`;
const ACME = "0x5bA9a835A0a65E550D17241f2c75703f35afB675";

const card = "rounded-2xl border border-border bg-surface p-6";
const input =
  "w-full rounded-lg border border-border bg-surface-alt px-3 py-2 text-sm outline-none focus:border-primary";
const primaryBtn =
  "w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-text hover:opacity-90 disabled:opacity-50";

const tones = {
  success: "border-success/40 bg-success/10 text-success",
  danger: "border-danger/40 bg-danger/10 text-danger",
  warning: "border-warning/40 bg-warning/10 text-warning",
  muted: "border-border bg-surface-alt text-muted",
} as const;

function Notice({ tone, children }: { tone: keyof typeof tones; children: ReactNode }) {
  return <div className={`rounded-lg border px-4 py-3 text-sm ${tones[tone]}`}>{children}</div>;
}

const tusd = (value: bigint) =>
  `${Number(formatUnits(value, TUSD8_DECIMALS)).toLocaleString("en-US", {
    maximumFractionDigits: 2,
  })} tUSD8`;

function parseAmount(value: string): bigint | null {
  const v = value.trim();
  if (!/^\d+(\.\d{1,6})?$/.test(v)) return null;
  const units = parseUnits(v, TUSD8_DECIMALS);
  return units > BigInt(0) ? units : null;
}

const errText = (e: unknown) =>
  (e as { shortMessage?: string })?.shortMessage ?? (e as Error)?.message ?? "Something went wrong.";

export function PayInvoiceForm() {
  const { address } = useAccount();
  const now = useNowSeconds();
  const day = BigInt(Math.floor(now / 86400));

  const [payee, setPayee] = useState("");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [ref, setRef] = useState("");

  const payeeValid = isAddress(payee, { strict: false });
  const amountUnits = parseAmount(amount);
  const trimmedName = name.trim();
  const trimmedRef = ref.trim();
  const invoiceId = trimmedRef ? keccak256(toBytes(trimmedRef)) : undefined;
  const owner = (address ?? ZERO) as `0x${string}`;
  const payeeArg = (payeeValid ? payee : ZERO) as `0x${string}`;

  const confirm = useReadContract({
    address: ADDRESSES.registry,
    abi: registryAbi,
    functionName: "confirmPayee",
    args: [payeeArg, trimmedName],
    chainId: aevum.id,
    query: { enabled: payeeValid && trimmedName.length > 0 },
  });
  const registered = useReadContract({
    address: ADDRESSES.registry,
    abi: registryAbi,
    functionName: "getPayee",
    args: [payeeArg],
    chainId: aevum.id,
    query: { enabled: payeeValid },
  });
  const paid = useReadContract({
    address: ADDRESSES.payables,
    abi: payablesAbi,
    functionName: "invoicePaid",
    args: [invoiceId ?? ZERO_HASH],
    chainId: aevum.id,
    query: { enabled: Boolean(invoiceId) },
  });
  const policy = useReadContract({
    address: ADDRESSES.payables,
    abi: payablesAbi,
    functionName: "policies",
    args: [owner],
    chainId: aevum.id,
    query: { enabled: Boolean(address) },
  });
  const spentToday = useReadContract({
    address: ADDRESSES.payables,
    abi: payablesAbi,
    functionName: "spentOnDay",
    args: [owner, day],
    chainId: aevum.id,
    query: { enabled: Boolean(address) && now > 0 },
  });
  const allowance = useReadContract({
    address: ADDRESSES.tusd8,
    abi: erc20Abi,
    functionName: "allowance",
    args: [owner, ADDRESSES.payables],
    chainId: aevum.id,
    query: { enabled: Boolean(address) },
  });
  const balance = useReadContract({
    address: ADDRESSES.tusd8,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [owner],
    chainId: aevum.id,
    query: { enabled: Boolean(address) },
  });

  const approve = useWriteContract();
  const approveReceipt = useWaitForTransactionReceipt({ hash: approve.data, chainId: aevum.id });
  const pay = useWriteContract();
  const payReceipt = useWaitForTransactionReceipt({ hash: pay.data, chainId: aevum.id });

  const approved = approveReceipt.data?.status === "success";
  const paidOk = payReceipt.data?.status === "success";
  const refetchAllowance = allowance.refetch;
  const refetchBalance = balance.refetch;
  const refetchPaid = paid.refetch;
  const refetchSpent = spentToday.refetch;

  useEffect(() => {
    if (approved) void refetchAllowance();
  }, [approved, refetchAllowance]);

  useEffect(() => {
    if (paidOk) {
      void refetchAllowance();
      void refetchBalance();
      void refetchPaid();
      void refetchSpent();
    }
  }, [paidOk, refetchAllowance, refetchBalance, refetchPaid, refetchSpent]);

  const payeeOk = Boolean(confirm.data && confirm.data[0] && confirm.data[1]);

  let payeeNotice: ReactNode = null;
  if (payeeValid && trimmedName) {
    if (!confirm.data) {
      payeeNotice = <Notice tone="muted">Checking the payee registry on Aevum...</Notice>;
    } else {
      const [nameMatches, verified] = confirm.data;
      const registeredName = registered.data?.[0] ?? "";
      if (nameMatches && verified) {
        payeeNotice = <Notice tone="success">Verified payee: {trimmedName} matches this address.</Notice>;
      } else if (nameMatches) {
        payeeNotice = <Notice tone="warning">The name matches, but this payee has not been verified yet.</Notice>;
      } else if (registeredName) {
        payeeNotice = (
          <Notice tone="danger">
            Name mismatch: this address is registered as &quot;{registeredName}&quot;, not &quot;{trimmedName}&quot;.
          </Notice>
        );
      } else {
        payeeNotice = <Notice tone="danger">This address is not in the payee registry.</Notice>;
      }
    }
  } else if (payee && !payeeValid) {
    payeeNotice = <Notice tone="danger">That is not a valid wallet address.</Notice>;
  }

  let policyNotice: ReactNode = null;
  if (address && now > 0 && amountUnits && policy.data) {
    const [agent, perTxCap, dailyCap, expiry, active] = policy.data;
    const spent = spentToday.data ?? BigInt(0);
    if (agent.toLowerCase() === ZERO) {
      policyNotice = <Notice tone="muted">No agent policy is set. You can still pay as the owner.</Notice>;
    } else if (!active) {
      policyNotice = <Notice tone="warning">The agent policy is revoked, so the agent would be blocked. You can still pay as the owner.</Notice>;
    } else if (BigInt(now) > expiry) {
      policyNotice = <Notice tone="warning">The agent policy has expired, so the agent would be blocked. You can still pay as the owner.</Notice>;
    } else if (amountUnits > perTxCap) {
      policyNotice = <Notice tone="warning">Over the per-payment cap of {tusd(perTxCap)}. The agent would block this, but you can still approve it yourself.</Notice>;
    } else if (spent + amountUnits > dailyCap) {
      policyNotice = <Notice tone="warning">This would exceed today&apos;s cap. Remaining today: {tusd(dailyCap > spent ? dailyCap - spent : BigInt(0))}. You can still pay as the owner.</Notice>;
    } else {
      policyNotice = <Notice tone="success">Within policy: the agent could pay this automatically.</Notice>;
    }
  }

  const alreadyPaid = paid.data === true;
  const insufficientBalance =
    amountUnits !== null && balance.data !== undefined && balance.data < amountUnits;
  const needsApproval =
    amountUnits !== null && allowance.data !== undefined && allowance.data < amountUnits;
  const canSubmit =
    Boolean(address) &&
    payeeOk &&
    amountUnits !== null &&
    Boolean(invoiceId) &&
    paid.data === false &&
    !insufficientBalance &&
    allowance.data !== undefined;

  const onApprove = () => {
    if (!amountUnits) return;
    approve.writeContract({
      address: ADDRESSES.tusd8,
      abi: erc20Abi,
      functionName: "approve",
      args: [ADDRESSES.payables, amountUnits],
      chainId: aevum.id,
    });
  };

  const onPay = () => {
    if (!amountUnits || !invoiceId) return;
    pay.writeContract({
      address: ADDRESSES.payables,
      abi: payablesAbi,
      functionName: "payAsOwner",
      args: [payeeArg, trimmedName, amountUnits, invoiceId],
      chainId: aevum.id,
    });
  };

  const fill = (n: string, a: string, r: string) => {
    setPayee(ACME);
    setName(n);
    setAmount(a);
    setRef(r);
  };

  if (paidOk && pay.data) {
    return (
      <div className={card}>
        <Notice tone="success">Payment confirmed on Aevum.</Notice>
        <p className="mt-4 text-sm text-muted">
          {amountUnits ? tusd(amountUnits) : "Your payment"} was sent to {trimmedName}.
        </p>
        <a
          className="mt-3 inline-block text-sm text-primary hover:underline"
          href={`${EXPLORER}/tx/${pay.data}`}
          target="_blank"
          rel="noreferrer"
        >
          View transaction on the explorer
        </a>
      </div>
    );
  }

  return (
    <div className={`${card} space-y-5`}>
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
        <span>Try an example:</span>
        <button className="rounded-full border border-border px-3 py-1 hover:bg-surface-alt" onClick={() => fill("Acme Ltd", "0.5", "invoice-004")}>
          Correct name
        </button>
        <button className="rounded-full border border-border px-3 py-1 hover:bg-surface-alt" onClick={() => fill("Acme Limited", "0.5", "invoice-005")}>
          Wrong name
        </button>
        <button className="rounded-full border border-border px-3 py-1 hover:bg-surface-alt" onClick={() => fill("Acme Ltd", "1.5", "invoice-006")}>
          Over the cap
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm sm:col-span-2">
          <span className="text-muted">Payee wallet address</span>
          <input className={`${input} mt-1`} value={payee} onChange={(e) => setPayee(e.target.value)} placeholder="0x..." />
        </label>
        <label className="block text-sm">
          <span className="text-muted">Payee name on the invoice</span>
          <input className={`${input} mt-1`} value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Ltd" />
        </label>
        <label className="block text-sm">
          <span className="text-muted">Amount (tUSD8)</span>
          <input className={`${input} mt-1`} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.50" inputMode="decimal" />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="text-muted">Invoice reference</span>
          <input className={`${input} mt-1`} value={ref} onChange={(e) => setRef(e.target.value)} placeholder="invoice-004" />
        </label>
      </div>

      <div className="space-y-3">
        {payeeNotice}
        {policyNotice}
        {alreadyPaid && <Notice tone="danger">This invoice reference was already paid. It cannot be paid twice.</Notice>}
        {insufficientBalance && <Notice tone="danger">Your wallet does not hold enough tUSD8 for this payment.</Notice>}
      </div>

      {!address ? (
        <Notice tone="muted">Connect your wallet to pay.</Notice>
      ) : needsApproval ? (
        <button className={primaryBtn} disabled={!canSubmit || approve.isPending || approveReceipt.isLoading} onClick={onApprove}>
          {approve.isPending ? "Confirm in your wallet..." : approveReceipt.isLoading ? "Approving on Aevum..." : `Approve exactly ${amountUnits ? tusd(amountUnits) : ""}`}
        </button>
      ) : (
        <button className={primaryBtn} disabled={!canSubmit || pay.isPending || payReceipt.isLoading} onClick={onPay}>
          {pay.isPending ? "Confirm in your wallet..." : payReceipt.isLoading ? "Paying on Aevum..." : `Pay ${amountUnits ? tusd(amountUnits) : ""} as owner`}
        </button>
      )}

      {needsApproval && <p className="text-xs text-muted">The payables contract can only move the exact amount you approve here.</p>}
      {approve.error && <Notice tone="danger">{errText(approve.error)}</Notice>}
      {pay.error && <Notice tone="danger">{errText(pay.error)}</Notice>}
      {payReceipt.data?.status === "reverted" && <Notice tone="danger">The transaction was reverted on-chain.</Notice>}
    </div>
  );
}
