import { defineChain, parseAbi } from "viem";

export const aevum = defineChain({
  id: 44005,
  name: "QDay Aevum Testnet",
  nativeCurrency: { name: "tQDAY", symbol: "tQDAY", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc-test.qday.info"] } },
  blockExplorers: {
    default: { name: "QDay Explorer", url: "https://explorer-test.qday.info" },
  },
  testnet: true,
});

export const EXPLORER = "https://explorer-test.qday.info";

export const ADDRESSES = {
  registry: "0x5d1fD27BFBfee52840A3d39C1E294F35A2e5fdc4",
  payables: "0xF2D56370EC36664Af5e22112b5bDb68B4Ac51D41",
  tusd8: "0x456569838f1d43009A91ebA4263147Afd7233483",
} as const;

export const TUSD8_DECIMALS = 6;

export const registryAbi = parseAbi([
  "function getPayee(address payee) view returns (string name, bool verified)",
  "function confirmPayee(address payee, string expectedName) view returns (bool nameMatches, bool verified)",
]);

export const payablesAbi = parseAbi([
  "function policies(address owner) view returns (address agent, uint256 perTxCap, uint256 dailyCap, uint64 expiry, bool active)",
  "function spentOnDay(address owner, uint256 day) view returns (uint256)",
  "function invoicePaid(bytes32 invoiceId) view returns (bool)",
  "function setPolicy(address agent, uint256 perTxCap, uint256 dailyCap, uint64 expiry)",
  "function revokeAgent()",
  "function payInvoice(address owner, address payee, string payeeName, uint256 amount, bytes32 invoiceId)",
  "function payAsOwner(address payee, string payeeName, uint256 amount, bytes32 invoiceId)",
  "event InvoicePaid(bytes32 indexed invoiceId, address indexed owner, address indexed payee, uint256 amount, bool paidByAgent)",
  "error InvalidPolicy()",
  "error PolicyInactive()",
  "error NotAgent()",
  "error PolicyExpired()",
  "error ZeroAmount()",
  "error OverPerTxCap()",
  "error OverDailyCap()",
  "error PayeeNameMismatch()",
  "error PayeeNotVerified()",
  "error InvoiceAlreadyPaid()",
  "error TransferFailed()",
]);

export const erc20Abi = parseAbi([
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
]);
