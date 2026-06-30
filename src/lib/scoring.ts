/**
 * Pure scoring service. Used by client UI (to show "potential points"),
 * by API routes, and exercised by unit tests. Mirrors the SQL function
 * `public.score_prediction` so client and DB always agree.
 *
 *   +1 for correct winner
 *   +3 for exact score (winner points are still awarded)
 *   max 4 points per match
 */

import type { MatchWinner } from "@/types/database";

export interface ScoreInput {
  predictedWinner: MatchWinner;
  predictedHomeScore: number;
  predictedAwayScore: number;
  actualWinner: MatchWinner | null;
  actualHomeScore: number | null;
  actualAwayScore: number | null;
  predictedPenaltyHome?: number | null;
  predictedPenaltyAway?: number | null;
  actualPenaltyHome?: number | null;
  actualPenaltyAway?: number | null;
}

export interface ScoreBreakdown {
  winnerPoints: number;
  exactScorePoints: number;
  total: number;
}

export function scorePrediction(input: ScoreInput): ScoreBreakdown {
  const {
    predictedWinner,
    predictedHomeScore,
    predictedAwayScore,
    actualWinner,
    actualHomeScore,
    actualAwayScore,
    predictedPenaltyHome,
    predictedPenaltyAway,
    actualPenaltyHome,
    actualPenaltyAway,
  } = input;

  if (
    actualWinner === null ||
    actualHomeScore === null ||
    actualAwayScore === null
  ) {
    return { winnerPoints: 0, exactScorePoints: 0, total: 0 };
  }

  const wentToPenalties = actualPenaltyHome != null && actualPenaltyAway != null;

  let winnerPoints: number;
  let exactScorePoints: number;

  if (wentToPenalties) {
    winnerPoints =
      predictedWinner === actualWinner || predictedWinner === "draw" ? 1 : 0;
    exactScorePoints =
      predictedPenaltyHome === actualPenaltyHome &&
      predictedPenaltyAway === actualPenaltyAway
        ? 3
        : 0;
  } else {
    winnerPoints = predictedWinner === actualWinner ? 1 : 0;
    exactScorePoints =
      predictedHomeScore === actualHomeScore &&
      predictedAwayScore === actualAwayScore
        ? 3
        : 0;
  }

  return { winnerPoints, exactScorePoints, total: winnerPoints + exactScorePoints };
}

export function deriveWinner(
  homeScore: number,
  awayScore: number,
  penaltyHome?: number | null,
  penaltyAway?: number | null,
): MatchWinner {
  if (penaltyHome != null && penaltyAway != null) {
    if (penaltyHome > penaltyAway) return "home";
    if (penaltyHome < penaltyAway) return "away";
  }
  if (homeScore > awayScore) return "home";
  if (homeScore < awayScore) return "away";
  return "draw";
}
