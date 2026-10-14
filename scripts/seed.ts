import "dotenv/config";
import { bootstrapSystem } from "../src/lib/auth/bootstrap";

async function main() {
  console.log("Seeding and bootstrapping PromptVault...");
  const res = await bootstrapSystem();
  console.log("Bootstrap complete:", res);
  process.exit(0);
}

main().catch((err) => {
  console.error("Bootstrap error:", err);
  process.exit(1);
});
