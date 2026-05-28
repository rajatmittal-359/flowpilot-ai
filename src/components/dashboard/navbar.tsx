"use client"

import * as React from "react"
import { BellIcon, MenuIcon, SearchIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Sidebar } from "@/components/dashboard/sidebar"
import { cn } from "@/lib/utils"

export function Navbar({ className }: { className?: string }) {
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

        <div className="flex flex-1 items-center gap-3">
          <div className="relative hidden w-full max-w-md md:block">
            <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search (coming soon)"
              className="pl-9"
              aria-label="Search"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="icon-sm" aria-label="Notifications">
              <BellIcon className="size-4" />
            </Button>

            <div className="flex items-center gap-2 rounded-lg border bg-background px-2 py-1.5">
              <div className="grid size-7 place-items-center rounded-md bg-muted text-xs font-medium text-foreground">
                U
              </div>
              <div className="hidden leading-tight sm:block">
                <div className="text-xs font-medium">User</div>
                <div className="text-[11px] text-muted-foreground">
                  user@flowpilot.ai
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pb-3 md:hidden">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search (coming soon)"
            className="pl-9"
            aria-label="Search"
          />
        </div>
      </div>
    </header>
  )
}

