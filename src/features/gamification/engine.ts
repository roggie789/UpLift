/**
 * Gamification engine — pure TypeScript, no UI or storage dependencies.
 * Formulas match the Gamification Design doc on the Miro planning board.
 */

export interface SetInput {
  weightKg: number;
  reps: number;
}

export interface ExerciseBests {
  maxWeightKg: number;
  maxReps: number;
}

export type PrType = 'weight' | 'reps';

export interface PrResult {
  type: PrType;
  value: number;
}

const BASE_SET_XP = 10;
const VOLUME_BONUS_CAP = 20;
const PR_BONUS = 50;
const COMPLETION_BONUS = 100;
const MAX_STREAK_MULTIPLIER = 2.0;

export function xpForSet(set: SetInput, prsHit: number): number {
  const volumeBonus = Math.min((set.weightKg * set.reps) / 100, VOLUME_BONUS_CAP);
  return Math.round(BASE_SET_XP + volumeBonus + prsHit * PR_BONUS);
}

export function completionBonus(streakMultiplier: number): number {
  return Math.round(COMPLETION_BONUS * clampMultiplier(streakMultiplier));
}

export function streakMultiplier(consecutiveQualifyingWeeks: number): number {
  return clampMultiplier(1 + 0.1 * consecutiveQualifyingWeeks);
}

function clampMultiplier(m: number): number {
  return Math.min(Math.max(m, 1), MAX_STREAK_MULTIPLIER);
}

/** XP required to go from level n-1 to level n: 100 * n^1.5 */
export function xpForLevel(level: number): number {
  return Math.round(100 * Math.pow(level, 1.5));
}

export function levelFromTotalXp(totalXp: number): { level: number; intoLevel: number; needed: number } {
  let level = 1;
  let remaining = totalXp;
  while (remaining >= xpForLevel(level + 1)) {
    remaining -= xpForLevel(level + 1);
    level += 1;
  }
  return { level, intoLevel: remaining, needed: xpForLevel(level + 1) };
}

/** Detects new personal records for a completed set against known bests. */
export function detectPrs(set: SetInput, bests: ExerciseBests | undefined): PrResult[] {
  if (!bests) {
    // First time doing this exercise: both are records
    return [
      { type: 'weight', value: set.weightKg },
      { type: 'reps', value: set.reps },
    ];
  }
  const prs: PrResult[] = [];
  if (set.weightKg > bests.maxWeightKg) prs.push({ type: 'weight', value: set.weightKg });
  if (set.reps > bests.maxReps) prs.push({ type: 'reps', value: set.reps });
  return prs;
}
