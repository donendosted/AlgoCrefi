import type { Route } from "./+types/pool";
import Pool from "app/pages/pool/pool";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Finance - Algo Crefi" },
    { name: "description", content: "Invest or borrow in decentralized finance pools" },
  ];
}

export default function PoolRoute() {
  return <Pool />;
}
