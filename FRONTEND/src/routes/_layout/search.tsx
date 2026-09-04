import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { AxiosError } from "axios"
import { SearchIcon } from "lucide-react"
import { useState } from "react"

import { type ApiError, type PaginatedTestResults, TestResultsService } from "@/client"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import PendingTestResults from "@/components/Pending/PendingTestResults"
import { columns } from "@/components/TestResults/columns"
import { PaginatedTestResultsTable } from "@/components/TestResults/PaginatedTestResultsTable"

export const Route = createFileRoute("/_layout/search")({
  component: SearchPage,
  head: () => ({
    meta: [
      {
        title: "Query Test Data - Death Star Test Data",
      },
    ],
  }),
})

function extractErrorMessage(err: ApiError): string {
  if (err instanceof AxiosError) {
    return err.message
  }
  const errDetail = (err.body as { detail?: unknown })?.detail
  if (typeof errDetail === "string") return errDetail
  if (Array.isArray(errDetail) && errDetail.length > 0) return errDetail[0].msg
  return "Something went wrong."
}

const EXAMPLE_QUERY =
  '(overall_test_rate < 92) AND (superlaser_concentration_static_check > 95)'

function SearchPage() {
  const [queryInput, setQueryInput] = useState("")
  const [submittedQuery, setSubmittedQuery] = useState("")
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["test-results-query", submittedQuery, page, pageSize],
    queryFn: () =>
      TestResultsService.queryTestResultsTestResultsQueryGet({
        q: submittedQuery,
        skip: page * pageSize,
        limit: pageSize,
      }),
    enabled: submittedQuery.length > 0,
  })

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(0)
    setSubmittedQuery(queryInput.trim())
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Query Test Data</h1>
        <p className="text-muted-foreground">
          Query test results with build/field conditions, AND / OR, and
          parentheses
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-2">
        <Label htmlFor="query">Query</Label>
        <div className="flex gap-2">
          <Input
            id="query"
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            className="font-mono text-sm"
          />
          <Button type="submit" disabled={queryInput.trim().length === 0}>
            <SearchIcon className="mr-2 size-4" />
            Search
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Example: <span className="font-mono">{EXAMPLE_QUERY}</span>
        </p>
      </form>

      {isError && (
        <Alert variant="destructive">
          <AlertTitle>Invalid query</AlertTitle>
          <AlertDescription>{extractErrorMessage(error)}</AlertDescription>
        </Alert>
      )}

      {submittedQuery && !isError && (
        <>
          {isLoading || !data ? (
            <PendingTestResults />
          ) : (
            <PaginatedTestResultsTable
              columns={columns}
              data={data as PaginatedTestResults}
              page={page}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size)
                setPage(0)
              }}
            />
          )}
        </>
      )}
    </div>
  )
}
