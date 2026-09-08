import { z } from "zod"

import type { TestResultRequest } from "@/client"
import { type SubsystemTestField, SUBSYSTEM_TEST_FIELDS } from "@/lib/testResultFields"

// Percentage inputs come from <input type="number"> via react-hook-form as
// plain strings. Validated here as optional numeric strings in [0, 100] and
// converted to numbers only when building the API request (toTestResultRequest
// below) - keeping the schema's input and output types identical (no
// z.preprocess/transform) avoids react-hook-form + zod generic mismatches.
const optionalPercentage = z.string().optional().refine(
  (val) => {
    if (val === undefined || val === "") return true
    const num = Number(val)
    return !Number.isNaN(num) && num >= 0 && num <= 100
  },
  { message: "Must be a number between 0 and 100" },
)

const subsystemFieldsShape = Object.fromEntries(
  SUBSYSTEM_TEST_FIELDS.map((field) => [field.name, optionalPercentage]),
) as Record<SubsystemTestField, typeof optionalPercentage>

export const testResultFormSchema = z.object({
  test_date: z.string().min(1, { message: "Date is required" }),
  build: z.string().min(3, { message: "Build must be at least 3 characters" }),
  // overall_test_rate isn't collected here - the backend computes it as the
  // average of the subsystem tests below.
  ...subsystemFieldsShape,
})

export type TestResultFormData = z.infer<typeof testResultFormSchema>

function toPercentage(value: string | undefined): number | undefined {
  if (value === undefined || value === "") return undefined
  return Number(value)
}

export function toTestResultRequest(
  data: TestResultFormData,
): TestResultRequest {
  return {
    test_date: data.test_date,
    build: data.build,
    ...Object.fromEntries(
      SUBSYSTEM_TEST_FIELDS.map((field) => [
        field.name,
        toPercentage(data[field.name]),
      ]),
    ),
  } as TestResultRequest
}
