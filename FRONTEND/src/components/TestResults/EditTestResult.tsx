import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Pencil } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"

import { AdminService, type TestResultResponse } from "@/client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { LoadingButton } from "@/components/ui/loading-button"
import useCustomToast from "@/hooks/useCustomToast"
import { SUBSYSTEM_TEST_FIELDS } from "@/lib/testResultFields"
import {
  type TestResultFormData,
  testResultFormSchema,
} from "@/schemas/testResults"
import { handleError } from "@/utils"

interface EditTestResultProps {
  testResult: TestResultResponse
  onSuccess: () => void
}

const EditTestResult = ({ testResult, onSuccess }: EditTestResultProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const form = useForm<TestResultFormData>({
    resolver: zodResolver(testResultFormSchema),
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      test_date: testResult.test_date,
      build: testResult.build,
      overall_test_rate: testResult.overall_test_rate ?? undefined,
      ...Object.fromEntries(
        SUBSYSTEM_TEST_FIELDS.map((field) => [
          field.name,
          testResult[field.name] ?? undefined,
        ]),
      ),
    },
  })

  const mutation = useMutation({
    mutationFn: (data: TestResultFormData) =>
      AdminService.updateTestResultAdminTestResultsTestResultIdPut({
        testResultId: testResult.id,
        requestBody: data,
      }),
    onSuccess: () => {
      showSuccessToast("Test result updated successfully")
      setIsOpen(false)
      onSuccess()
    },
    onError: handleError.bind(showErrorToast),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-test-results"] })
    },
  })

  const onSubmit = (data: TestResultFormData) => {
    mutation.mutate(data)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuItem
        onSelect={(e) => e.preventDefault()}
        onClick={() => setIsOpen(true)}
      >
        <Pencil />
        Edit
      </DropdownMenuItem>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Edit Test Result</DialogTitle>
              <DialogDescription>
                Update the test session details for build{" "}
                <span className="font-mono">{testResult.build}</span>.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="test_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Date <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="build"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Build <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input type="text" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="overall_test_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Overall Test Rate (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step="0.1"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {SUBSYSTEM_TEST_FIELDS.map((subsystemField) => (
                <FormField
                  key={subsystemField.name}
                  control={form.control}
                  name={subsystemField.name}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{subsystemField.label} (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          step="0.1"
                          placeholder="Leave blank for n/a"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>

            <LoadingButton
              type="submit"
              loading={mutation.isPending}
              className="w-full"
            >
              Save Changes
            </LoadingButton>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default EditTestResult
