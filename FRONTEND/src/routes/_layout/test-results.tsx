import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"

import { fullColumns } from "@/components/TestResults/fullColumns"
import { TestResultsTable } from "@/components/TestResults/TestResultsTable"

export const Route = createFileRoute("/_layout/test-results")({
  component: TestResults,
  head: () => ({
    meta: [
      {
        title: "Test Results in Detail - Death Star Test Data",
      },
    ],
  }),
})

function TestResults() {
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Test Results in Detail
        </h1>
        <p className="text-muted-foreground">
          Death Star Automated Nightly Suite
        </p>
      </div>
      <TestResultsTable
        columns={fullColumns}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size)
          setPage(0)
        }}
      />
    </div>
  )
}
