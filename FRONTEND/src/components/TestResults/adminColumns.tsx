import type { ColumnDef } from "@tanstack/react-table"

import type { TestResultResponse } from "@/client"
import { Badge } from "@/components/ui/badge"
import { getScoreBadgeVariant } from "@/lib/testResultFields"
import { TestResultActionsMenu } from "./TestResultActionsMenu"

function OverallRateBadge({ value }: { value: number | null }) {
  return (
    <div className="flex justify-center">
      {value === null ? (
        <Badge variant="secondary">n/a</Badge>
      ) : (
        <Badge variant={getScoreBadgeVariant(value)}>{value}%</Badge>
      )}
    </div>
  )
}

export const adminColumns: ColumnDef<TestResultResponse>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">
        {row.original.id}
      </span>
    ),
  },
  {
    accessorKey: "build",
    header: "Build",
    cell: ({ row }) => (
      <span className="font-mono text-sm">{row.original.build}</span>
    ),
  },
  {
    accessorKey: "test_date",
    header: "Date",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.test_date}</span>
    ),
  },
  {
    accessorKey: "overall_test_rate",
    header: () => <div className="text-center">Overall Test Rate</div>,
    cell: ({ row }) => (
      <OverallRateBadge value={row.original.overall_test_rate} />
    ),
  },
  {
    accessorKey: "owner_id",
    header: "Owner",
    cell: ({ row }) => (
      <span className="text-muted-foreground">#{row.original.owner_id}</span>
    ),
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => (
      <div className="flex justify-end">
        <TestResultActionsMenu testResult={row.original} />
      </div>
    ),
  },
]
