import type {
  BattleFormat,
  Field,
  MoveCategory,
  PokemonType,
  Screen,
  Status,
  Weather,
} from '../data/types';

export function getWeatherModifier(moveType: PokemonType, weather: Weather): number {
  if (weather === 'sun') {
    if (moveType === 'fire') return 1.5;
    if (moveType === 'water') return 0.5;
  }
  if (weather === 'rain') {
    if (moveType === 'water') return 1.5;
    if (moveType === 'fire') return 0.5;
  }
  return 1;
}

// 天候による防御側の防御/特防補正。
// 砂嵐：いわタイプの特防×1.5（受けるのが特殊技の時）
// 雪：こおりタイプの防御×1.5（受けるのが物理技の時）
export function getWeatherDefenseModifier(
  weather: Weather,
  defenderTypes: PokemonType[],
  category: MoveCategory,
): number {
  if (weather === 'sand' && category === 'special' && defenderTypes.includes('rock')) return 1.5;
  if (weather === 'snow' && category === 'physical' && defenderTypes.includes('ice')) return 1.5;
  return 1;
}

// 天候スリップ判定。砂嵐は いわ/じめん/はがね 以外が毎ターン最大HPの1/16ダメージ。
// 雪・晴れ・雨はスリップなし。
export function isWeatherSlipped(weather: Weather, types: PokemonType[]): boolean {
  if (weather !== 'sand') return false;
  return !types.some((t) => t === 'rock' || t === 'ground' || t === 'steel');
}

export function getFieldModifier(
  moveType: PokemonType,
  field: Field,
  isAttackerGrounded = true,
  isDefenderGrounded = true,
): number {
  if (field === 'electric' && moveType === 'electric' && isAttackerGrounded) return 1.3;
  if (field === 'grass' && moveType === 'grass' && isAttackerGrounded) return 1.3;
  if (field === 'psychic' && moveType === 'psychic' && isAttackerGrounded) return 1.3;
  if (field === 'misty' && moveType === 'dragon' && isDefenderGrounded) return 0.5;
  if (field === 'grass' && isDefenderGrounded) {
    if (moveType === 'ground') return 0.5;
  }
  return 1;
}

export function getCriticalModifier(isCritical: boolean): number {
  return isCritical ? 1.5 : 1;
}

// 範囲技補正。ダブルで複数体に当たる技は ×0.75。対象種別が all-opponents（相手全体）/
// all-other-pokemon（自分以外全体）の技が該当する。
const SPREAD_TARGETS = new Set(['all-opponents', 'all-other-pokemon']);

export function getSpreadModifier(
  moveTarget: string | undefined,
  format: BattleFormat,
): number {
  if (format !== 'double' || !moveTarget) return 1;
  return SPREAD_TARGETS.has(moveTarget) ? 0.75 : 1;
}

// 壁補正。急所は壁を貫通するため軽減しない。倍率はシングル×1/2、ダブル×2732/4096。
export function getScreenModifier(
  screen: Screen,
  category: MoveCategory,
  isCritical: boolean,
  format: BattleFormat,
): number {
  if (isCritical || screen === 'none') return 1;
  const applies =
    screen === 'aurora-veil' ||
    (screen === 'reflect' && category === 'physical') ||
    (screen === 'light-screen' && category === 'special');
  if (!applies) return 1;
  return format === 'double' ? 2732 / 4096 : 0.5;
}

export function getBurnModifier(
  attackerStatus: Status,
  category: MoveCategory,
  attackerAbility?: string,
  attackerTypes?: PokemonType[],
): number {
  // ほのおタイプはやけど無効（攻撃半減なし）
  if (attackerTypes?.includes('fire')) return 1;
  if (
    attackerStatus === 'burn' &&
    category === 'physical' &&
    attackerAbility !== 'guts'
  ) {
    return 0.5;
  }
  return 1;
}

const PINCH_ABILITIES: Record<string, PokemonType> = {
  blaze: 'fire',
  torrent: 'water',
  overgrow: 'grass',
  swarm: 'bug',
};

export function getPinchAbilityModifier(
  attackerAbility: string | undefined,
  moveType: PokemonType,
  attackerHpRatio: number,
): number {
  if (!attackerAbility) return 1;
  const target = PINCH_ABILITIES[attackerAbility];
  if (target && target === moveType && attackerHpRatio <= 1 / 3) return 1.5;
  return 1;
}

