import type { ColumnDef } from "@tanstack/react-table"

import type { TestResultResponse } from "@/client"
import { Badge } from "@/components/ui/badge"
import { getScoreBadgeVariant, SUBSYSTEM_TEST_FIELDS } from "@/lib/testResultFields"

function PercentageBadge({ value }: { value: number | null }) {
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

export const fullColumns: ColumnDef<TestResultResponse>[] = [
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
      <PercentageBadge value={row.original.overall_test_rate} />
    ),
  },
  ...SUBSYSTEM_TEST_FIELDS.map(
    (field): ColumnDef<TestResultResponse> => ({
      accessorKey: field.name,
      header: () => <div className="text-center">{field.label}</div>,
      cell: ({ row }) => <PercentageBadge value={row.original[field.name]} />,
    }),
  ),
]
