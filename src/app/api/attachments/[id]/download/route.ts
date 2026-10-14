import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { readAttachmentBuffer } from "@/lib/storage/attachments";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  const attachment = await prisma.attachment.findUnique({
    where: { id },
  });

  if (!attachment) {
    return new NextResponse("Attachment not found", { status: 404 });
  }

  try {
    const fileBuffer = await readAttachmentBuffer(attachment.storagePath);

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        "Content-Type": attachment.mimeType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(attachment.originalName)}"`,
        "Content-Length": fileBuffer.length.toString(),
      },
    });
  } catch (err: any) {
    console.error("Failed to read attachment:", err);
    return new NextResponse("Error reading file", { status: 500 });
  }
}
