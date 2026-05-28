"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createTicketSchema, type CreateTicketBody } from "@/types/tickets"

export function CreateTicketForm() {
  const [formError, setFormError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const router = useRouter()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateTicketBody>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
    },
  })

  async function onSubmit(data: CreateTicketBody) {
    setFormError("")
    setSuccessMessage("")

    try {
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const payload = await response.json()

      if (!response.ok) {
        setFormError(payload?.message ?? "Unable to create ticket. Please try again.")
        return
      }

      setSuccessMessage("Ticket created successfully.")
      reset()
      router.refresh()
    } catch (error) {
      setFormError("Unable to create ticket. Please check your connection and try again.")
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6 rounded-xl border border-border bg-background p-6 shadow-sm">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Create ticket</h2>
        <p className="text-sm text-muted-foreground">
          Submit a new issue and keep your workflow moving.
        </p>
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-medium text-foreground" htmlFor="title">
          Title
        </label>
        <Input id="title" type="text" {...register("title")} aria-invalid={Boolean(errors.title)} />
        {errors.title?.message ? (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        ) : null}
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-medium text-foreground" htmlFor="description">
          Description
        </label>
        <textarea
          id="description"
          rows={5}
          className="min-h-[120px] w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
          {...register("description")}
        />
        {errors.description?.message ? (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        ) : null}
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-medium text-foreground" htmlFor="priority">
          Priority
        </label>
        <select
          id="priority"
          className="h-10 w-full rounded-lg border border-input bg-transparent px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
          {...register("priority")}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
        {errors.priority?.message ? (
          <p className="text-sm text-destructive">{errors.priority.message}</p>
        ) : null}
      </div>

      {formError ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {formError}
        </div>
      ) : null}

      {successMessage ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-100 px-4 py-3 text-sm text-emerald-900">
          {successMessage}
        </div>
      ) : null}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Creating ticket..." : "Create ticket"}
      </Button>
    </form>
  )
}
