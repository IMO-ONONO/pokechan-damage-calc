import { calculateStats, DEFAULT_IVS, ZERO_EVS } from '../calc/stats';
import { isPickablePokemon, type GameData } from '../data/loader';
import { savedToState, type SavedPokemon } from '../data/savedPokemon';
import type { EVs, IVs, Nature, PokemonData, Stats, StatStages } from '../data/types';
import { NATURES, STAGE_KEYS, STAT_KEYS } from './constants';
import { ITEM_BY_NAME, ITEM_LIST } from './itemList';
import { openLoadPanel } from './savedPokemonPanel';
import { buildTypePillBackground, pickFgForTypes } from './typeColors';

export type Side = 'attacker' | 'defender';

export interface PokeFormState {
  pokemon: PokemonData | null;
  level: number;
  ivs: IVs;
  evs: EVs;
  nature: Nature;
  ability: string;
  item: string;
  stages: StatStages;
  hpRatio: number;
  megaName: string | null;
}

export function defaultPokeState(): PokeFormState {
  return {
    pokemon: null,
    level: 50,
    ivs: { ...DEFAULT_IVS },
    evs: { ...ZERO_EVS },
    nature: 'hardy',
    ability: '',
    item: '',
    stages: { attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 },
    hpRatio: 1,
    megaName: null,
  };
}

export function clonePokeState(s: PokeFormState): PokeFormState {
  return {
    pokemon: s.pokemon,
    level: s.level,
    ivs: { ...s.ivs },
    evs: { ...s.evs },
    nature: s.nature,
    ability: s.ability,
    item: s.item,
    stages: { ...s.stages },
    hpRatio: s.hpRatio,
    megaName: s.megaName,
  };
}

export function resolveActivePokemon(state: PokeFormState, data: GameData): PokemonData | null {
  if (state.megaName) return data.pokemonByName.get(state.megaName) ?? state.pokemon;
  return state.pokemon;
}

export function computeStats(state: PokeFormState, data: GameData): Stats | null {
  const active = resolveActivePokemon(state, data);
  if (!active) return null;
  return calculateStats(active.baseStats, state.ivs, state.evs, state.level, state.nature);
}

// メガフォームの表示名を作る。PokéAPIのメガフォームは日本語名が種族名のままなので「メガ◯◯X/Y」に整形する。
// newMegas で既に「メガ◯◯」と命名済みのものはそのまま使う。
export function megaLabel(megaName: string, data: GameData): string {
  const mPoke = data.pokemonByName.get(megaName);
  const baseJa = mPoke?.nameJa ?? megaName;
  if (baseJa.startsWith('メガ')) return baseJa;
  const suffix = megaName.endsWith('-mega-x') ? 'X' : megaName.endsWith('-mega-y') ? 'Y' : '';
  return `メガ${baseJa}${suffix}`;
}

// stat_key → headerEl テキスト
const STAT_HEADER_LABELS: Record<(typeof STAT_KEYS)[number], string> = {
  hp: 'H',
  attack: 'A',
  defense: 'B',
  spAttack: 'C',
  spDefense: 'D',
  speed: 'S',
};

export interface StatCells {
  headerEl: HTMLElement;
  baseEl: HTMLElement;
  ivEl: HTMLInputElement;
  evEl: HTMLInputElement;
  actualEl: HTMLElement;
  stageEl: HTMLSelectElement | null;
}

export interface PokeFormHandle {
  element: HTMLElement; // compact card（能力値グリッドは含まない）
  statCells: {
    hp: StatCells;
    attack: StatCells;
    defense: StatCells;
    spAttack: StatCells;
    spDefense: StatCells;
    speed: StatCells;
  };
  getState: () => PokeFormState;
  setState: (s: PokeFormState) => void;
  refreshActuals: () => void;
}

