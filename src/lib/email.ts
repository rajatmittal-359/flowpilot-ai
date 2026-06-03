import nodemailer, { type TransportOptions } from "nodemailer"
import type SMTPTransport from "nodemailer/lib/smtp-transport"

function getTransporter() {
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT ?? "587")
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass) {
    console.warn("[email] SMTP credentials missing (SMTP_HOST, SMTP_USER, SMTP_PASS) — email notifications are disabled")
    return null
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass },
    family: 4,
    connectionTimeout: 10000,
  } as SMTPTransport.Options)
}

const from = process.env.SMTP_FROM ?? "FlowPilot AI <noreply@flowpilot.local>"

interface SendEmailOptions {
  to: string
  subject: string
  text: string
}

export function sendEmail(options: SendEmailOptions): void {
  const transporter = getTransporter()
  if (!transporter) return

  console.log("[email] dispatching notification", { to: options.to, subject: options.subject })

  transporter
    .sendMail({ from, to: options.to, subject: options.subject, text: options.text })
    .then(() => {
      console.log("[email] delivered", { to: options.to, subject: options.subject })
    })
    .catch((err) => {
      console.warn("[email] failed to send notification", { to: options.to, subject: options.subject, err })
    })
}
