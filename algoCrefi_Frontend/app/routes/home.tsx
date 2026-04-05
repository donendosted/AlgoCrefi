import type { Route } from "./+types/home";
import Index from "app/pages/home/homepage";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  return <Index />;
}
