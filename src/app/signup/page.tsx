import Link from "next/link"

import { AuthCard } from "@/components/forms/auth-card"
import { SignupForm } from "@/components/forms/signup-form"

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-slate-950/5 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl space-y-10">
        <section className="mx-auto max-w-xl text-center space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
            FlowPilot AI
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Start your FlowPilot trial.
          </h1>
          <p className="text-sm text-muted-foreground">
            Create a new account to begin automating workflows, tracking AI-driven tickets, and monitoring customer insights.
          </p>
        </section>

        <AuthCard
          title="Create an account"
          description="Sign up with your details and start managing your AI operations in one place."
          footer={
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </p>
          }
        >
          <SignupForm />
        </AuthCard>
      </div>
    </main>
  )
}
