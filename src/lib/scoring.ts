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
  } = input;

  if (
    actualWinner === null ||
    actualHomeScore === null ||
    actualAwayScore === null
  ) {
    return { winnerPoints: 0, exactScorePoints: 0, total: 0 };
  }

  const winnerPoints = predictedWinner === actualWinner ? 1 : 0;
  const exactScorePoints =
    predictedHomeScore === actualHomeScore &&
    predictedAwayScore === actualAwayScore
      ? 3
      : 0;

  return { winnerPoints, exactScorePoints, total: winnerPoints + exactScorePoints };
}

export function deriveWinner(homeScore: number, awayScore: number): MatchWinner {
  if (homeScore > awayScore) return "home";
  if (homeScore < awayScore) return "away";
  return "draw";
}
