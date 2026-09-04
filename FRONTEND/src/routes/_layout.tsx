import { createFileRoute, Outlet, redirect, useRouterState } from "@tanstack/react-router"

import { DeathStarBackdrop } from "@/components/Common/DeathStarBackdrop"
import { Footer } from "@/components/Common/Footer"
import { DarthVaderHelmetIcon } from "@/components/icons/DarthVaderHelmetIcon"
import AppSidebar from "@/components/Sidebar/AppSidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import useAuth, { isLoggedIn } from "@/hooks/useAuth"

export const Route = createFileRoute("/_layout")({
  component: Layout,
  beforeLoad: async () => {
    if (!isLoggedIn()) {
      throw redirect({
        to: "/login",
      })
    }
  },
})

function Layout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const showBackdrop = pathname !== "/"
  const isDashboard = pathname === "/"
  const { user: currentUser } = useAuth()

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {showBackdrop && <DeathStarBackdrop />}
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger className="-ml-1 text-muted-foreground" />
          {isDashboard && (
            <div className="flex flex-col items-start leading-tight">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <span>
                  Hi, {currentUser?.first_name || currentUser?.username}
                </span>
                <DarthVaderHelmetIcon className="size-5 shrink-0" />
              </div>
              <p className="text-sm text-muted-foreground">
                Welcome back, nice to see you again!!!
              </p>
            </div>
          )}
        </header>
        <main className="flex-1 p-6 md:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
        <Footer />
      </SidebarInset>
    </SidebarProvider>
  )
}

export default Layout
