import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const secret = process.env.AUTH_SECRET || "default_development_secret_key_change_in_production";
const secretKey = new TextEncoder().encode(secret);

// ─────────────────────────────────────────────
// PASSWORD
// ─────────────────────────────────────────────

// Hash a password before storing it
export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

// Verify a password during login
export async function verifyPassword(
  password: string,
  hashedPassword: string
) {
  return bcrypt.compare(password, hashedPassword);
}

// ─────────────────────────────────────────────
// AUTHENTICATION TOKEN
// ─────────────────────────────────────────────

// Create authentication token
export async function createAuthToken(payload: {
  userId: string;
  role: "STUDENT" | "TEACHER" | "ADMIN";
}) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey);
}

// Verify authentication token
export async function verifyAuthToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secretKey);

    return {
      userId: payload.userId as string,
      role: payload.role as "STUDENT" | "TEACHER" | "ADMIN",
    };
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────
// CURRENT USER
// ─────────────────────────────────────────────

// Get the currently authenticated user from the HTTP-only cookie
export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    return null;
  }

  return verifyAuthToken(token);
}