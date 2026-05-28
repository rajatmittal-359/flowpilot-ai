import { ReactNode } from "react"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

type AuthCardProps = {
  title: string
  description: string
  children: ReactNode
  footer?: ReactNode
  className?: string
}

export function AuthCard({
  title,
  description,
  children,
  footer,
  className,
}: AuthCardProps) {
  return (
    <Card className={cn("overflow-hidden shadow-2xl shadow-slate-950/10", className)}>
      <CardHeader className="space-y-3 border-b px-6 py-6">
        <CardTitle className="text-2xl font-semibold leading-tight">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="px-6 py-6">{children}</CardContent>
      {footer ? <CardFooter className="px-6 py-4">{footer}</CardFooter> : null}
    </Card>
  )
}
