import type {
  AbilityData,
  ItemData,
  MoveCategory,
  MoveData,
  MoveOverride,
  NewMega,
  PokemonData,
  PokemonType,
  Regulation,
  Stats,
  TypeChartData,
} from './types';

interface RawPokemon {
  id: number;
  name: string;
  nameJa?: string;
  types: string[];
  baseStats: Record<string, number>;
  abilities: { name: string; isHidden: boolean }[];
  height: number;
  weight: number;
}

interface RawMove {
  id: number;
  name: string;
  nameJa?: string;
  type: string;
  category: string;
  power: number | null;
  accuracy: number | null;
  pp: number | null;
  priority: number;
  target?: string;
}

const BASE = 'data/base';
const CHAMP = 'data/champions';
const REG = 'data/regulations';

// 戦闘専用の変身フォーム（基本フォームの代わりに選ばせない／日本語名の既定にしない）。
// メガシンカ等は megaMap 経由・内部名でのみ参照する。
export const BATTLE_FORM_REGEX = /-(mega(-[xy])?|gmax|primal|eternamax)$/;

// 対戦に使わない見た目・イベント・変身フォーム（トーテム／キャップ／ゼンモード等）。候補から除外する。
export const NON_BATTLE_FORM_REGEX = /(-totem|-cap|-zen)(-|$)/;

// リージョンフォームの地方ラベル。該当しなければ null（基本フォーム扱い）。
export function regionLabelOf(name: string): string | null {
  if (NON_BATTLE_FORM_REGEX.test(name)) return null;
  if (/paldea-combat/.test(name)) return 'パルデア・コンバット';
  if (/paldea-blaze/.test(name)) return 'パルデア・ブレイズ';
  if (/paldea-aqua/.test(name)) return 'パルデア・アクア';
  if (/-paldea(-|$)/.test(name)) return 'パルデア';
  if (/-alola(-|$)/.test(name)) return 'アローラ';
  if (/-galar(-|$)/.test(name)) return 'ガラル';
  if (/-hisui(-|$)/.test(name)) return 'ヒスイ';
  return null;
}

// 選択候補に出すか（戦闘専用フォームと非対戦フォームを除外）。
export function isPickablePokemon(name: string): boolean {
  return !BATTLE_FORM_REGEX.test(name) && !NON_BATTLE_FORM_REGEX.test(name);
}

// 選択UI用の表示名を作る。リージョンフォームは「種族名（地方）」、それ以外は nameJa。
export function buildDisplayJa(nameJa: string | undefined, name: string): string | undefined {
  if (!nameJa) return undefined;
  const region = regionLabelOf(name);
  return region ? `${nameJa}（${region}）` : nameJa;
}

async function load<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return (await res.json()) as T;
}

async function loadOptional<T>(path: string, fallback: T): Promise<T> {
  try {
    return await load<T>(path);
  } catch {
    return fallback;
  }
}

function normalizeStats(raw: Record<string, number>): Stats {
  return {
    hp: raw['hp'] ?? 0,
    attack: raw['attack'] ?? 0,
    defense: raw['defense'] ?? 0,
    spAttack: raw['special-attack'] ?? 0,
    spDefense: raw['special-defense'] ?? 0,
    speed: raw['speed'] ?? 0,
  };
}

export interface GameData {
  pokemonByName: Map<string, PokemonData>;
  pokemonByNameJa: Map<string, PokemonData>;
  pokemonByDisplayJa: Map<string, PokemonData>;
  movesByName: Map<string, MoveData>;
  movesByNameJa: Map<string, MoveData>;
  abilitiesByName: Map<string, AbilityData>;
  abilitiesByNameJa: Map<string, AbilityData>;
  itemsByName: Map<string, ItemData>;
  itemsByNameJa: Map<string, ItemData>;
  typeChart: TypeChartData;
  newMegas: NewMega[];
  megaMap: Map<string, string[]>;
  regulation: Regulation;
}

