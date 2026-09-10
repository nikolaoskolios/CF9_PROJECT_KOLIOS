import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"

import { OverallTestRateChart } from "@/components/TestResults/OverallTestRateChart"
import {
  TestResultsTable,
  useTestResultsQuery,
} from "@/components/TestResults/TestResultsTable"
import dashboardBg from "/assets/images/dashboard-bg.jpeg"

export const Route = createFileRoute("/_layout/")({
  component: Dashboard,
  head: () => ({
    meta: [
      {
        title: "Dashboard - Death Star Test Data",
      },
    ],
  }),
})

function Dashboard() {
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const { data } = useTestResultsQuery(page, pageSize)

  return (
    <div>
      <img
        src={dashboardBg}
        alt=""
        aria-hidden="true"
        className="fixed inset-0 h-full w-full object-cover opacity-55 pointer-events-none select-none"
      />
      <div className="relative flex flex-col gap-4">
        <div className="rounded-lg bg-background/50 p-4 backdrop-blur-sm">
          <OverallTestRateChart data={data?.items ?? []} />
        </div>
        <div className="rounded-lg bg-background/50 p-4 backdrop-blur-sm">
          <TestResultsTable
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size)
              setPage(0)
            }}
          />
        </div>
      </div>
    </div>
  )
}
