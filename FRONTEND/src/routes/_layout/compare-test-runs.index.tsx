import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { Plus, X } from "lucide-react"
import { useMemo, useState } from "react"

import type { PaginatedTestResults, TestResultResponse } from "@/client"
import { TestResultsService } from "@/client"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export const Route = createFileRoute("/_layout/compare-test-runs/")({
  component: CompareTestRuns,
  head: () => ({
    meta: [
      {
        title: "Compare Test Runs - Death Star Test Data",
      },
    ],
  }),
})

interface CompareRow {
  id: string
  build: string
}

function makeEmptyRows(): CompareRow[] {
  return [
    { id: crypto.randomUUID(), build: "" },
    { id: crypto.randomUUID(), build: "" },
  ]
}

function CompareTestRuns() {
  const navigate = useNavigate()
  const [rows, setRows] = useState<CompareRow[]>(makeEmptyRows)

  // The backend caps `limit` at 100 per request, so fetch every build in
  // pages of 100 rather than one large request.
  const { data: allTestResults } = useQuery({
    queryKey: ["all-builds"],
    queryFn: async () => {
      const pageSize = 100
      const items: TestResultResponse[] = []
      let skip = 0
      let total = Infinity
      while (skip < total) {
        const page = (await TestResultsService.readAllTestResultsGet({
          skip,
          limit: pageSize,
        })) as unknown as PaginatedTestResults
        items.push(...page.items)
        total = page.total
        skip += pageSize
      }
      return items
    },
  })

  const allBuilds = useMemo(() => {
    const seen = new Set<string>()
    const builds: string[] = []
    for (const item of allTestResults ?? []) {
      if (!seen.has(item.build)) {
        seen.add(item.build)
        builds.push(item.build)
      }
    }
    return builds
  }, [allTestResults])

  const addRow = () => {
    setRows((prev) => [...prev, { id: crypto.randomUUID(), build: "" }])
  }

  const removeRow = (id: string) => {
    setRows((prev) =>
      prev.length <= 1 ? prev : prev.filter((row) => row.id !== id),
    )
  }

  const updateRow = (id: string, build: string) => {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, build } : row)),
    )
  }

  const reset = () => setRows(makeEmptyRows())

  const selectedBuilds = rows.map((row) => row.build).filter(Boolean)
  const canCompare = selectedBuilds.length >= 2

  const onCompare = () => {
    navigate({
      to: "/compare-test-runs/results",
      search: { builds: selectedBuilds },
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Compare Test Runs
        </h1>
        <p className="text-muted-foreground">
          Compare results across two test runs, side by side
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={addRow}>
          <Plus className="size-4" />
          <span className="sr-only">Add row</span>
        </Button>
        <Button variant="outline" onClick={reset}>
          Reset
        </Button>
      </div>

      <table className="w-fit border-none">
        <tbody>
          {rows.map((row) => {
            const chosenElsewhere = rows
              .filter((other) => other.id !== row.id)
              .map((other) => other.build)
            const options = allBuilds.filter(
              (build) => build === row.build || !chosenElsewhere.includes(build),
            )

            return (
              <tr key={row.id} className="border-none">
                <td className="border-none py-2 pr-4 align-middle font-medium">
                  Build:
                </td>
                <td className="border-none py-2 align-middle">
                  <div className="flex items-center gap-2">
                    <Select
                      value={row.build}
                      onValueChange={(value) => updateRow(row.id, value)}
                    >
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder="Select a build" />
                      </SelectTrigger>
                      <SelectContent>
                        {options.map((build) => (
                          <SelectItem key={build} value={build}>
                            {build}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRow(row.id)}
                      disabled={rows.length <= 1}
                    >
                      <X className="size-4" />
                      <span className="sr-only">Remove row</span>
                    </Button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <div className="flex items-center gap-3">
        <Button
          onClick={onCompare}
          disabled={!canCompare}
          className="disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100"
        >
          Compare
        </Button>
        {!canCompare && (
          <p className="text-sm text-muted-foreground">
            Select at least 2 builds to compare
          </p>
        )}
      </div>
    </div>
  )
}
