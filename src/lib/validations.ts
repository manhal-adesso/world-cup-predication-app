import { z } from "zod";

export const winnerEnum = z.enum(["home", "away", "draw"]);

export const predictionSchema = z
  .object({
    matchId: z.string().uuid(),
    predictedWinner: winnerEnum,
    predictedHomeScore: z.coerce.number().int().min(0).max(30),
    predictedAwayScore: z.coerce.number().int().min(0).max(30),
  })
  .refine(
    (v) =>
      (v.predictedHomeScore >  v.predictedAwayScore && v.predictedWinner === "home") ||
      (v.predictedHomeScore <  v.predictedAwayScore && v.predictedWinner === "away") ||
      (v.predictedHomeScore === v.predictedAwayScore && v.predictedWinner === "draw"),
    { message: "Winner must match the score line", path: ["predictedWinner"] }
  );

export type PredictionInput = z.infer<typeof predictionSchema>;

export const matchResultSchema = z.object({
  matchId: z.string().uuid(),
  homeScore: z.coerce.number().int().min(0).max(30),
  awayScore: z.coerce.number().int().min(0).max(30),
});

export const createLeagueSchema = z.object({
  name: z.string().trim().min(3).max(60),
});

export const joinLeagueSchema = z.object({
  inviteCode: z
    .string()
    .trim()
    .min(4)
    .max(12)
    .transform((v) => v.toUpperCase()),
});

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
});

export const signUpSchema = signInSchema.extend({
  displayName: z.string().trim().min(2).max(40),
}).refine(
  (v) => v.email.includes("@adesso."),
  { message: "Only @adesso email addresses are allowed to register.", path: ["email"] }
);

export const resetRequestSchema = z.object({ email: z.string().email() });

export const updateProfileSchema = z.object({
  displayName: z.string().trim().min(2).max(40),
  avatarUrl: z.string().url().optional().or(z.literal("")),
});

export const changePasswordSchema = z
  .object({
    newPassword: z.string().min(8).max(72),
    confirmPassword: z.string().min(8).max(72),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
