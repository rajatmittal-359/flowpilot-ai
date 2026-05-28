"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { loginSchema, type LoginFormValues } from "@/types/auth"

export function LoginForm() {
  const [formError, setFormError] = useState("")
  const router = useRouter()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(data: LoginFormValues) {
    setFormError("")

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      const payload = await response.json()

      if (!response.ok) {
        setFormError(payload?.message ?? "Unable to sign in. Please try again.")
        return
      }

      router.push("/dashboard")
    } catch (error) {
      setFormError("Unable to sign in. Please check your connection and try again.")
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      <div className="space-y-3">
        <label className="block text-sm font-medium text-foreground" htmlFor="email">
          Email
        </label>
        <Input
          id="email"
          type="email"
          placeholder="hello@company.com"
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          {...register("email")}
        />
        {errors.email?.message ? (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        ) : null}
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-medium text-foreground" htmlFor="password">
          Password
        </label>
        <Input
          id="password"
          type="password"
          placeholder="Enter your password"
          autoComplete="current-password"
          aria-invalid={Boolean(errors.password)}
          {...register("password")}
        />
        {errors.password?.message ? (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        ) : null}
      </div>

      {formError ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {formError}
        </div>
      ) : null}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  )
}
