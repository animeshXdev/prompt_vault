import { describe, it, expect } from "vitest";
import {
  hashPassword,
  verifyPassword,
  generateSecureToken,
  encryptSecret,
  decryptSecret,
} from "@/lib/security/crypto";

describe("Crypto & Security Module", () => {
  describe("Argon2id Password Hashing", () => {
    it("should hash a password and verify it correctly", async () => {
      const plaintext = "SuperSecretPassword123!#";
      const hashedPassword = await hashPassword(plaintext);

      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).toContain("$argon2id$");

      const isValid = await verifyPassword(hashedPassword, plaintext);
      expect(isValid).toBe(true);
    });

    it("should reject an incorrect password candidate", async () => {
      const plaintext = "CorrectPassword123!";
      const hashedPassword = await hashPassword(plaintext);

      const isValid = await verifyPassword(hashedPassword, "WrongPassword456!");
      expect(isValid).toBe(false);
    });

    it("should produce different hashes for the same password due to random salt", async () => {
      const password = "SamePassword123!";
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
      expect(await verifyPassword(hash1, password)).toBe(true);
      expect(await verifyPassword(hash2, password)).toBe(true);
    });
  });

  describe("Token Generation", () => {
    it("should generate random hex tokens of correct length", () => {
      const token1 = generateSecureToken(16);
      const token2 = generateSecureToken(32);

      expect(token1).toHaveLength(32); // 16 bytes = 32 hex chars
      expect(token2).toHaveLength(64); // 32 bytes = 64 hex chars
      expect(token1).not.toBe(token2);
    });
  });

  describe("AES-256-GCM Secret Encryption & Decryption", () => {
    it("should encrypt and decrypt plaintext accurately", () => {
      const secretApiKey = "sk-test-openai-apikey-1234567890abcdef";
      const encrypted = encryptSecret(secretApiKey);

      expect(encrypted).toBeDefined();
      expect(encrypted).toContain(":");
      expect(encrypted.split(":")).toHaveLength(3); // iv : authTag : cipher

      const decrypted = decryptSecret(encrypted);
      expect(decrypted).toBe(secretApiKey);
    });

    it("should fail gracefully or throw on invalid ciphertext format", () => {
      expect(() => decryptSecret("invalid-cipher-text")).toThrow("Invalid ciphertext format");
    });

    it("should return empty string when empty input is provided", () => {
      expect(encryptSecret("")).toBe("");
      expect(decryptSecret("")).toBe("");
    });
  });
});
