export interface DamageParams {
  level: number;
  movePower: number;
  attack: number;
  defense: number;
  modifiers: number;
}

export interface DamageRange {
  rolls: number[];
  min: number;
  max: number;
}

export function calculateBaseDamage(p: DamageParams): number {
  const a = Math.floor((2 * p.level) / 5) + 2;
  const b = Math.floor((a * p.movePower * p.attack) / p.defense);
  return Math.floor(b / 50) + 2;
}

export function applyModifiersAndRoll(
  base: number,
  modifiers: number,
  randPercent: number,
): number {
  if (modifiers === 0) return 0;
  const withMod = Math.floor(base * modifiers);
  return Math.max(1, Math.floor((withMod * randPercent) / 100));
}

export function calculateDamageRange(p: DamageParams): DamageRange {
  const base = calculateBaseDamage(p);
  const rolls: number[] = [];
  for (let r = 85; r <= 100; r++) {
    rolls.push(applyModifiersAndRoll(base, p.modifiers, r));
  }
  return { rolls, min: rolls[0], max: rolls[rolls.length - 1] };
}

export function hitsToKO(damageRange: DamageRange, defenderHp: number): {
  guaranteed: number;
  best: number;
  worst: number;
} {
  const worst = Math.ceil(defenderHp / damageRange.min);
  const best = Math.ceil(defenderHp / damageRange.max);
  return { guaranteed: worst, best, worst };
}
