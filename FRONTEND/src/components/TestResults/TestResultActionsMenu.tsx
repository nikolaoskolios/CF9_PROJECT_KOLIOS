import { EllipsisVertical } from "lucide-react"
import { useState } from "react"

import type { TestResultResponse } from "@/client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import DeleteTestResult from "./DeleteTestResult"
import EditTestResult from "./EditTestResult"

interface TestResultActionsMenuProps {
  testResult: TestResultResponse
}

export const TestResultActionsMenu = ({
  testResult,
}: TestResultActionsMenuProps) => {
  const [open, setOpen] = useState(false)

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <EllipsisVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <EditTestResult testResult={testResult} onSuccess={() => setOpen(false)} />
        <DeleteTestResult id={testResult.id} onSuccess={() => setOpen(false)} />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
