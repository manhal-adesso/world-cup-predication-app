import { test, expect } from "./fixtures";

test.describe("Anonymous visitor", () => {
  test("home page renders", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/.+/);
    // Anonymous header has a "Log in" link.
    await expect(page.getByRole("link", { name: "Log in" })).toBeVisible();
  });

  test("protected route /dashboard redirects to /login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login(\?|$)/);
  });

  test("protected route /admin redirects to /login", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login(\?|$)/);
  });

  test("login page renders form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  });

  test("invalid login shows error", async ({ page }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    const signInButton = page.getByRole("button", { name: "Sign in" });
    await expect(signInButton).toBeEnabled({ timeout: 15_000 });

    await page.getByLabel("Email").fill("nobody-does-not-exist@example.com");
    await page.getByLabel("Password", { exact: true }).fill("definitely-wrong-1");

    const tokenResp = page.waitForResponse(
      (r) => r.url().includes("/auth/v1/token") && r.request().method() === "POST",
      { timeout: 20_000 }
    );
    await signInButton.click();
    const resp = await tokenResp;
    expect(resp.status()).toBeGreaterThanOrEqual(400);

    await expect(page.getByRole("alert").first()).toBeVisible({ timeout: 10_000 });
    await expect(page).toHaveURL(/\/login/);
  });
});
