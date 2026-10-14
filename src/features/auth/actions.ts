"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/db";
import { verifyPassword, hashPassword } from "@/lib/security/crypto";
import {
  createSession,
  destroySession,
  destroyAllSessions,
  requireAuth,
  checkLoginRateLimit,
  recordFailedLoginAttempt,
  resetLoginRateLimit,
} from "@/lib/auth/session";
import { loginSchema, changePasswordSchema, type LoginInput, type ChangePasswordInput } from "@/lib/validations/auth";
import { logActivity } from "@/lib/activity";
import { bootstrapSystem } from "@/lib/auth/bootstrap";

export async function loginAction(input: LoginInput): Promise<{ error?: string }> {
  try {
    // Ensure database bootstrap has run
    await bootstrapSystem();

    const validation = loginSchema.safeParse(input);
    if (!validation.success) {
      return { error: validation.error.issues[0]?.message || "Invalid input" };
    }

    const headerList = await headers();
    const forwardedFor = headerList.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";
    const userAgent = headerList.get("user-agent") || undefined;

    // Rate limiting check
    const rateLimit = checkLoginRateLimit(ip);
    if (!rateLimit.allowed) {
      return {
        error: `Too many failed login attempts. Please try again in ${rateLimit.retryAfterSec || 60} seconds.`,
      };
    }

    const { email, password } = validation.data;
    const admin = await prisma.administrator.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!admin) {
      recordFailedLoginAttempt(ip);
      await logActivity({ action: "login_failed", entityType: "session", details: { email, reason: "Admin not found" }, ipAddress: ip }).catch(() => {});
      return { error: "Invalid email or password." };
    }

    const passwordValid = await verifyPassword(admin.passwordHash, password);
    if (!passwordValid) {
      recordFailedLoginAttempt(ip);
      await logActivity({ action: "login_failed", entityType: "session", details: { email, reason: "Password mismatch" }, ipAddress: ip }).catch(() => {});
      return { error: "Invalid email or password." };
    }

    // Login successful
    resetLoginRateLimit(ip);

    // Update last login timestamp
    await prisma.administrator.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    }).catch(() => {});

    // Create session
    await createSession(admin.id, {
      userAgent,
      ipAddress: ip,
    });

    await logActivity({ action: "login_success", entityType: "session", details: { email }, ipAddress: ip }).catch(() => {});
  } catch (error: any) {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("[loginAction server error]:", error);
    return {
      error: error?.message || "An unexpected server error occurred during login. Please try again.",
    };
  }

  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  await destroySession().catch(() => {});
  redirect("/login");
}

export async function logoutAllDevicesAction(): Promise<void> {
  try {
    const session = await requireAuth();
    await destroyAllSessions(session.adminId);
  } catch (err: any) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err;
  }
  redirect("/login");
}

export async function changePasswordAction(input: ChangePasswordInput): Promise<{ success?: boolean; error?: string }> {
  const session = await requireAuth();

  const validation = changePasswordSchema.safeParse(input);
  if (!validation.success) {
    return { error: validation.error.issues[0]?.message || "Invalid input" };
  }

  const admin = await prisma.administrator.findUnique({
    where: { id: session.adminId },
  });

  if (!admin) {
    return { error: "Administrator account not found." };
  }

  const currentPasswordValid = await verifyPassword(admin.passwordHash, input.currentPassword);
  if (!currentPasswordValid) {
    return { error: "Current password is incorrect." };
  }

  // Hash new password with Argon2id
  const newHash = await hashPassword(input.newPassword);

  // Update DB password
  await prisma.administrator.update({
    where: { id: admin.id },
    data: { passwordHash: newHash },
  });

  // Invalidate other sessions except current session
  await prisma.session.deleteMany({
    where: {
      adminId: admin.id,
      id: { not: session.id },
    },
  });

  await logActivity({
    action: "password_changed",
    entityType: "administrator",
    entityId: admin.id,
  });

  return { success: true };
}
