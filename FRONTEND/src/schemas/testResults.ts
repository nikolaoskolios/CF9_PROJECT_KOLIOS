import { z } from "zod"

import { SUBSYSTEM_TEST_FIELDS } from "@/lib/testResultFields"

const optionalPercentage = z.preprocess(
  (val) => (val === "" || val === undefined ? undefined : Number(val)),
  z
    .number()
    .min(0, { message: "Must be at least 0" })
    .max(100, { message: "Must be at most 100" })
    .optional(),
)

const subsystemFieldsShape = Object.fromEntries(
  SUBSYSTEM_TEST_FIELDS.map((field) => [field.name, optionalPercentage]),
)

export const testResultFormSchema = z.object({
  test_date: z.string().min(1, { message: "Date is required" }),
  build: z.string().min(3, { message: "Build must be at least 3 characters" }),
  overall_test_rate: optionalPercentage,
  ...subsystemFieldsShape,
})

export type TestResultFormData = z.infer<typeof testResultFormSchema>
