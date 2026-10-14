import "dotenv/config";
import readline from "node:readline";
import crypto from "node:crypto";
import prisma from "../src/lib/db";
import { hashPassword } from "../src/lib/security/crypto";

async function main() {
  console.log("=========================================");
  console.log("   PromptVault Admin Password Recovery   ");
  console.log("=========================================");

  const admin = await prisma.administrator.findFirst();

  if (!admin) {
    console.error("❌ No administrator account found in the database. Run the app or bootstrap script first.");
    process.exit(1);
  }

  const args = process.argv.slice(2);
  let newPassword = args.length >= 2 ? args[1] : args[0];

  if (!newPassword) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    newPassword = await new Promise((resolve) => {
      rl.question(`Enter new password for ${admin.email} (or press Enter to generate a random secure password): `, (ans) => {
        rl.close();
        resolve(ans.trim());
      });
    });
  }

  if (!newPassword) {
    newPassword = crypto.randomBytes(12).toString("base64").replace(/[+/=]/g, "X") + "!" + crypto.randomInt(10, 99);
  }

  if (newPassword.length < 8) {
    console.error("❌ Password must be at least 8 characters long.");
    process.exit(1);
  }

  const newHash = await hashPassword(newPassword);

  await prisma.administrator.update({
    where: { id: admin.id },
    data: { passwordHash: newHash },
  });

  // Invalidate all active sessions for security
  await prisma.session.deleteMany({
    where: { adminId: admin.id },
  });

  console.log("\n✅ Administrator password updated successfully!");
  console.log(`   Admin Email:    ${admin.email}`);
  console.log(`   New Password:   ${newPassword}`);
  console.log("   All previous sessions have been invalidated.\n");

  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