export function createPokemonForm(
  side: Side,
  data: GameData,
  onChange: () => void,
  onLoadSaved?: (saved: SavedPokemon) => void,
): PokeFormHandle {
  const state = defaultPokeState();

  // ── compact card element ──
  const wrap = document.createElement('div');
  wrap.className = 'poke-col-inner';

  // タイプピル
  const chipRow = document.createElement('div');
  chipRow.className = 'chip-row';
  const nameChip = document.createElement('span');
  nameChip.className = 'name-chip';
  nameChip.textContent = '未選択';
  nameChip.style.background = '#444';
  nameChip.style.color = '#999';
  chipRow.appendChild(nameChip);
  wrap.appendChild(chipRow);

  // 呼出ボタン（登録は別ページ）
  const actions = document.createElement('div');
  actions.className = 'poke-actions';
  const loadBtn = document.createElement('button');
  loadBtn.type = 'button';
  loadBtn.className = 'poke-mini-btn';
  loadBtn.textContent = '登録ポケモンを呼出';
  actions.append(loadBtn);
  wrap.appendChild(actions);

  loadBtn.addEventListener('click', () => {
    openLoadPanel(data, (saved) => {
      setState(savedToState(saved, data));
      onChange();
      onLoadSaved?.(saved);
    });
  });

  // ポケモン名 input + datalist
  const pokeInput = document.createElement('input');
  pokeInput.type = 'text';
  pokeInput.placeholder = '例: リザードン';
  pokeInput.setAttribute('list', `pokelist-${side}`);

  const datalist = document.createElement('datalist');
  datalist.id = `pokelist-${side}`;
  const allowedSet =
    data.regulation.allowedPokemonNames.length > 0
      ? new Set(data.regulation.allowedPokemonNames)
      : null;
  for (const p of data.pokemonByName.values()) {
    if (!p.displayJa) continue;
    if (!isPickablePokemon(p.name)) continue;
    if (allowedSet && !allowedSet.has(p.name)) continue;
    const opt = document.createElement('option');
    opt.value = p.displayJa;
    datalist.appendChild(opt);
  }
  wrap.appendChild(pokeInput);
  wrap.appendChild(datalist);

  // メガ select
  const megaSelect = document.createElement('select');
  megaSelect.style.display = 'none';
  wrap.appendChild(megaSelect);

  // Lv + 性格 (1行)
  const lvNatRow = document.createElement('div');
  lvNatRow.className = 'poke-row-inner';
  const lvLabel = document.createElement('span');
  lvLabel.textContent = 'Lv';
  const lvInput = document.createElement('input');
  lvInput.type = 'number';
  lvInput.value = '50';
  lvInput.min = '1';
  lvInput.max = '100';
  lvInput.style.width = '45px';
  const natSelect = document.createElement('select');
  for (const n of NATURES) {
    const o = document.createElement('option');
    o.value = n.value;
    o.textContent = n.label;
    natSelect.appendChild(o);
  }
  lvNatRow.append(lvLabel, lvInput, natSelect);
  wrap.appendChild(lvNatRow);

  // 特性 select
  const abSelect = document.createElement('select');
  wrap.appendChild(abSelect);

  // 持ち物 input + オートコンプリート
  const itSugWrap = document.createElement('div');
  itSugWrap.className = 'suggest-wrap';

  const itInput = document.createElement('input');
  itInput.type = 'text';
  itInput.placeholder = '持ち物';
  itInput.autocomplete = 'off';
  itSugWrap.appendChild(itInput);

  const itList = document.createElement('ul');
  itList.className = 'suggest-list';
  itList.style.display = 'none';
  itSugWrap.appendChild(itList);

  wrap.appendChild(itSugWrap);

  // HP割合
  const hpRow = document.createElement('div');
  hpRow.className = 'poke-row-inner';
  const hpLabel = document.createElement('span');
  hpLabel.textContent = 'HP%';
  const hpInput = document.createElement('input');
  hpInput.type = 'number';
  hpInput.value = '100';
  hpInput.min = '1';
  hpInput.max = '100';
  hpRow.append(hpLabel, hpInput);
  wrap.appendChild(hpRow);

  // ── statCells（compactなelementには追加しない） ──
  type StatKey = (typeof STAT_KEYS)[number];

  function createStatCells(key: StatKey): StatCells {
    const headerEl = document.createElement('div');
    headerEl.className = 'sg-header';
    headerEl.textContent = STAT_HEADER_LABELS[key];

    const baseEl = document.createElement('div');
    baseEl.className = 'sg-cell';
    baseEl.textContent = '-';

    const ivEl = document.createElement('input');
    ivEl.type = 'number';
    ivEl.className = 'sg-input';
    ivEl.min = '0';
    ivEl.max = '31';
    ivEl.value = '31';

    const evEl = document.createElement('input');
    evEl.type = 'number';
    evEl.className = 'sg-input';
    evEl.min = '0';
    evEl.max = '32';
    evEl.step = '1';
    evEl.value = '0';

    const actualEl = document.createElement('div');
    actualEl.className = 'sg-actual';
    actualEl.textContent = '-';

    let stageEl: HTMLSelectElement | null = null;
    if (key !== 'hp') {
      stageEl = document.createElement('select');
      stageEl.className = 'sg-input sg-stage-select';
      for (let v = 6; v >= -6; v--) {
        const opt = document.createElement('option');
        opt.value = String(v);
        opt.textContent = v > 0 ? `+${v}` : String(v);
        stageEl.appendChild(opt);
      }
      stageEl.value = '0';
    }

    ivEl.addEventListener('change', () => {
      state.ivs[key] = Math.max(0, Math.min(31, parseInt(ivEl.value, 10) || 0));
      refreshActuals();
      onChange();
    });
    evEl.addEventListener('change', () => {
      state.evs[key] = Math.max(0, Math.min(32, parseInt(evEl.value, 10) || 0));
      refreshActuals();
      onChange();
    });
    if (stageEl && key !== 'hp') {
      const k = key as Exclude<StatKey, 'hp'>;
      stageEl.addEventListener('change', () => {
        state.stages[k] = Number(stageEl!.value);
        onChange();
      });
    }

    return { headerEl, baseEl, ivEl, evEl, actualEl, stageEl };
  }

  const statCells = {
    hp: createStatCells('hp'),
    attack: createStatCells('attack'),
    defense: createStatCells('defense'),
    spAttack: createStatCells('spAttack'),
    spDefense: createStatCells('spDefense'),
    speed: createStatCells('speed'),
  };

  // ── 内部関数 ──
  function refreshActuals() {
    const active = resolveActivePokemon(state, data);
    if (!active) {
      for (const key of STAT_KEYS) {
        statCells[key].baseEl.textContent = '-';
        statCells[key].actualEl.textContent = '-';
      }
      return;
    }
    const stats = calculateStats(active.baseStats, state.ivs, state.evs, state.level, state.nature);
    for (const key of STAT_KEYS) {
      statCells[key].baseEl.textContent = String(active.baseStats[key]);
      statCells[key].actualEl.textContent = String(stats[key]);
    }
  }

  function refreshAbilities() {
    abSelect.innerHTML = '';
    const p = resolveActivePokemon(state, data);
    if (!p) return;
    for (const a of p.abilities) {
      const o = document.createElement('option');
      o.value = a.name;
      const aData = data.abilitiesByName.get(a.name);
      o.textContent = `${aData?.nameJa ?? a.name}${a.isHidden ? '（隠）' : ''}`;
      abSelect.appendChild(o);
    }
    if (abSelect.options.length > 0 && !state.ability) {
      state.ability = abSelect.value;
    }
  }

  function refreshMega() {
    megaSelect.innerHTML = '';
    if (!state.pokemon) {
      megaSelect.style.display = 'none';
      return;
    }
    const candidates = data.megaMap.get(state.pokemon.name) ?? [];
    if (candidates.length === 0) {
      megaSelect.style.display = 'none';
      state.megaName = null;
      return;
    }
    megaSelect.style.display = '';
    const noOpt = document.createElement('option');
    noOpt.value = '';
    noOpt.textContent = 'しない';
    megaSelect.appendChild(noOpt);
    for (const m of candidates) {
      const o = document.createElement('option');
      o.value = m;
      o.textContent = megaLabel(m, data);
      megaSelect.appendChild(o);
    }
    if (state.megaName) megaSelect.value = state.megaName;
  }

  function refreshChip() {
    const active = resolveActivePokemon(state, data);
    if (!active) {
      nameChip.textContent = '未選択';
      nameChip.style.background = '#444';
      nameChip.style.color = '#999';
      return;
    }
    nameChip.textContent = active.displayJa ?? active.nameJa ?? active.name;
    nameChip.style.background = buildTypePillBackground(active.types);
    nameChip.style.color = pickFgForTypes(active.types);
  }

  // ── 持ち物オートコンプリート ──
  function selectItem(entry: (typeof ITEM_LIST)[number]) {
    state.item = entry.name;
    itInput.value = entry.nameJa;
    itList.innerHTML = '';
    itList.style.display = 'none';
    onChange();
  }

  function renderItemSuggestions(q: string) {
    itList.innerHTML = '';
    const query = q.trim();
    if (!query) {
      itList.style.display = 'none';
      return;
    }
    const matches = ITEM_LIST.filter((i) => i.nameJa.includes(query)).slice(0, 8);
    if (matches.length === 0) {
      itList.style.display = 'none';
      return;
    }
    for (const entry of matches) {
      const li = document.createElement('li');
      li.textContent = entry.nameJa;
      li.addEventListener('mousedown', (e) => {
        e.preventDefault();
        selectItem(entry);
      });
      itList.appendChild(li);
    }
    itList.style.display = '';
  }

  // ── イベント ──
  pokeInput.addEventListener('change', () => {
    const v = pokeInput.value.trim();
    const p =
      data.pokemonByDisplayJa.get(v) ??
      data.pokemonByNameJa.get(v) ??
      data.pokemonByName.get(v.toLowerCase()) ??
      null;
    state.pokemon = p;
    state.megaName = null;
    state.ability = '';
    refreshAbilities();
    refreshMega();
    refreshChip();
    refreshActuals();
    onChange();
  });

  megaSelect.addEventListener('change', () => {
    state.megaName = megaSelect.value || null;
    state.ability = '';
    refreshAbilities();
    refreshChip();
    refreshActuals();
    onChange();
  });

  lvInput.addEventListener('change', () => {
    state.level = Math.max(1, Math.min(100, parseInt(lvInput.value, 10) || 50));
    refreshActuals();
    onChange();
  });
  natSelect.addEventListener('change', () => {
    state.nature = natSelect.value as Nature;
    refreshActuals();
    onChange();
  });
  abSelect.addEventListener('change', () => {
    state.ability = abSelect.value;
    onChange();
  });
  itInput.addEventListener('input', () => {
    const v = itInput.value.trim();
    // 候補一覧に完全一致する日本語名があれば内部名を確定、無ければ空扱い（既存の自由入力挙動を維持しつつ内部名を保つ）
    const exact = ITEM_LIST.find((i) => i.nameJa === v);
    state.item = exact ? exact.name : '';
    renderItemSuggestions(itInput.value);
    onChange();
  });
  itInput.addEventListener('focus', () => renderItemSuggestions(itInput.value));
  itInput.addEventListener('blur', () => {
    window.setTimeout(() => {
      itList.style.display = 'none';
    }, 150);
  });
  hpInput.addEventListener('change', () => {
    state.hpRatio = Math.max(1, Math.min(100, parseInt(hpInput.value, 10) || 100)) / 100;
    onChange();
  });

  // ── setState ──
  function setState(s: PokeFormState) {
    state.pokemon = s.pokemon;
    state.level = s.level;
    state.ivs = { ...s.ivs };
    state.evs = { ...s.evs };
    state.nature = s.nature;
    state.ability = s.ability;
    state.item = s.item;
    state.stages = { ...s.stages };
    state.hpRatio = s.hpRatio;
    state.megaName = s.megaName;

    pokeInput.value = s.pokemon?.displayJa ?? s.pokemon?.nameJa ?? s.pokemon?.name ?? '';
    lvInput.value = String(s.level);
    natSelect.value = s.nature;
    itInput.value = ITEM_BY_NAME.get(s.item)?.nameJa ?? s.item;
    hpInput.value = String(Math.round(s.hpRatio * 100));

    // statCells IV/EV/Stage
    for (const key of STAT_KEYS) {
      statCells[key].ivEl.value = String(s.ivs[key]);
      statCells[key].evEl.value = String(s.evs[key]);
    }
    for (const key of STAGE_KEYS) {
      const sel = statCells[key].stageEl;
      if (sel) {
        sel.value = String(s.stages[key]);
      }
    }

    refreshAbilities();
    refreshMega();
    if (s.ability) {
      abSelect.value = s.ability;
      state.ability = s.ability;
    }
    refreshChip();
    refreshActuals();
  }

  return {
    element: wrap,
    statCells,
    getState: () => state,
    setState,
    refreshActuals,
  };
}
