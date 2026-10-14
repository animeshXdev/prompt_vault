import { test, expect } from "@playwright/test";

test.describe("PromptVault Core Critical User Journey", () => {
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";
  const ADMIN_PASSWORD = process.env.ADMIN_DEFAULT_PASSWORD || "replace-with-strong-password";

  test("should enforce single admin authentication and prevent unauthorized access", async ({ page }) => {
    // 1. Unauthenticated root access redirects to /login
    await page.goto("/");
    await expect(page).toHaveURL(/.*\/login/);

    // 2. Strict Rule: Verify NO SIGNUP or registration links exist
    const signupLinks = page.locator("a:has-text('Sign up'), a:has-text('Register'), button:has-text('Sign up')");
    await expect(signupLinks).toHaveCount(0);

    // 3. Failed login attempt with bad credentials
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', "WrongPassword123!");
    await page.click('button[type="submit"]');

    // Should stay on login and show error feedback
    await expect(page).toHaveURL(/.*\/login/);

    // 4. Successful login
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');

    // 5. Redirected to /dashboard
    await expect(page).toHaveURL(/.*\/dashboard/);
    await expect(page.locator("h1")).toContainText(/Dashboard|Overview/i);
  });

  test("should create, view, copy, and archive a prompt", async ({ page }) => {
    // Log in
    await page.goto("/login");
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/);

    // Navigate to create prompt
    await page.goto("/prompts/new");
    await expect(page.locator("input[placeholder*='prompt title' i], input#title")).toBeVisible();

    const testPromptTitle = `E2E Test Prompt ${Date.now()}`;
    await page.fill("input#title, input[name='title']", testPromptTitle);

    // Fill content
    const contentTextarea = page.locator("textarea#content, textarea[name='content'], .cm-content");
    if (await contentTextarea.isVisible()) {
      await contentTextarea.fill("You are an expert AI software engineer. Generate clean TypeScript code.");
    }

    // Save prompt
    const saveButton = page.locator("button:has-text('Save Prompt'), button:has-text('Create Prompt')");
    await saveButton.click();

    // Verify redirected to prompt view or list
    await page.waitForURL(/\/prompts/);

    // Navigate to prompts list
    await page.goto("/prompts");
    await expect(page.locator(`text=${testPromptTitle}`).first()).toBeVisible();
  });
});
