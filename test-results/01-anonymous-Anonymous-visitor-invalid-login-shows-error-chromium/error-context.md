# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 01-anonymous.spec.ts >> Anonymous visitor >> invalid login shows error
- Location: e2e\01-anonymous.spec.ts:28:7

# Error details

```
Error: expect(locator).toBeEnabled() failed

Locator:  getByRole('button', { name: 'Sign in' })
Expected: enabled
Received: disabled
Timeout:  15000ms

Call log:
  - Expect "toBeEnabled" with timeout 15000ms
  - waiting for getByRole('button', { name: 'Sign in' })
    33 × locator resolved to <button disabled type="submit" class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full">Sign in</button>
       - unexpected value "disabled"

```

```yaml
- button "Sign in" [disabled]
```

# Test source

```ts
  1  | import { test, expect } from "./fixtures";
  2  | 
  3  | test.describe("Anonymous visitor", () => {
  4  |   test("home page renders", async ({ page }) => {
  5  |     await page.goto("/");
  6  |     await expect(page).toHaveTitle(/.+/);
  7  |     // Anonymous header has a "Log in" link.
  8  |     await expect(page.getByRole("link", { name: "Log in" })).toBeVisible();
  9  |   });
  10 | 
  11 |   test("protected route /dashboard redirects to /login", async ({ page }) => {
  12 |     await page.goto("/dashboard");
  13 |     await expect(page).toHaveURL(/\/login(\?|$)/);
  14 |   });
  15 | 
  16 |   test("protected route /admin redirects to /login", async ({ page }) => {
  17 |     await page.goto("/admin");
  18 |     await expect(page).toHaveURL(/\/login(\?|$)/);
  19 |   });
  20 | 
  21 |   test("login page renders form", async ({ page }) => {
  22 |     await page.goto("/login");
  23 |     await expect(page.getByLabel("Email")).toBeVisible();
  24 |     await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
  25 |     await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  26 |   });
  27 | 
  28 |   test("invalid login shows error", async ({ page }) => {
  29 |     await page.goto("/login", { waitUntil: "domcontentloaded" });
  30 |     const signInButton = page.getByRole("button", { name: "Sign in" });
> 31 |     await expect(signInButton).toBeEnabled({ timeout: 15_000 });
     |                                ^ Error: expect(locator).toBeEnabled() failed
  32 | 
  33 |     await page.getByLabel("Email").fill("nobody-does-not-exist@example.com");
  34 |     await page.getByLabel("Password", { exact: true }).fill("definitely-wrong-1");
  35 | 
  36 |     const tokenResp = page.waitForResponse(
  37 |       (r) => r.url().includes("/auth/v1/token") && r.request().method() === "POST",
  38 |       { timeout: 20_000 }
  39 |     );
  40 |     await signInButton.click();
  41 |     const resp = await tokenResp;
  42 |     expect(resp.status()).toBeGreaterThanOrEqual(400);
  43 | 
  44 |     await expect(page.getByRole("alert").first()).toBeVisible({ timeout: 10_000 });
  45 |     await expect(page).toHaveURL(/\/login/);
  46 |   });
  47 | });
  48 | 
```