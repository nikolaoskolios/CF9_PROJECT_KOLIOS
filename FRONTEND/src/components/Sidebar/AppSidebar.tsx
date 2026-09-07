import {
  Circle,
  Code2,
  GitCompare,
  Rocket,
  Search,
  UserCog,
  Users,
} from "lucide-react"

import { Logo } from "@/components/Common/Logo"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar"
import useAuth from "@/hooks/useAuth"
import { type Item, Main } from "./Main"
import { User } from "./User"

const baseItems: Item[] = [
  { icon: Circle, title: "Dashboard - Data Overview", path: "/" },
  { icon: Rocket, title: "Test Results in Detail", path: "/test-results" },
  {
    icon: GitCompare,
    title: "Compare Test Runs",
    path: "/compare-test-runs",
  },
  { icon: Search, title: "Query Test Data", path: "/search" },
  { icon: Code2, title: "Software", path: "/resources" },
  { icon: UserCog, title: "Account", path: "/settings" },
]

export function AppSidebar() {
  const { user: currentUser } = useAuth()

  const items =
    currentUser?.role === "admin"
      ? [...baseItems, { icon: Users, title: "Admin", path: "/admin" }]
      : baseItems

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-4 py-6 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:items-center">
        <Logo variant="responsive" />
      </SidebarHeader>
      <SidebarContent>
        <Main items={items} />
      </SidebarContent>
      <SidebarFooter>
        <User user={currentUser} />
      </SidebarFooter>
    </Sidebar>
  )
}

export default AppSidebar
