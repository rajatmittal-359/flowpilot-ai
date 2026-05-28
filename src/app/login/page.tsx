import Link from "next/link"

import { AuthCard } from "@/components/forms/auth-card"
import { LoginForm } from "@/components/forms/login-form"

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-slate-950/5 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl space-y-10">
        <section className="mx-auto max-w-xl text-center space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
            FlowPilot AI
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Secure access to your AI operations.
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign in to continue managing tickets, automations, and customer workflows with FlowPilot.
          </p>
        </section>

        <AuthCard
          title="Sign in"
          description="Use your FlowPilot account email and password to access the dashboard."
          footer={
            <p className="text-sm text-muted-foreground">
              New to FlowPilot?{' '}
              <Link href="/signup" className="font-medium text-primary hover:underline">
                Create an account
              </Link>
            </p>
          }
        >
          <LoginForm />
        </AuthCard>
      </div>
    </main>
  )
}
