import { Eye } from "lucide-react"
import { useState } from "react"

import type { TestResultResponse } from "@/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { getScoreBadgeVariant, SUBSYSTEM_TEST_FIELDS } from "@/lib/testResultFields"

function PercentageBadge({ value }: { value: number | null }) {
  if (value === null) {
    return <Badge variant="secondary">n/a</Badge>
  }
  return <Badge variant={getScoreBadgeVariant(value)}>{value}%</Badge>
}

interface ViewTestResultProps {
  testResult: TestResultResponse
}

const ViewTestResult = ({ testResult }: ViewTestResultProps) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <Button variant="ghost" size="icon" onClick={() => setIsOpen(true)}>
        <Eye className="size-4" />
        <span className="sr-only">View details</span>
      </Button>
      <SheetContent className="sm:max-w-md w-full">
        <SheetHeader>
          <SheetTitle className="font-mono">{testResult.build}</SheetTitle>
          <SheetDescription>
            Tested on {testResult.test_date}
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-3 px-4 pb-4">
          <div className="flex items-center justify-between border-b pb-3">
            <span className="font-medium">Overall Test Rate</span>
            <PercentageBadge value={testResult.overall_test_rate} />
          </div>
          {SUBSYSTEM_TEST_FIELDS.map((field) => (
            <div
              key={field.name}
              className="flex items-center justify-between"
            >
              <span className="text-sm text-muted-foreground">
                {field.label}
              </span>
              <PercentageBadge value={testResult[field.name]} />
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default ViewTestResult
