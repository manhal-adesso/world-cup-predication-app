import { test as base, expect, type Page } from "@playwright/test";

export const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "ali.manhal@adesso.in";
export const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "admin@1234";
export const USER_EMAIL = process.env.E2E_USER_EMAIL ?? "testuser@example.com";
export const USER_PASSWORD = process.env.E2E_USER_PASSWORD ?? "Test@1234";

/**
 * Logs in via the /login form and waits to leave the /login page.
 *
 * Diagnostics: captures Supabase auth network responses so a failure here
 * surfaces the actual API response body instead of a vague timeout.
 */
export async function login(page: Page, email: string, password: string) {
  const supabaseLog: { status: number; url: string; body: string }[] = [];
  page.on("response", async (resp) => {
    const url = resp.url();
    if (url.includes("supabase.co/auth/")) {
      let body = "";
      try {
        body = (await resp.text()).slice(0, 300);
      } catch {
        /* ignore */
      }
      supabaseLog.push({ status: resp.status(), url, body });
    }
  });

  await page.goto("/login", { waitUntil: "domcontentloaded" });
  // The Sign In button is disabled until React hydrates (useHydrated hook),
  // so waiting for it to be enabled guarantees the onSubmit handler is wired.
  const signInButton = page.getByRole("button", { name: "Sign in" });
  await expect(signInButton).toBeEnabled({ timeout: 15_000 });

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);

  const tokenResponse = page
    .waitForResponse(
      (r) => r.url().includes("/auth/v1/token") && r.request().method() === "POST",
      { timeout: 20_000 }
    )
    .catch(() => null);

  await signInButton.click();
  const resp = await tokenResponse;

  if (resp && resp.status() >= 400) {
    const body = await resp.text().catch(() => "");
    throw new Error(
      `Supabase auth rejected login for ${email}: HTTP ${resp.status()} ${body}`
    );
  }

  try {
    await page.waitForURL((url) => !url.pathname.startsWith("/login"), {
      timeout: 15_000,
    });
  } catch (err) {
    const alertText = await page
      .getByRole("alert")
      .first()
      .innerText()
      .catch(() => "(no alert visible)");
    throw new Error(
      `Login for ${email} did not leave /login. Alert: ${alertText}. ` +
        `Supabase calls: ${JSON.stringify(supabaseLog)}. Original: ${(err as Error).message}`
    );
  }
}

export const test = base.extend<{
  adminPage: Page;
  userPage: Page;
}>({
  adminPage: async ({ page }, use) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await use(page);
  },
  userPage: async ({ page }, use) => {
    await login(page, USER_EMAIL, USER_PASSWORD);
    await use(page);
  },
});

export { expect };
