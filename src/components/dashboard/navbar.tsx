"use client"

import * as React from "react"
import { MenuIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Sidebar } from "@/components/dashboard/sidebar"
import { UserMenu, type DashboardUser } from "@/components/dashboard/user-menu"
import { cn } from "@/lib/utils"

export function Navbar({
  user,
  className,
}: {
  user: DashboardUser
  className?: string
}) {
  const [open, setOpen] = React.useState(false)

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60",
        className
      )}
    >
      <div className="flex h-14 items-center gap-3 px-4">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="md:hidden"
              aria-label="Open sidebar"
            >
              <MenuIcon className="size-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0">
            <Sidebar onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>

        <div className="ml-auto flex items-center gap-2">
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  )
}
