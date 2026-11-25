import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { aevum } from "./aevum";

export const wagmiConfig = createConfig({
  chains: [aevum],
  connectors: [injected()],
  transports: { [aevum.id]: http() },
  ssr: true,
});
