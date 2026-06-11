import { test, expect } from "./fixtures";

test.describe("Non-admin user", () => {
  test("can reach dashboard", async ({ userPage: page }) => {
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
  });

  test("is redirected away from /admin", async ({ userPage: page }) => {
    await page.goto("/admin");
    // requireAdmin() redirects non-admins to /dashboard
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("is redirected away from /admin/users", async ({ userPage: page }) => {
    await page.goto("/admin/users");
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("can see matches page", async ({ userPage: page }) => {
    await page.goto("/matches");
    await expect(page).toHaveURL(/\/matches/);
    await expect(page.getByRole("heading", { name: /all matches/i })).toBeVisible();
  });

  test("can see leaderboard", async ({ userPage: page }) => {
    await page.goto("/leaderboard");
    await expect(page).toHaveURL(/\/leaderboard/);
  });

  test("can see leagues page", async ({ userPage: page }) => {
    await page.goto("/leagues");
    await expect(page).toHaveURL(/\/leagues/);
  });

  test("can see profile page", async ({ userPage: page }) => {
    await page.goto("/profile");
    await expect(page).toHaveURL(/\/profile/);
  });
});
