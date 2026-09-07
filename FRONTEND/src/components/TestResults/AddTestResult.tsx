import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"

import { type TestResultRequest, TestResultsService } from "@/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
  toTestResultRequest,
} from "@/schemas/testResults"
import { handleError } from "@/utils"

const defaultValues: TestResultFormData = {
  test_date: "",
  build: "",
  overall_test_rate: undefined,
  ...Object.fromEntries(
    SUBSYSTEM_TEST_FIELDS.map((field) => [field.name, undefined]),
  ),
}

const AddTestResult = () => {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const form = useForm<TestResultFormData>({
    resolver: zodResolver(testResultFormSchema),
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues,
  })

  const mutation = useMutation({
    mutationFn: (data: TestResultRequest) =>
      TestResultsService.createTestResultTestResultsPost({ requestBody: data }),
    onSuccess: () => {
      showSuccessToast("Test result created successfully")
      form.reset(defaultValues)
      setIsOpen(false)
    },
    onError: handleError.bind(showErrorToast),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["test-results"] })
      queryClient.invalidateQueries({ queryKey: ["admin-test-results"] })
    },
  })

  const onSubmit = (data: TestResultFormData) => {
    mutation.mutate(toTestResultRequest(data))
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="my-4">
          <Plus className="mr-2" />
          Add Test Result
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Test Result</DialogTitle>
          <DialogDescription>
            Record a new Death Star build test session.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
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
                      <Input type="date" {...field} required />
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
                      <Input
                        placeholder="death_star_iter_139.001"
                        type="text"
                        {...field}
                        required
                      />
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
                        placeholder="e.g. 99"
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

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" disabled={mutation.isPending}>
                  Cancel
                </Button>
              </DialogClose>
              <LoadingButton type="submit" loading={mutation.isPending}>
                Save
              </LoadingButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default AddTestResult
