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

// 音技固定リスト（ダメージ技中心）。ぼうおんはこれらを無効化する。
const SOUND_MOVES = new Set([
  'hyper-voice',
  'boomburst',
  'echoed-voice',
  'snore',
  'round',
  'relic-song',
  'chatter',
  'bug-buzz',
  'disarming-voice',
  'overdrive',
  'snarl',
  'uproar',
  'clanging-scales',
  'clangorous-soulblaze',
  'clangorous-soul',
  'sparkling-aria',
  'eerie-spell',
  'torch-song',
  'alluring-voice',
  'psychic-noise',
]);

export function isSoundMove(moveName: string | undefined): boolean {
  return !!moveName && SOUND_MOVES.has(moveName);
}

export function isSoundproofImmune(
  ability: string | undefined,
  moveName: string | undefined,
): boolean {
  return ability === 'soundproof' && isSoundMove(moveName);
}

// 攻撃側特性によるダメージ倍率。
// もらいび（flash-fire）: 発動済みのとき、ほのお技ダメージ ×1.5。
// ちからもち（huge-power）／ヨガパワー（pure-power）: 物理技ダメージ ×2。
export function getAttackerAbilityBoost(
  attackerAbility: string | undefined,
  moveType: import('../data/types').PokemonType,
  category: import('../data/types').MoveCategory,
  flashFireActive: boolean,
): number {
  let mod = 1;
  if (attackerAbility === 'flash-fire' && flashFireActive && moveType === 'fire') mod *= 1.5;
  if (
    (attackerAbility === 'huge-power' || attackerAbility === 'pure-power') &&
    category === 'physical'
  )
    mod *= 2;
  return mod;
}

// 防御側特性によるタイプ半減（無効ではない）。
// あついしぼう（thick-fat）: ほのお/こおり 0.5倍
// プリズムアーマー / フィルター / ハードロック: 効果バツグンを 0.75倍（攻撃側の弱点突きを軽減）
// パンクロック（防御側）: 音技 0.5倍
export function getDefenderAbilityHalveModifier(
  moveType: import('../data/types').PokemonType,
  defenderAbility: string | undefined,
  typeEffectiveness: number,
  moveName: string | undefined,
): number {
  if (!defenderAbility) return 1;
  if (defenderAbility === 'thick-fat' && (moveType === 'fire' || moveType === 'ice')) return 0.5;
  if (defenderAbility === 'punk-rock' && isSoundMove(moveName)) return 0.5;
  if (
    (defenderAbility === 'filter' ||
      defenderAbility === 'solid-rock' ||
      defenderAbility === 'prism-armor') &&
    typeEffectiveness > 1
  ) {
    return 0.75;
  }
  return 1;
}
