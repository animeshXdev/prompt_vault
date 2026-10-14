import prisma from "@/lib/db";

export interface LogActivityParams {
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: Record<string, any>;
  ipAddress?: string | null;
}

export async function logActivity({
  action,
  entityType,
  entityId,
  details,
  ipAddress,
}: LogActivityParams): Promise<void> {
  try {
    // Sanitize details: never log passwords or API keys
    const safeDetails = details ? { ...details } : {};
    delete safeDetails.password;
    delete safeDetails.currentPassword;
    delete safeDetails.newPassword;
    delete safeDetails.apiKey;
    delete safeDetails.token;

    await prisma.activityLog.create({
      data: {
        action,
        entityType,
        entityId: entityId || null,
        detailsJson: Object.keys(safeDetails).length > 0 ? JSON.stringify(safeDetails) : null,
        ipAddress: ipAddress || null,
      },
    });
  } catch (error) {
    console.error("Failed to write activity log:", error);
  }
}
