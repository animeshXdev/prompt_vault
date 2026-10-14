"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Lock,
  Eye,
  EyeOff,
  Shield,
  Laptop,
  Globe,
  LogOut,
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react";
import { changePasswordSchema, type ChangePasswordInput } from "@/lib/validations/auth";
import { changePasswordAction, logoutAllDevicesAction } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

interface SessionRecord {
  id: string;
  token: string;
  userAgent: string | null;
  ipAddress: string | null;
  expiresAt: Date | string;
  createdAt: Date | string;
  isCurrent: boolean;
}

export function SecuritySettingsForm({ sessions }: { sessions: SessionRecord[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  const newPasswordValue = watch("newPassword") || "";

  // Password strength checks
  const hasLength = newPasswordValue.length >= 8;
  const hasUpper = /[A-Z]/.test(newPasswordValue);
  const hasLower = /[a-z]/.test(newPasswordValue);
  const hasNumberOrSymbol = /[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPasswordValue);
  const strengthScore = [hasLength, hasUpper, hasLower, hasNumberOrSymbol].filter(Boolean).length;

  const onSubmitPassword = (data: ChangePasswordInput) => {
    startTransition(async () => {
      const res = await changePasswordAction(data);
      if (res?.success) {
        toast.success("Administrator password updated successfully. Other sessions invalidated.");
        reset();
        router.refresh();
      } else {
        toast.error(res?.error || "Failed to update password");
      }
    });
  };

  const handleLogoutAll = () => {
    if (!confirm("Are you sure you want to log out from all devices? You will be redirected to the login page.")) return;
    startTransition(async () => {
      await logoutAllDevicesAction();
    });
  };

  return (
    <div className="space-y-6">
      {/* Change Password Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-semibold flex items-center gap-2">
            <Lock className="w-4 h-4 text-indigo-500" />
            Change Administrator Password
          </CardTitle>
          <CardDescription className="text-[11px]">
            New password is encrypted with Argon2id. Once changed, the database hash remains authoritative.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmitPassword)} className="space-y-4 max-w-md text-xs">
            {/* Current Password */}
            <div className="space-y-1.5">
              <Label htmlFor="current-pw">Current Password</Label>
              <div className="relative">
                <Input
                  id="current-pw"
                  type={showCurrent ? "text" : "password"}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  {...register("currentPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-2.5 top-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                  tabIndex={-1}
                >
                  {showCurrent ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              {errors.currentPassword && (
                <p className="text-[11px] text-red-500">{errors.currentPassword.message}</p>
              )}
            </div>

            {/* New Password */}
            <div className="space-y-1.5">
              <Label htmlFor="new-pw">New Password</Label>
              <div className="relative">
                <Input
                  id="new-pw"
                  type={showNew ? "text" : "password"}
                  placeholder="••••••••••••"
                  autoComplete="new-password"
                  {...register("newPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-2.5 top-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                  tabIndex={-1}
                >
                  {showNew ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-[11px] text-red-500">{errors.newPassword.message}</p>
              )}
            </div>

            {/* Password Strength Feedback */}
            {newPasswordValue.length > 0 && (
              <div className="p-2.5 rounded-md bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-zinc-600 dark:text-zinc-400">Password Strength:</span>
                  <span
                    className={`font-semibold ${
                      strengthScore <= 2
                        ? "text-red-500"
                        : strengthScore === 3
                        ? "text-amber-500"
                        : "text-emerald-500"
                    }`}
                  >
                    {strengthScore <= 2 ? "Weak" : strengthScore === 3 ? "Good" : "Strong"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[10px]">
                  <span className={`flex items-center gap-1 ${hasLength ? "text-emerald-600" : "text-zinc-400"}`}>
                    <Check className="w-3 h-3" /> 8+ Characters
                  </span>
                  <span className={`flex items-center gap-1 ${hasUpper ? "text-emerald-600" : "text-zinc-400"}`}>
                    <Check className="w-3 h-3" /> Uppercase Letter
                  </span>
                  <span className={`flex items-center gap-1 ${hasLower ? "text-emerald-600" : "text-zinc-400"}`}>
                    <Check className="w-3 h-3" /> Lowercase Letter
                  </span>
                  <span className={`flex items-center gap-1 ${hasNumberOrSymbol ? "text-emerald-600" : "text-zinc-400"}`}>
                    <Check className="w-3 h-3" /> Number or Symbol
                  </span>
                </div>
              </div>
            )}

            {/* Confirm New Password */}
            <div className="space-y-1.5">
              <Label htmlFor="confirm-pw">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirm-pw"
                  type={showConfirm ? "text" : "password"}
                  placeholder="••••••••••••"
                  autoComplete="new-password"
                  {...register("confirmNewPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-2.5 top-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              {errors.confirmNewPassword && (
                <p className="text-[11px] text-red-500">{errors.confirmNewPassword.message}</p>
              )}
            </div>

            <Button type="submit" size="sm" disabled={isPending} className="gap-1.5 font-semibold">
              {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
              Update Authoritative Password
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Active Sessions Card */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-xs font-semibold flex items-center gap-2">
              <Laptop className="w-4 h-4 text-blue-500" />
              Active Database-Backed Sessions ({sessions.length})
            </CardTitle>
            <CardDescription className="text-[11px]">
              Every device authenticated with your administrator cookie.
            </CardDescription>
          </div>

          <Button
            size="sm"
            variant="destructive"
            onClick={handleLogoutAll}
            disabled={isPending}
            className="gap-1.5 text-xs h-7"
          >
            <LogOut className="w-3 h-3" />
            Logout from All Devices
          </Button>
        </CardHeader>
        <CardContent className="divide-y divide-zinc-200 dark:divide-zinc-800 p-0 text-xs">
          {sessions.map((s) => (
            <div key={s.id} className="p-3 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {s.userAgent?.slice(0, 45) || "Web Browser"}...
                  </span>
                  {s.isCurrent && (
                    <Badge variant="success" className="text-[9px] py-0">
                      Current Session
                    </Badge>
                  )}
                </div>
                <p className="text-[10px] text-zinc-400 font-mono">
                  IP: {s.ipAddress || "127.0.0.1"} • Created: {formatDate(s.createdAt)}
                </p>
              </div>

              <span className="text-[10px] text-zinc-400 font-mono">
                Expires: {formatDate(s.expiresAt)}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
