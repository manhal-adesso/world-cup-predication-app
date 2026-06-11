import { test, expect, ADMIN_EMAIL, ADMIN_PASSWORD, login } from "./fixtures";

test.describe("Admin user", () => {
  test("can sign in and reach dashboard", async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
  });

  test("can access /admin overview", async ({ adminPage: page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin(\/|$)/);
    // Overview shows the stat cards: Users, Matches, Pending matches, etc.
    await expect(page.getByText("Users", { exact: true })).toBeVisible();
    await expect(page.getByText("Matches", { exact: true })).toBeVisible();
    await expect(page.getByText(/Predictions submitted/i)).toBeVisible();
  });

  test("can access /admin/matches", async ({ adminPage: page }) => {
    const res = await page.goto("/admin/matches");
    expect(res?.status()).toBeLessThan(400);
    await expect(page).toHaveURL(/\/admin\/matches/);
  });

  test("can access /admin/users", async ({ adminPage: page }) => {
    const res = await page.goto("/admin/users");
    expect(res?.status()).toBeLessThan(400);
    await expect(page).toHaveURL(/\/admin\/users/);
  });

  test("can access /admin/results", async ({ adminPage: page }) => {
    const res = await page.goto("/admin/results");
    expect(res?.status()).toBeLessThan(400);
    await expect(page).toHaveURL(/\/admin\/results/);
  });

  test("can access /admin/import", async ({ adminPage: page }) => {
    const res = await page.goto("/admin/import");
    expect(res?.status()).toBeLessThan(400);
    await expect(page).toHaveURL(/\/admin\/import/);
  });

  test("admin API rejects unauthenticated POST", async ({ request }) => {
    const res = await request.post("/api/admin/matches", {
      data: {
        home_team: "X",
        away_team: "Y",
        kickoff_time: new Date(Date.now() + 86_400_000).toISOString(),
      },
    });
    expect([401, 403]).toContain(res.status());
  });
});
