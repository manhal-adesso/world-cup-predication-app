import { describe, expect, it } from "vitest";

import { deriveWinner, scorePrediction } from "./scoring";

describe("scorePrediction", () => {
  it("returns 0 when match has no result yet", () => {
    expect(
      scorePrediction({
        predictedWinner: "home",
        predictedHomeScore: 2,
        predictedAwayScore: 1,
        actualWinner: null,
        actualHomeScore: null,
        actualAwayScore: null,
      })
    ).toEqual({ winnerPoints: 0, exactScorePoints: 0, total: 0 });
  });

  it("awards 4 points for exact correct prediction", () => {
    expect(
      scorePrediction({
        predictedWinner: "home",
        predictedHomeScore: 2,
        predictedAwayScore: 1,
        actualWinner: "home",
        actualHomeScore: 2,
        actualAwayScore: 1,
      }).total
    ).toBe(4);
  });

  it("awards 1 point for correct winner but wrong score", () => {
    expect(
      scorePrediction({
        predictedWinner: "home",
        predictedHomeScore: 3,
        predictedAwayScore: 1,
        actualWinner: "home",
        actualHomeScore: 2,
        actualAwayScore: 1,
      }).total
    ).toBe(1);
  });

  it("awards 0 points when winner is wrong", () => {
    expect(
      scorePrediction({
        predictedWinner: "home",
        predictedHomeScore: 2,
        predictedAwayScore: 1,
        actualWinner: "away",
        actualHomeScore: 0,
        actualAwayScore: 1,
      }).total
    ).toBe(0);
  });

  it("awards 4 points for correct draw with exact score", () => {
    expect(
      scorePrediction({
        predictedWinner: "draw",
        predictedHomeScore: 1,
        predictedAwayScore: 1,
        actualWinner: "draw",
        actualHomeScore: 1,
        actualAwayScore: 1,
      }).total
    ).toBe(4);
  });
});

describe("deriveWinner", () => {
  it("home wins", () => expect(deriveWinner(2, 1)).toBe("home"));
  it("away wins", () => expect(deriveWinner(0, 1)).toBe("away"));
  it("draw",     () => expect(deriveWinner(2, 2)).toBe("draw"));
});
