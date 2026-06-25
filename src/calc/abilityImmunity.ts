import type { PokemonType } from '../data/types';

// 防御側特性によるタイプ無効化。
// 攻撃側に「かたやぶり」がある場合は無効化を無視する（呼び出し側で制御）。
// 音技無効（ぼうおん）は move フラグが必要なため別途扱い、ここでは未対応。
const TYPE_IMMUNITY_BY_ABILITY: Record<string, PokemonType[]> = {
  // じめん無効
  levitate: ['ground'],
  // みず無効
  'water-absorb': ['water'],
  'dry-skin': ['water'],
  'storm-drain': ['water'],
  // でんき無効
  'volt-absorb': ['electric'],
  'lightning-rod': ['electric'],
  'motor-drive': ['electric'],
  // ほのお無効
  'flash-fire': ['fire'],
  // くさ無効
  'sap-sipper': ['grass'],
};

export function isAbilityImmune(
  moveType: PokemonType,
  defenderAbility: string | undefined,
): boolean {
  if (!defenderAbility) return false;
  const types = TYPE_IMMUNITY_BY_ABILITY[defenderAbility];
  return !!types && types.includes(moveType);
}

// 攻撃側「かたやぶり」（mold-breaker）など特性無視系の判定。
// 現状はかたやぶりのみ対応。テラバーストやかちきなどの細かい挙動は未対応。
const ABILITY_IGNORERS = new Set(['mold-breaker', 'turboblaze', 'teravolt']);

export function ignoresDefenderAbility(attackerAbility: string | undefined): boolean {
  if (!attackerAbility) return false;
  return ABILITY_IGNORERS.has(attackerAbility);
}