const TYPE_BOOST_ITEMS: Record<string, { type: PokemonType; mult: number }> = {
  charcoal: { type: 'fire', mult: 1.2 },
  'mystic-water': { type: 'water', mult: 1.2 },
  'miracle-seed': { type: 'grass', mult: 1.2 },
  magnet: { type: 'electric', mult: 1.2 },
  'never-melt-ice': { type: 'ice', mult: 1.2 },
  'black-belt': { type: 'fighting', mult: 1.2 },
  'poison-barb': { type: 'poison', mult: 1.2 },
  'soft-sand': { type: 'ground', mult: 1.2 },
  'sharp-beak': { type: 'flying', mult: 1.2 },
  'twisted-spoon': { type: 'psychic', mult: 1.2 },
  'silver-powder': { type: 'bug', mult: 1.2 },
  'hard-stone': { type: 'rock', mult: 1.2 },
  'spell-tag': { type: 'ghost', mult: 1.2 },
  'dragon-fang': { type: 'dragon', mult: 1.2 },
  'black-glasses': { type: 'dark', mult: 1.2 },
  'metal-coat': { type: 'steel', mult: 1.2 },
  'fairy-feather': { type: 'fairy', mult: 1.2 },
  'silk-scarf': { type: 'normal', mult: 1.2 },
};

export function getAttackerItemModifier(
  item: string | undefined,
  moveType: PokemonType,
  category: MoveCategory,
  isTypeEffective: boolean,
): number {
  if (!item) return 1;
  if (item === 'life-orb') return 1.3;
  if (item === 'choice-band' && category === 'physical') return 1.5;
  if (item === 'choice-specs' && category === 'special') return 1.5;
  if (item === 'expert-belt' && isTypeEffective) return 1.2;
  const boost = TYPE_BOOST_ITEMS[item];
  if (boost && boost.type === moveType) return boost.mult;
  return 1;
}

const HALVE_BERRY: Record<string, PokemonType> = {
  'occa-berry': 'fire',
  'passho-berry': 'water',
  'wacan-berry': 'electric',
  'rindo-berry': 'grass',
  'yache-berry': 'ice',
  'chople-berry': 'fighting',
  'kebia-berry': 'poison',
  'shuca-berry': 'ground',
  'coba-berry': 'flying',
  'payapa-berry': 'psychic',
  'tanga-berry': 'bug',
  'charti-berry': 'rock',
  'kasib-berry': 'ghost',
  'haban-berry': 'dragon',
  'colbur-berry': 'dark',
  'babiri-berry': 'steel',
  'roseli-berry': 'fairy',
};

// 半減きのみ：技タイプが対応タイプかつ効果バツグン(typeEffectiveness > 1)で ×0.5。
// chilan-berry：ノーマル技のみ効果関係なく×0.5。
export function getDefenderItemModifier(
  item: string | undefined,
  moveType: PokemonType,
  typeEffectiveness: number,
): number {
  if (!item) return 1;
  if (item === 'chilan-berry' && moveType === 'normal') return 0.5;
  const berryType = HALVE_BERRY[item];
  if (berryType && berryType === moveType && typeEffectiveness > 1) return 0.5;
  return 1;
}

export interface ModifierContext {
  moveType: PokemonType;
  category: MoveCategory;
  attackerTypes: PokemonType[];
  defenderTypes: PokemonType[];
  attackerAbility?: string;
  defenderAbility?: string;
  attackerItem?: string;
  defenderItem?: string;
  attackerStatus: Status;
  attackerHpRatio: number;
  weather: Weather;
  field: Field;
  screen: Screen;
  format: BattleFormat;
  moveTarget?: string;
  // PokeAPI英語名（音技判定などに使用）
  moveName?: string;
  isCritical: boolean;
  isAttackerGrounded?: boolean;
  isDefenderGrounded?: boolean;
  // ミミッキュのばけのかわが残っている状態。true なら全ての攻撃技を無効化
  disguiseActive?: boolean;
  // もらいびが発動済みかどうか（攻撃側がもらいび特性のとき）
  attackerFlashFireActive?: boolean;
  // 変幻自在/リベロ 発動済み時の変化後タイプ（''=未選択）
  attackerProteanType?: import('../data/types').PokemonType | '';
  // 防御側の変幻自在/リベロ 発動済み時の変化後タイプ（''=未選択）
  defenderProteanType?: import('../data/types').PokemonType | '';
  // はねやすめ使用中（攻撃側）
  attackerRoostActive?: boolean;
  // はねやすめ使用中（防御側）
  defenderRoostActive?: boolean;
}

export interface ModifierBreakdown {
  stab: number;
  typeEffectiveness: number;
  weather: number;
  field: number;
  critical: number;
  burn: number;
  pinchAbility: number;
  attackerAbilityBoost: number;
  attackerItem: number;
  defenderItem: number;
  screen: number;
  spread: number;
  total: number;
}
