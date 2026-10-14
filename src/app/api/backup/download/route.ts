import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createFullVaultBackup } from "@/lib/backup/service";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { zipBuffer } = await createFullVaultBackup();
    const filename = `promptvault-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.zip`;

    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": zipBuffer.length.toString(),
      },
    });
  } catch (err: any) {
    console.error("Backup download failed:", err);
    return NextResponse.json({ error: "Failed to generate backup archive" }, { status: 500 });
  }
}
