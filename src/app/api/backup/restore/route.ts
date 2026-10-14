import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { restoreBackupArchive } from "@/lib/backup/service";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No backup file uploaded" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await restoreBackupArchive(buffer);
    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to restore backup" }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Vault restored successfully" });
  } catch (err: any) {
    console.error("Backup restoration error:", err);
    return NextResponse.json({ error: err.message || "Server error restoring backup" }, { status: 500 });
  }
}
