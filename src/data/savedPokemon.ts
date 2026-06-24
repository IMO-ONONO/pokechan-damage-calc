import type { PokeFormState } from '../ui/pokemonForm';
import type { EVs, IVs, Nature } from './types';
import type { GameData } from './loader';

const STORAGE_KEY = 'pokechan-saved-pokemon-v2';
export const MAX_SAVED = 100;

export interface SavedPokemon {
  id: string;
  label: string;
  pokemonName: string | null;
  megaName: string | null;
  level: number;
  nature: Nature;
  ability: string;
  item: string;
  ivs: IVs;
  evs: EVs;
  moves: (string | null)[]; // わざ4つ（内部名）。未設定は null
}

export function loadSaved(): SavedPokemon[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? (arr as SavedPokemon[]) : [];
  } catch {
    return [];
  }
}

function persist(list: SavedPokemon[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // ストレージ書き込み失敗時は無視（容量超過など）
  }
}

// 新規追加。上限に達していれば失敗を返す。
export function addSaved(entry: SavedPokemon): { ok: boolean; reason?: string } {
  const list = loadSaved();
  if (list.length >= MAX_SAVED) {
    return { ok: false, reason: `登録上限${MAX_SAVED}体に達しています。不要な登録を削除してください` };
  }
  list.push(entry);
  persist(list);
  return { ok: true };
}

// 既存idがあれば更新、なければ追加。
export function upsertSaved(entry: SavedPokemon): { ok: boolean; reason?: string } {
  const list = loadSaved();
  const idx = list.findIndex((e) => e.id === entry.id);
  if (idx >= 0) {
    list[idx] = entry;
    persist(list);
    return { ok: true };
  }
  return addSaved(entry);
}

export function deleteSaved(id: string): void {
  persist(loadSaved().filter((e) => e.id !== id));
}

export function countSaved(): number {
  return loadSaved().length;
}

export function newSavedId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// 登録データから計算用フォーム状態へ変換。ランク補正・HP割合は対戦時の項目なので既定値にする。
export function savedToState(saved: SavedPokemon, data: GameData): PokeFormState {
  const pokemon = saved.pokemonName ? data.pokemonByName.get(saved.pokemonName) ?? null : null;
  return {
    pokemon,
    level: saved.level,
    ivs: { ...saved.ivs },
    evs: { ...saved.evs },
    nature: saved.nature,
    ability: saved.ability,
    item: saved.item,
    stages: { attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 },
    hpRatio: 1,
    megaName: saved.megaName,
  };
}
