import { useQuery } from "@tanstack/react-query"
import type { ColumnDef } from "@tanstack/react-table"
import { Search } from "lucide-react"

import type { PaginatedTestResults, TestResultResponse } from "@/client"
import { TestResultsService } from "@/client"
import PendingTestResults from "@/components/Pending/PendingTestResults"
import { columns as defaultColumns } from "@/components/TestResults/columns"
import { PaginatedTestResultsTable } from "@/components/TestResults/PaginatedTestResultsTable"

interface TestResultsTableProps {
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  columns?: ColumnDef<TestResultResponse>[]
}

export function TestResultsTable({
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  columns = defaultColumns,
}: TestResultsTableProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["test-results", page, pageSize],
    queryFn: () =>
      TestResultsService.readAllTestResultsGet({
        skip: page * pageSize,
        limit: pageSize,
      }) as unknown as Promise<PaginatedTestResults>,
  })

  if (isLoading || !data) {
    return <PendingTestResults />
  }

  if (data.total === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-12">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Search className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">
          You don't have any test results yet
        </h3>
        <p className="text-muted-foreground">
          Add a new test result to get started
        </p>
      </div>
    )
  }

  return (
    <PaginatedTestResultsTable
      columns={columns}
      data={data}
      page={page}
      pageSize={pageSize}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
    />
  )
}
