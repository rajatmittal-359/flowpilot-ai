"use client"

import type * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3Icon,
  BotIcon,
  LayoutDashboardIcon,
  LifeBuoyIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"

type NavItem = {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboardIcon },
  { label: "Tickets", href: "/dashboard/tickets", icon: LifeBuoyIcon },
  { label: "Agents", href: "/dashboard/agents", icon: UsersIcon },
  { label: "AI Assistant", href: "/dashboard/assistant", icon: BotIcon },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3Icon },
  { label: "Settings", href: "/dashboard/settings", icon: SettingsIcon },
]

export function Sidebar({
  className,
  onNavigate,
}: {
  className?: string
  onNavigate?: () => void
}) {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        "flex h-full w-full flex-col bg-background",
        "md:w-64",
        className
      )}
    >
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <div className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <span className="text-sm font-semibold">FP</span>
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold leading-tight">
            FlowPilot AI
          </div>
          <div className="truncate text-xs text-muted-foreground">
            Support & Ops Dashboard
          </div>
        </div>
      </div>

      <nav className="flex-1 p-2">
        <div className="space-y-1">
          {navItems.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname?.startsWith(item.href))
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "group flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                  "hover:bg-muted hover:text-foreground",
                  active
                    ? "bg-muted text-foreground ring-1 ring-foreground/10"
                    : "text-muted-foreground"
                )}
              >
                <Icon
                  className={cn(
                    "size-4 shrink-0",
                    active ? "text-foreground" : "text-muted-foreground"
                  )}
                />
                <span className="truncate">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </aside>
  )
}

