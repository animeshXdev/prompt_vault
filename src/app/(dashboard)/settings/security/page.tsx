import React from "react";
import prisma from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { SecuritySettingsForm } from "./security-settings-form";

export default async function SecuritySettingsPage() {
  const currentSession = await getSession();

  const sessions = await prisma.session.findMany({
    where: { adminId: currentSession?.adminId },
    orderBy: { createdAt: "desc" },
  });

  const sessionList = sessions.map((s) => ({
    ...s,
    isCurrent: s.token === currentSession?.token,
  }));

  return <SecuritySettingsForm sessions={sessionList} />;
}
