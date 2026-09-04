import { createFileRoute, Outlet } from "@tanstack/react-router"

export const Route = createFileRoute("/_layout/compare-test-runs")({
  component: () => <Outlet />,
})
