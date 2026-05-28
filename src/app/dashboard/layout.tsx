import type { ReactNode } from "react"

import { Navbar } from "@/components/dashboard/navbar"
import { Sidebar } from "@/components/dashboard/sidebar"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/20">
      <div className="mx-auto flex min-h-screen w-full max-w-screen-2xl">
        <div className="hidden border-r bg-background md:fixed md:inset-y-0 md:flex md:w-64">
          <Sidebar />
        </div>

        <div className="flex min-w-0 flex-1 flex-col md:pl-64">
          <Navbar />
          <main className="flex-1 px-4 py-6 md:px-6">{children}</main>
        </div>
      </div>
    </div>
  )
}

