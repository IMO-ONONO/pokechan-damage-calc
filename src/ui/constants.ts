import type { BattleFormat, Field, Nature, Screen, Status, Weather } from '../data/types';

// 略称: A=攻撃, B=防御, C=特攻, D=特防, S=素早さ。補正は stats.ts の NATURE_TABLE と一致させる
export const NATURES: { value: Nature; label: string }[] = [
  { value: 'hardy', label: 'がんばりや（無補正）' },
  { value: 'lonely', label: 'さみしがり（A↑B↓）' },
  { value: 'brave', label: 'ゆうかん（A↑S↓）' },
  { value: 'adamant', label: 'いじっぱり（A↑C↓）' },
  { value: 'naughty', label: 'やんちゃ（A↑D↓）' },
  { value: 'bold', label: 'ずぶとい（B↑A↓）' },
  { value: 'docile', label: 'すなお（無補正）' },
  { value: 'relaxed', label: 'のんき（B↑S↓）' },
  { value: 'impish', label: 'わんぱく（B↑C↓）' },
  { value: 'lax', label: 'のうてんき（B↑D↓）' },
  { value: 'timid', label: 'おくびょう（S↑A↓）' },
  { value: 'hasty', label: 'せっかち（S↑B↓）' },
  { value: 'serious', label: 'まじめ（無補正）' },
  { value: 'jolly', label: 'ようき（S↑C↓）' },
  { value: 'naive', label: 'むじゃき（S↑D↓）' },
  { value: 'modest', label: 'ひかえめ（C↑A↓）' },
  { value: 'mild', label: 'おっとり（C↑B↓）' },
  { value: 'quiet', label: 'れいせい（C↑S↓）' },
  { value: 'bashful', label: 'てれや（無補正）' },
  { value: 'rash', label: 'うっかりや（C↑D↓）' },
  { value: 'calm', label: 'おだやか（D↑A↓）' },
  { value: 'gentle', label: 'おとなしい（D↑B↓）' },
  { value: 'sassy', label: 'なまいき（D↑S↓）' },
  { value: 'careful', label: 'しんちょう（D↑C↓）' },
  { value: 'quirky', label: 'きまぐれ（無補正）' },
];

export const WEATHERS: { value: Weather; label: string }[] = [
  { value: 'none', label: 'なし' },
  { value: 'sun', label: '晴れ' },
  { value: 'rain', label: '雨' },
  { value: 'snow', label: '雪' },
  { value: 'sand', label: '砂嵐' },
];

export const FIELDS: { value: Field; label: string }[] = [
  { value: 'none', label: 'なし' },
  { value: 'electric', label: 'エレキフィールド' },
  { value: 'grass', label: 'グラスフィールド' },
  { value: 'psychic', label: 'サイコフィールド' },
  { value: 'misty', label: 'ミストフィールド' },
];

export const STATUSES: { value: Status; label: string }[] = [
  { value: 'none', label: 'なし' },
  { value: 'burn', label: 'やけど' },
  { value: 'paralysis', label: 'まひ' },
  { value: 'freeze', label: 'こおり' },
  { value: 'poison', label: 'どく' },
  { value: 'badpoison', label: 'もうどく' },
  { value: 'sleep', label: 'ねむり' },
];

export const SCREENS: { value: Screen; label: string }[] = [
  { value: 'none', label: 'なし' },
  { value: 'reflect', label: 'リフレクター' },
  { value: 'light-screen', label: '光の壁' },
  { value: 'aurora-veil', label: 'オーロラベール' },
];

export const FORMATS: { value: BattleFormat; label: string }[] = [
  { value: 'single', label: 'シングル' },
  { value: 'double', label: 'ダブル' },
];

export const STAT_KEYS = ['hp', 'attack', 'defense', 'spAttack', 'spDefense', 'speed'] as const;
export const STAT_LABELS: Record<(typeof STAT_KEYS)[number], string> = {
  hp: 'H (HP)',
  attack: 'A (攻撃)',
  defense: 'B (防御)',
  spAttack: 'C (特攻)',
  spDefense: 'D (特防)',
  speed: 'S (素早)',
};

export const STAGE_KEYS = ['attack', 'defense', 'spAttack', 'spDefense', 'speed'] as const;
