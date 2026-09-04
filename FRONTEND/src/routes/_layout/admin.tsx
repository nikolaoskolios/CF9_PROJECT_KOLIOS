import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, redirect } from "@tanstack/react-router"
import { Suspense } from "react"

import { AdminService, UserService } from "@/client"
import AddUser from "@/components/Admin/AddUser"
import PendingTestResults from "@/components/Pending/PendingTestResults"
import { DataTable } from "@/components/Common/DataTable"
import AddTestResult from "@/components/TestResults/AddTestResult"
import { adminColumns } from "@/components/TestResults/adminColumns"

function getAllTestResultsQueryOptions() {
  return {
    queryFn: () => AdminService.readAllAdminTestResultsGet(),
    queryKey: ["admin-test-results"],
  }
}

export const Route = createFileRoute("/_layout/admin")({
  component: Admin,
  beforeLoad: async () => {
    let user
    try {
      user = await UserService.getUserUserGet()
    } catch {
      // Expired/invalid session token - bounce to login instead of the
      // generic error page, and clear the stale token while we're at it.
      localStorage.removeItem("access_token")
      throw redirect({
        to: "/login",
      })
    }
    if (user.role !== "admin") {
      throw redirect({
        to: "/",
      })
    }
  },
  head: () => ({
    meta: [
      {
        title: "Admin - Death Star Test Data",
      },
    ],
  }),
})

function TestResultsTableContent() {
  const { data } = useSuspenseQuery(getAllTestResultsQueryOptions())

  return <DataTable columns={adminColumns} data={data} />
}

function TestResultsTable() {
  return (
    <Suspense fallback={<PendingTestResults />}>
      <TestResultsTableContent />
    </Suspense>
  )
}

function Admin() {
  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Users</h1>
            <p className="text-muted-foreground">
              Create new user accounts
            </p>
          </div>
          <AddUser />
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight">
              Edit Test Results
            </h2>
            <p className="text-muted-foreground">
              View, add, update, and delete any test result submitted by any user
            </p>
          </div>
          <AddTestResult />
        </div>
        <TestResultsTable />
      </div>
    </div>
  )
}
