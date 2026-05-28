import { compare, hash } from "bcryptjs"
import type { NextRequest, NextResponse } from "next/server"

export const SESSION_COOKIE_NAME = "flowpilot_session"
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET

  if (!secret) {
    throw new Error("SESSION_SECRET is required")
  }

  return secret
}

async function getSigningKey() {
  const secret = getSessionSecret()
  const encoder = new TextEncoder()
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  )
}

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
}

async function signSessionData(payload: string) {
  const key = await getSigningKey()
  const encoder = new TextEncoder()
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload))
  return toHex(signature)
}

async function verifySignature(payload: string, signature: string) {
  const key = await getSigningKey()
  const encoder = new TextEncoder()
  const signatureBytes = new Uint8Array(
    signature.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) ?? []
  )
  return crypto.subtle.verify("HMAC", key, signatureBytes, encoder.encode(payload))
}

export async function hashPassword(password: string) {
  return hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string) {
  return compare(password, hashedPassword)
}

export async function createSessionToken(userId: number) {
  const expires = Date.now() + SESSION_MAX_AGE * 1000
  const payload = `${userId}:${expires}`
  const signature = await signSessionData(payload)
  return `${payload}:${signature}`
}

export async function verifySessionToken(token: string) {
  const [userIdPart, expiresPart, signature] = token.split(":")

  if (!userIdPart || !expiresPart || !signature) {
    return null
  }

  const expires = Number(expiresPart)

  if (Number.isNaN(expires) || expires < Date.now()) {
    return null
  }

  const payload = `${userIdPart}:${expiresPart}`
  const isValid = await verifySignature(payload, signature)
  if (!isValid) {
    return null
  }

  const userId = Number(userIdPart)
  if (Number.isNaN(userId)) {
    return null
  }

  return { userId }
}

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  })
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  })
}

export async function getSessionFromRequest(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value

  if (!token) {
    return null
  }

  return verifySessionToken(token)
}
