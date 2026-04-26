import { createFileRoute } from "@tanstack/react-router";
import SimulationDashboard from "@/components/SimulationDashboard";

export const Route = createFileRoute("/simulation")({
  head: () => ({
    meta: [
      { title: "IP Token Simulation - Creator Commerce Hub" },
      {
        name: "description",
        content:
          "Interactive simulation of IP token mechanics, liquidity management, and emergency burn mechanisms.",
      },
    ],
  }),
  component: SimulationPage,
});

function SimulationPage() {
  return <SimulationDashboard />;
}
