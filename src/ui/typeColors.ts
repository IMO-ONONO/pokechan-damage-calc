import type { PokemonType } from '../data/types';

export const TYPE_COLORS: Record<PokemonType, { bg: string; fg: string; ja: string }> = {
  normal: { bg: '#a8a77a', fg: '#000', ja: 'ノーマル' },
  fire: { bg: '#ee8130', fg: '#fff', ja: 'ほのお' },
  water: { bg: '#6390f0', fg: '#fff', ja: 'みず' },
  electric: { bg: '#f7d02c', fg: '#000', ja: 'でんき' },
  grass: { bg: '#7ac74c', fg: '#000', ja: 'くさ' },
  ice: { bg: '#96d9d6', fg: '#000', ja: 'こおり' },
  fighting: { bg: '#c22e28', fg: '#fff', ja: 'かくとう' },
  poison: { bg: '#a33ea1', fg: '#fff', ja: 'どく' },
  ground: { bg: '#e2bf65', fg: '#000', ja: 'じめん' },
  flying: { bg: '#a98ff3', fg: '#000', ja: 'ひこう' },
  psychic: { bg: '#f95587', fg: '#fff', ja: 'エスパー' },
  bug: { bg: '#a6b91a', fg: '#000', ja: 'むし' },
  rock: { bg: '#b6a136', fg: '#000', ja: 'いわ' },
  ghost: { bg: '#735797', fg: '#fff', ja: 'ゴースト' },
  dragon: { bg: '#6f35fc', fg: '#fff', ja: 'ドラゴン' },
  dark: { bg: '#705746', fg: '#fff', ja: 'あく' },
  steel: { bg: '#b7b7ce', fg: '#000', ja: 'はがね' },
  fairy: { bg: '#d685ad', fg: '#000', ja: 'フェアリー' },
  stellar: { bg: '#888', fg: '#fff', ja: 'ステラ' },
};

export function applyTypeChip(el: HTMLElement, type: PokemonType): void {
  const c = TYPE_COLORS[type];
  el.style.background = c.bg;
  el.style.color = c.fg;
  el.textContent = c.ja;
}

export function buildTypePillBackground(types: PokemonType[]): string {
  if (types.length === 0) return '#444';
  if (types.length === 1) return TYPE_COLORS[types[0]].bg;
  const a = TYPE_COLORS[types[0]].bg;
  const b = TYPE_COLORS[types[1]].bg;
  return `linear-gradient(90deg, ${a} 0%, ${a} 50%, ${b} 50%, ${b} 100%)`;
}

export function pickFgForTypes(types: PokemonType[]): string {
  if (types.length === 0) return '#fff';
  return TYPE_COLORS[types[0]].fg;
}
