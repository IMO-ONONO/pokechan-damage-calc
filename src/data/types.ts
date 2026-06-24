export type PokemonType =
  | 'normal'
  | 'fighting'
  | 'flying'
  | 'poison'
  | 'ground'
  | 'rock'
  | 'bug'
  | 'ghost'
  | 'steel'
  | 'fire'
  | 'water'
  | 'grass'
  | 'electric'
  | 'psychic'
  | 'ice'
  | 'dragon'
  | 'dark'
  | 'fairy'
  | 'stellar';

export interface Stats {
  hp: number;
  attack: number;
  defense: number;
  spAttack: number;
  spDefense: number;
  speed: number;
}

export interface PokemonAbility {
  name: string;
  isHidden: boolean;
}

export interface PokemonData {
  id: number;
  name: string;
  nameJa?: string;
  // 選択UI用の表示名。リージョンフォームは「ロコン（アローラ）」のように地方を併記する。基本フォームは nameJa と同じ
  displayJa?: string;
  types: PokemonType[];
  baseStats: Stats;
  abilities: PokemonAbility[];
  height: number;
  weight: number;
}

export type MoveCategory = 'physical' | 'special' | 'status';

export interface MoveData {
  id: number;
  name: string;
  nameJa?: string;
  type: PokemonType;
  category: MoveCategory;
  power: number | null;
  accuracy: number | null;
  pp: number | null;
  priority: number;
  // PokéAPIの対象種別（例: all-opponents=相手全体, all-other-pokemon=自分以外全体）。ダブルの範囲技0.75判定に使う
  target?: string;
}

export interface AbilityData {
  id: number;
  name: string;
  nameJa?: string;
  effect?: string;
  effectJa?: string;
}

export interface TypeChartData {
  types: { name: PokemonType; nameJa?: string }[];
  chart: Record<string, Record<string, number>>;
}

export interface MoveOverride {
  name: string;
  patch: Partial<Omit<MoveData, 'id' | 'name'>>;
  note?: string;
}

export interface NewMega {
  name: string;
  nameJa: string;
  baseName: string;
  types: PokemonType[];
  baseStats: Stats;
  ability: string;
  note?: string;
}

export interface ItemData {
  name: string;
  nameJa: string;
  effect?: string;
  note?: string;
}

export type BattleGimmick = 'mega' | 'dynamax' | 'tera';
export type BattleFormat = 'single' | 'double';

export interface Regulation {
  id: string;
  name: string;
  period: { from: string; to: string };
  battleFormats: BattleFormat[];
  allowedPokemonNames: string[];
  bannedItems?: string[];
  battleGimmicks: BattleGimmick[];
  notes?: string;
}

export type Nature =
  | 'hardy' | 'lonely' | 'brave' | 'adamant' | 'naughty'
  | 'bold' | 'docile' | 'relaxed' | 'impish' | 'lax'
  | 'timid' | 'hasty' | 'serious' | 'jolly' | 'naive'
  | 'modest' | 'mild' | 'quiet' | 'bashful' | 'rash'
  | 'calm' | 'gentle' | 'sassy' | 'careful' | 'quirky';

export interface IVs {
  hp: number;
  attack: number;
  defense: number;
  spAttack: number;
  spDefense: number;
  speed: number;
}

export interface EVs extends IVs {}

export type Weather = 'none' | 'sun' | 'rain' | 'snow' | 'sand';
export type Field = 'none' | 'electric' | 'grass' | 'psychic' | 'misty';
export type Status = 'none' | 'burn' | 'paralysis' | 'freeze' | 'poison' | 'badpoison' | 'sleep';
// 防御側の壁。reflect=リフレクター（物理半減）, light-screen=光の壁（特殊半減）, aurora-veil=オーロラベール（両方半減）
export type Screen = 'none' | 'reflect' | 'light-screen' | 'aurora-veil';

export interface StatStages {
  attack: number;
  defense: number;
  spAttack: number;
  spDefense: number;
  speed: number;
}
