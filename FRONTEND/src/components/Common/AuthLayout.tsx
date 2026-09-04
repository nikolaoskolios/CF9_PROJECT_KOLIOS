import { DeathStarBackdrop } from "@/components/Common/DeathStarBackdrop"
import { Logo } from "@/components/Common/Logo"
import { Footer } from "./Footer"

interface AuthLayoutProps {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="bg-muted dark:bg-zinc-900 relative hidden lg:flex lg:items-center lg:justify-center">
        <div className="flex flex-col items-center gap-3">
          <Logo variant="full" className="h-16" asLink={false} />
          <p
            style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
            className="max-w-xs text-center text-sm font-bold text-foreground"
          >
            Got a planetary problem? We’ll make it disappear.
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <DeathStarBackdrop />
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">{children}</div>
        </div>
        <Footer />
      </div>
    </div>
  )
}
