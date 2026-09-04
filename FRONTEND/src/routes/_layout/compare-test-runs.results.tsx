import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link, redirect } from "@tanstack/react-router"
import { z } from "zod"

import type { PaginatedTestResults } from "@/client"
import { TestResultsService } from "@/client"
import PendingTestResults from "@/components/Pending/PendingTestResults"
import { fullColumns } from "@/components/TestResults/fullColumns"
import { SimpleTestResultsTable } from "@/components/TestResults/SimpleTestResultsTable"
import { TestRunsRadarChart } from "@/components/TestResults/TestRunsRadarChart"
import { Button } from "@/components/ui/button"

const searchSchema = z.object({
  builds: z.array(z.string()).default([]),
})

function buildBuildsQuery(builds: string[]): string {
  return builds
    .map((build) => `build = "${build.replace(/"/g, '\\"')}"`)
    .join(" OR ")
}

export const Route = createFileRoute("/_layout/compare-test-runs/results")({
  component: CompareTestRunsResults,
  validateSearch: searchSchema,
  beforeLoad: ({ search }) => {
    if (search.builds.length === 0) {
      throw redirect({ to: "/compare-test-runs" })
    }
  },
  head: () => ({
    meta: [
      {
        title: "Compare Test Runs - Death Star Test Data",
      },
    ],
  }),
})

function CompareTestRunsResults() {
  const { builds } = Route.useSearch()

  const { data, isLoading } = useQuery({
    queryKey: ["compare-test-runs", builds],
    queryFn: () =>
      TestResultsService.queryTestResultsTestResultsQueryGet({
        q: buildBuildsQuery(builds),
        skip: 0,
        limit: builds.length,
      }) as unknown as Promise<PaginatedTestResults>,
  })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Compare Test Runs
        </h1>
        <p className="text-muted-foreground">Comparing {builds.length} builds</p>
      </div>

      {isLoading || !data ? (
        <PendingTestResults />
      ) : (
        <>
          <SimpleTestResultsTable columns={fullColumns} data={data.items} />
          <TestRunsRadarChart data={data.items} />
        </>
      )}

      <div>
        <Button variant="outline" asChild>
          <Link to="/compare-test-runs">Back</Link>
        </Button>
      </div>
    </div>
  )
}
