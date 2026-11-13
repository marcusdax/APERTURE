import { createFileRoute } from "@tanstack/react-router";
import ApertureApp from "@/components/ApertureApp";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <ApertureApp />;
}
