export interface DamageParams {
  level: number;
  movePower: number;
  attack: number;
  defense: number;
  // 本編準拠の sequential floor で適用する modifier の列。1要素でも 0 を含む場合は全体ダメージ 0。
  modifierList: number[];
}

export interface DamageRange {
  rolls: number[];
  min: number;
  max: number;
}

export function calculateBaseDamage(p: { level: number; movePower: number; attack: number; defense: number }): number {
  const a = Math.floor((2 * p.level) / 5) + 2;
  const b = Math.floor((a * p.movePower * p.attack) / p.defense);
  return Math.floor(b / 50) + 2;
}

export function calculateDamageRange(p: DamageParams): DamageRange {
  const base = calculateBaseDamage(p);
  const hasZero = p.modifierList.some((m) => m === 0);
  const rolls: number[] = [];
  for (let r = 85; r <= 100; r++) {
    if (hasZero) {
      rolls.push(0);
      continue;
    }
    // 本編準拠: ランダム → STAB → タイプ相性 → 天候 → ... の順で各乗算ごとに floor
    let d = Math.floor((base * r) / 100);
    for (const m of p.modifierList) {
      d = Math.floor(d * m);
    }
    rolls.push(Math.max(1, d));
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
