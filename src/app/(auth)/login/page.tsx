import React from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { LoginForm } from "./login-form";
import { PromptVaultLogo } from "@/components/brand/logo";

export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950">
      <div className="w-full max-w-sm space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <PromptVaultLogo className="w-10 h-10 text-indigo-600 dark:text-indigo-500 mb-1" />
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Prompt<span className="text-indigo-600 dark:text-indigo-400">Vault</span>
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Private Administrator Access
          </p>
        </div>

        {/* Login Box */}
        <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-6 rounded-xl shadow-xs">
          <LoginForm />
        </div>

        {/* Security Notice */}
        <p className="text-center text-[11px] text-zinc-400 dark:text-zinc-500 select-none">
          Single-tenant secure vault. Registration is disabled.
        </p>
      </div>
    </div>
  );
}
