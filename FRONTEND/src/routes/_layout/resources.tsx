import { useMutation } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Download, KeyRound } from "lucide-react"

import { AuthService } from "@/client"
import { Button } from "@/components/ui/button"
import { LoadingButton } from "@/components/ui/loading-button"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"

const UPLOAD_TOOLKIT_URL = `${import.meta.env.VITE_API_URL}/downloads/upload_test_data.zip`

export const Route = createFileRoute("/_layout/resources")({
  component: Resources,
  head: () => ({
    meta: [
      {
        title: "Software - Death Star Test Data",
      },
    ],
  }),
})

function downloadApiToken(apiKey: string) {
  const blob = new Blob([JSON.stringify({ api_key: apiKey }, null, 2)], {
    type: "application/json",
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = "api_token.json"
  link.click()
  URL.revokeObjectURL(url)
}

function Resources() {
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const mutation = useMutation({
    mutationFn: () => AuthService.generateApiKeyAuthApiKeyPost(),
    onSuccess: (data) => {
      downloadApiToken(data.api_key)
      showSuccessToast("API token generated and downloaded")
    },
    onError: handleError.bind(showErrorToast),
  })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Software</h1>
        <p className="text-muted-foreground">
          Software and tools used in the Death Star Test Data project
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Upload Toolkit</h2>
        <p className="max-w-lg text-sm text-muted-foreground">
          A small Python script (plus a sample JSON file) that uses an API
          token to upload a new test result.
        </p>
        <div>
          <Button variant="outline" asChild>
            <a href={UPLOAD_TOOLKIT_URL} download>
              <Download className="mr-2 size-4" />
              Download Upload Toolkit (.zip)
            </a>
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">API Access</h2>
        <p className="max-w-lg text-sm text-muted-foreground">
          Generate an API token to authenticate scripts against the API (for
          example, uploading a new test result). Generating a new token
          replaces any previous one, so save the downloaded file somewhere
          safe.
        </p>
        <div>
          <LoadingButton
            onClick={() => mutation.mutate()}
            loading={mutation.isPending}
          >
            <KeyRound className="mr-2 size-4" />
            Generate API Token
          </LoadingButton>
        </div>
      </div>


    </div>
  )
}