export async function loadGameData(regulationId = 'm-b'): Promise<GameData> {
  const [rawPokemon, rawMoves, abilities, typeChart, overrides, newMegas, newItems, regulation] =
    await Promise.all([
      load<RawPokemon[]>(`${BASE}/pokemon.json`),
      load<RawMove[]>(`${BASE}/moves.json`),
      load<AbilityData[]>(`${BASE}/abilities.json`),
      load<TypeChartData>(`${BASE}/typeChart.json`),
      loadOptional<MoveOverride[]>(`${CHAMP}/overrides.json`, []),
      loadOptional<NewMega[]>(`${CHAMP}/newMegas.json`, []),
      loadOptional<ItemData[]>(`${CHAMP}/newItems.json`, []),
      load<Regulation>(`${REG}/${regulationId}.json`),
    ]);

  const pokemonByName = new Map<string, PokemonData>();
  const pokemonByNameJa = new Map<string, PokemonData>();
  const pokemonByDisplayJa = new Map<string, PokemonData>();
  for (const p of rawPokemon) {
    const displayJa = buildDisplayJa(p.nameJa, p.name);
    const data: PokemonData = {
      id: p.id,
      name: p.name,
      nameJa: p.nameJa,
      displayJa,
      types: p.types as PokemonType[],
      baseStats: normalizeStats(p.baseStats),
      abilities: p.abilities,
      height: p.height,
      weight: p.weight,
    };
    pokemonByName.set(p.name, data);
    if (p.nameJa) {
      // 戦闘専用フォームは日本語名の既定にしない。基本フォームはIDが小さく先に来るため先勝ちで採用する
      if (!BATTLE_FORM_REGEX.test(p.name) && !pokemonByNameJa.has(p.nameJa)) {
        pokemonByNameJa.set(p.nameJa, data);
      }
      // 表示名（地方併記）での解決用。選択候補に出すフォームのみ登録、先勝ち
      if (displayJa && isPickablePokemon(p.name) && !pokemonByDisplayJa.has(displayJa)) {
        pokemonByDisplayJa.set(displayJa, data);
      }
    }
  }

  for (const m of newMegas) {
    const data: PokemonData = {
      id: -1,
      name: m.name,
      nameJa: m.nameJa,
      displayJa: m.nameJa,
      types: m.types,
      baseStats: m.baseStats,
      abilities: [{ name: m.ability, isHidden: false }],
      height: 0,
      weight: 0,
    };
    pokemonByName.set(m.name, data);
    pokemonByNameJa.set(m.nameJa, data);
  }

  const overrideMap = new Map(overrides.map((o) => [o.name, o]));
  const movesByName = new Map<string, MoveData>();
  const movesByNameJa = new Map<string, MoveData>();
  for (const m of rawMoves) {
    const ov = overrideMap.get(m.name);
    const merged: MoveData = {
      id: m.id,
      name: m.name,
      nameJa: m.nameJa,
      type: m.type as PokemonType,
      category: m.category as MoveCategory,
      power: m.power,
      accuracy: m.accuracy,
      pp: m.pp,
      priority: m.priority,
      target: m.target,
      ...(ov?.patch ?? {}),
    };
    movesByName.set(m.name, merged);
    if (merged.nameJa) movesByNameJa.set(merged.nameJa, merged);
  }

  const abilitiesByName = new Map<string, AbilityData>();
  const abilitiesByNameJa = new Map<string, AbilityData>();
  for (const a of abilities) {
    abilitiesByName.set(a.name, a);
    if (a.nameJa) abilitiesByNameJa.set(a.nameJa, a);
  }

  const itemsByName = new Map<string, ItemData>();
  const itemsByNameJa = new Map<string, ItemData>();
  for (const it of newItems) {
    itemsByName.set(it.name, it);
    if (it.nameJa) itemsByNameJa.set(it.nameJa, it);
  }

  const megaMap = new Map<string, string[]>();
  const megaRegex = /^(.+?)-mega(?:-(x|y))?$/;
  for (const name of pokemonByName.keys()) {
    const m = name.match(megaRegex);
    if (m) {
      const base = m[1];
      const list = megaMap.get(base) ?? [];
      list.push(name);
      megaMap.set(base, list);
    }
  }
  for (const m of newMegas) {
    const list = megaMap.get(m.baseName) ?? [];
    list.push(m.name);
    megaMap.set(m.baseName, list);
  }

  return {
    pokemonByName,
    pokemonByNameJa,
    pokemonByDisplayJa,
    movesByName,
    movesByNameJa,
    abilitiesByName,
    abilitiesByNameJa,
    itemsByName,
    itemsByNameJa,
    typeChart,
    newMegas,
    megaMap,
    regulation,
  };
}
