import type { Route } from "./+types/dashboard";
import Dashboard from "app/pages/dashboard/dashboard";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Dashboard - Algorand Wallet" },
    { name: "description", content: "Your connected Algorand wallet dashboard" },
  ];
}

export default function DashboardRoute() {
  return <Dashboard />;
}
