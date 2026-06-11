import { test, expect } from "./fixtures";

test.describe("Prediction flow", () => {
  test("user can submit or update a prediction for an upcoming match", async ({
    userPage: page,
  }) => {
    await page.goto("/matches");

    // The matches page has Upcoming / Past tabs; make sure Upcoming is active.
    const upcomingTab = page.getByRole("tab", { name: /upcoming/i });
    if (await upcomingTab.isVisible()) {
      await upcomingTab.click();
    }

    // Each MatchCard is a Link to /matches/<id>
    const firstMatchLink = page
      .locator('a[href^="/matches/"]')
      .filter({ hasNot: page.locator("text=/^All matches$/i") })
      .first();

    if ((await firstMatchLink.count()) === 0) {
      test.skip(true, "No upcoming matches present in the database");
    }

    await firstMatchLink.click();
    await page.waitForURL(/\/matches\/[\w-]+/);

    // If the match is already locked, the form is replaced with an alert.
    const lockedAlert = page.getByText(/predictions for this match are locked/i);
    if (await lockedAlert.isVisible().catch(() => false)) {
      test.skip(true, "First upcoming match is already locked");
    }

    const homeInput = page.locator("#home");
    const awayInput = page.locator("#away");
    await expect(homeInput).toBeVisible({ timeout: 10_000 });
    await expect(awayInput).toBeVisible();

    // Pick scores that satisfy the DB consistency check (home > away => winner=home).
    await homeInput.fill("3");
    await awayInput.fill("1");

    const submitBtn = page.getByRole("button", {
      name: /save prediction|update prediction/i,
    });
    await submitBtn.click();

    // Success alert (variant=success) or page refresh with updated form.
    await expect(
      page.getByText(/prediction saved/i).or(
        page.getByRole("button", { name: /update prediction/i })
      )
    ).toBeVisible({ timeout: 15_000 });
  });

  test("unauthenticated POST to /api/predictions is rejected", async ({
    request,
  }) => {
    const res = await request.post("/api/predictions", {
      data: {
        matchId: "00000000-0000-0000-0000-000000000000",
        predictedWinner: "home",
        predictedHomeScore: 1,
        predictedAwayScore: 0,
      },
    });
    expect([401, 403]).toContain(res.status());
  });
});
