import Link from "next/link"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth"

export default async function HomePage() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
  const isAuthenticated = token ? Boolean(await verifySessionToken(token)) : false

  if (isAuthenticated) {
    redirect("/dashboard")
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950/5 px-4 py-16">
      <section className="mx-auto w-full max-w-4xl rounded-3xl border border-slate-200/80 bg-white/95 p-10 shadow-xl shadow-slate-900/5 backdrop-blur-md">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-6">
            <div className="inline-flex rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
              AI support workflow for modern teams
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                FlowPilot AI
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600">
                Turn customer requests into clear ticket actions with AI-augmented summaries, suggested replies, and priority insights.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:border-slate-300"
              >
                Sign up
              </Link>
            </div>
          </div>
          <div className="rounded-[2rem] bg-slate-950 p-8 text-white shadow-2xl shadow-slate-950/20">
            <div className="space-y-6">
              <div className="rounded-3xl bg-slate-900/80 p-6">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Live support dashboard</p>
                <h2 className="mt-4 text-2xl font-semibold">Manage tickets with AI guidance.</h2>
              </div>
              <div className="grid gap-4">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-slate-300">Automated summaries, urgency labels, and reply drafts for every ticket.</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-slate-300">Secure session-based access and modern support workflows.</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-slate-300">Built for support teams that want faster customer resolutions.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
