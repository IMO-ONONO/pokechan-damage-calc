import { DEFAULT_IVS, ZERO_EVS } from '../calc/stats';
import { buildDisplayJa, isPickablePokemon, type GameData } from '../data/loader';
import {
  deleteSaved,
  loadSaved,
  MAX_SAVED,
  newSavedId,
  upsertSaved,
  type SavedPokemon,
} from '../data/savedPokemon';
import type { EVs, IVs, MoveData, Nature } from '../data/types';
import { NATURES, STAT_KEYS, STAT_LABELS } from './constants';
import { megaLabel } from './pokemonForm';
import { buildTypePillBackground, pickFgForTypes, TYPE_COLORS } from './typeColors';

export interface RegistrationPageHandle {
  element: HTMLElement;
  refresh: () => void;
}

// 技入力（インクリメンタル絞り込み）。内部名を保持する。
function createMoveField(data: GameData, index: number) {
  const moves = [...data.movesByName.values()].filter((m) => m.nameJa);
  let selected: MoveData | null = null;

  const wrap = document.createElement('div');
  wrap.className = 'reg-move-field suggest-wrap';

  const input = document.createElement('input');
  input.type = 'text';
  input.autocomplete = 'off';
  input.placeholder = `わざ${index + 1}`;
  wrap.appendChild(input);

  const list = document.createElement('ul');
  list.className = 'suggest-list';
  list.style.display = 'none';
  wrap.appendChild(list);

  function render(q: string) {
    list.innerHTML = '';
    const query = q.trim();
    if (!query) {
      list.style.display = 'none';
      return;
    }
    const lower = query.toLowerCase();
    const matches = moves
      .filter((m) => (m.nameJa && m.nameJa.includes(query)) || m.name.toLowerCase().includes(lower))
      .slice(0, 8);
    if (matches.length === 0) {
      list.style.display = 'none';
      return;
    }
    for (const m of matches) {
      const li = document.createElement('li');
      const c = TYPE_COLORS[m.type];
      const chip = document.createElement('span');
      chip.className = 'type-chip-mini';
      chip.style.background = c.bg;
      chip.style.color = c.fg;
      chip.textContent = c.ja;
      li.appendChild(chip);
      const name = document.createElement('span');
      name.textContent = `${m.nameJa ?? m.name}${m.power != null ? `（威${m.power}）` : ''}`;
      li.appendChild(name);
      li.addEventListener('mousedown', (e) => {
        e.preventDefault();
        selected = m;
        input.value = m.nameJa ?? m.name;
        list.style.display = 'none';
      });
      list.appendChild(li);
    }
    list.style.display = '';
  }

  input.addEventListener('input', () => {
    selected = null;
    render(input.value);
  });
  input.addEventListener('focus', () => render(input.value));
  input.addEventListener('blur', () => {
    window.setTimeout(() => {
      list.style.display = 'none';
    }, 150);
  });

  return {
    element: wrap,
    getName: (): string | null => selected?.name ?? null,
    setName: (name: string | null) => {
      if (name) {
        const m = data.movesByName.get(name) ?? null;
        selected = m;
        input.value = m ? m.nameJa ?? m.name : '';
      } else {
        selected = null;
        input.value = '';
      }
    },
  };
}

export function createRegistrationPage(
  data: GameData,
  onChanged?: () => void,
): RegistrationPageHandle {
  let editingId: string | null = null;

  const root = document.createElement('section');
  root.className = 'reg-page';

  const h = document.createElement('h2');
  h.textContent = 'ポケモン登録';
  root.appendChild(h);

  const form = document.createElement('div');
  form.className = 'reg-form card';
  root.appendChild(form);

  // ── 種族 + メガ ──
  const speciesInput = document.createElement('input');
  speciesInput.type = 'text';
  speciesInput.placeholder = '種族（例: リザードン）';
  speciesInput.setAttribute('list', 'pokelist-reg');

  const datalist = document.createElement('datalist');
  datalist.id = 'pokelist-reg';
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

  const megaSelect = document.createElement('select');
  megaSelect.style.display = 'none';

  form.appendChild(makeRow('種族', speciesInput));
  form.appendChild(datalist);
  const megaRow = makeRow('メガ', megaSelect);
  megaRow.style.display = 'none';
  form.appendChild(megaRow);

  // ── レベル + 性格 ──
  const levelInput = document.createElement('input');
  levelInput.type = 'number';
  levelInput.min = '1';
  levelInput.max = '100';
  levelInput.value = '50';

  const natureSelect = document.createElement('select');
  for (const n of NATURES) {
    const o = document.createElement('option');
    o.value = n.value;
    o.textContent = n.label;
    natureSelect.appendChild(o);
  }

  form.appendChild(makeRow('レベル', levelInput));
  form.appendChild(makeRow('性格', natureSelect));

  // ── 特性 + 持ち物 ──
  const abilitySelect = document.createElement('select');
  const itemInput = document.createElement('input');
  itemInput.type = 'text';
  itemInput.placeholder = '持ち物（内部名: life-orb 等）';

  form.appendChild(makeRow('特性', abilitySelect));
  form.appendChild(makeRow('持ち物', itemInput));

  // ── 個体値 / 努力値 ──
  const ivInputs: Record<string, HTMLInputElement> = {};
  const evInputs: Record<string, HTMLInputElement> = {};

  const statsBlock = document.createElement('div');
  statsBlock.className = 'reg-stats';
  const head = document.createElement('div');
  head.className = 'reg-stats-head';
  head.innerHTML = '<span></span><span>個体値</span><span>努力値</span>';
  statsBlock.appendChild(head);

  for (const k of STAT_KEYS) {
    const row = document.createElement('div');
    row.className = 'reg-stat-row';
    const lbl = document.createElement('span');
    lbl.className = 'reg-stat-label';
    lbl.textContent = STAT_LABELS[k];
    const iv = document.createElement('input');
    iv.type = 'number';
    iv.min = '0';
    iv.max = '31';
    iv.value = '31';
    ivInputs[k] = iv;
    const ev = document.createElement('input');
    ev.type = 'number';
    ev.min = '0';
    ev.max = '252';
    ev.step = '4';
    ev.value = '0';
    ev.addEventListener('input', updateEvTotal);
    evInputs[k] = ev;
    row.append(lbl, iv, ev);
    statsBlock.appendChild(row);
  }
  const evTotal = document.createElement('div');
  evTotal.className = 'reg-ev-total';
  statsBlock.appendChild(evTotal);
  form.appendChild(statsBlock);

  function updateEvTotal() {
    const total = STAT_KEYS.reduce(
      (s, k) => s + (parseInt(evInputs[k].value, 10) || 0),
      0,
    );
    evTotal.textContent = `努力値合計 ${total} / 510`;
    evTotal.classList.toggle('over', total > 510);
  }

  // ── わざ4つ ──
  const movesWrap = document.createElement('div');
  movesWrap.className = 'reg-moves';
  const movesHead = document.createElement('div');
  movesHead.className = 'reg-stats-head';
  movesHead.textContent = 'わざ';
  movesWrap.appendChild(movesHead);
  const moveFields = [0, 1, 2, 3].map((i) => createMoveField(data, i));
  for (const mf of moveFields) movesWrap.appendChild(mf.element);
  form.appendChild(movesWrap);

  // ── 登録名 ──
  const labelInput = document.createElement('input');
  labelInput.type = 'text';
  labelInput.placeholder = '登録名（例: 珠リザY）';
  form.appendChild(makeRow('登録名', labelInput));

  // ── ボタン ──
  const btnRow = document.createElement('div');
  btnRow.className = 'reg-btn-row';
  const saveBtn = document.createElement('button');
  saveBtn.type = 'button';
  saveBtn.className = 'reg-save-btn';
  saveBtn.textContent = '保存';
  const clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.className = 'reg-clear-btn';
  clearBtn.textContent = '新規クリア';
  btnRow.append(saveBtn, clearBtn);
  form.appendChild(btnRow);

  const msg = document.createElement('div');
  msg.className = 'reg-msg';
  form.appendChild(msg);

  // ── 登録一覧 ──
  const listH = document.createElement('h2');
  listH.textContent = '登録済み';
  root.appendChild(listH);
  const listEl = document.createElement('div');
  listEl.className = 'reg-list';
  root.appendChild(listEl);

  // ── ヘルパー ──
  function activePokemonName(): string | null {
    if (megaSelect.value) return megaSelect.value;
    const p = data.pokemonByDisplayJa.get(speciesInput.value.trim());
    return p ? p.name : null;
  }

  function refreshAbilities() {
    abilitySelect.innerHTML = '';
    const name = activePokemonName();
    const p = name ? data.pokemonByName.get(name) : null;
    if (!p) return;
    for (const a of p.abilities) {
      const o = document.createElement('option');
      o.value = a.name;
      const aData = data.abilitiesByName.get(a.name);
      o.textContent = `${aData?.nameJa ?? a.name}${a.isHidden ? '（隠）' : ''}`;
      abilitySelect.appendChild(o);
    }
  }

  function refreshMega(keepSelection = false) {
    const prev = megaSelect.value;
    megaSelect.innerHTML = '';
    const base = data.pokemonByDisplayJa.get(speciesInput.value.trim());
    const candidates = base ? data.megaMap.get(base.name) ?? [] : [];
    if (candidates.length === 0) {
      megaRow.style.display = 'none';
      return;
    }
    megaRow.style.display = '';
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
    if (keepSelection && candidates.includes(prev)) megaSelect.value = prev;
  }

  speciesInput.addEventListener('change', () => {
    megaSelect.value = '';
    refreshMega();
    refreshAbilities();
  });
  megaSelect.addEventListener('change', () => refreshAbilities());

  function collect(): SavedPokemon | null {
    const base = data.pokemonByDisplayJa.get(speciesInput.value.trim());
    if (!base) {
      return null;
    }
    const ivs = {} as IVs;
    const evs = {} as EVs;
    for (const k of STAT_KEYS) {
      ivs[k] = Math.max(0, Math.min(31, parseInt(ivInputs[k].value, 10) || 0));
      evs[k] = Math.max(0, Math.min(252, parseInt(evInputs[k].value, 10) || 0));
    }
    const label = labelInput.value.trim() || base.displayJa || base.name;
    return {
      id: editingId ?? newSavedId(),
      label,
      pokemonName: base.name,
      megaName: megaSelect.value || null,
      level: Math.max(1, Math.min(100, parseInt(levelInput.value, 10) || 50)),
      nature: natureSelect.value as Nature,
      ability: abilitySelect.value,
      item: itemInput.value.trim(),
      ivs,
      evs,
      moves: moveFields.map((mf) => mf.getName()),
    };
  }

  function clearForm() {
    editingId = null;
    speciesInput.value = '';
    megaSelect.value = '';
    megaRow.style.display = 'none';
    levelInput.value = '50';
    natureSelect.value = 'hardy';
    abilitySelect.innerHTML = '';
    itemInput.value = '';
    for (const k of STAT_KEYS) {
      ivInputs[k].value = String(DEFAULT_IVS[k]);
      evInputs[k].value = String(ZERO_EVS[k]);
    }
    updateEvTotal();
    for (const mf of moveFields) mf.setName(null);
    labelInput.value = '';
    saveBtn.textContent = '保存';
    msg.textContent = '';
  }

  function fillForm(s: SavedPokemon) {
    editingId = s.id;
    const base = s.pokemonName ? data.pokemonByName.get(s.pokemonName) : null;
    speciesInput.value = base?.displayJa ?? base?.nameJa ?? s.pokemonName ?? '';
    refreshMega();
    megaSelect.value = s.megaName ?? '';
    refreshAbilities();
    abilitySelect.value = s.ability;
    levelInput.value = String(s.level);
    natureSelect.value = s.nature;
    itemInput.value = s.item;
    for (const k of STAT_KEYS) {
      ivInputs[k].value = String(s.ivs[k]);
      evInputs[k].value = String(s.evs[k]);
    }
    updateEvTotal();
    moveFields.forEach((mf, i) => mf.setName(s.moves?.[i] ?? null));
    labelInput.value = s.label;
    saveBtn.textContent = '更新';
    msg.textContent = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  saveBtn.addEventListener('click', () => {
    const entry = collect();
    if (!entry) {
      msg.textContent = '種族を正しく選んでください';
      msg.className = 'reg-msg error';
      return;
    }
    const res = upsertSaved(entry);
    if (res.ok) {
      msg.textContent = `「${entry.label}」を保存しました`;
      msg.className = 'reg-msg ok';
      clearForm();
      renderList();
      onChanged?.();
    } else {
      msg.textContent = res.reason ?? '保存に失敗しました';
      msg.className = 'reg-msg error';
    }
  });

  clearBtn.addEventListener('click', clearForm);

  function renderList() {
    const items = loadSaved();
    listEl.innerHTML = '';
    const counter = document.createElement('div');
    counter.className = 'reg-count';
    counter.textContent = `${items.length} / ${MAX_SAVED} 体`;
    listEl.appendChild(counter);
    if (items.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'saved-empty';
      empty.textContent = '登録なし';
      listEl.appendChild(empty);
      return;
    }
    for (const it of items) {
      const row = document.createElement('div');
      row.className = 'reg-list-row';

      const poke = it.pokemonName ? data.pokemonByName.get(it.pokemonName) ?? null : null;
      const chip = document.createElement('span');
      chip.className = 'saved-row-chip';
      if (poke) {
        chip.textContent = poke.displayJa ?? poke.nameJa ?? poke.name;
        chip.style.background = buildTypePillBackground(poke.types);
        chip.style.color = pickFgForTypes(poke.types);
      } else {
        chip.textContent = '未選択';
        chip.style.background = '#444';
        chip.style.color = '#999';
      }

      const label = document.createElement('span');
      label.className = 'reg-list-label';
      label.textContent = it.label;

      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'reg-list-edit';
      editBtn.textContent = '編集';
      editBtn.addEventListener('click', () => fillForm(it));

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'reg-list-del';
      delBtn.textContent = '削除';
      delBtn.addEventListener('click', () => {
        deleteSaved(it.id);
        if (editingId === it.id) clearForm();
        renderList();
        onChanged?.();
      });

      row.append(chip, label, editBtn, delBtn);
      listEl.appendChild(row);
    }
  }

  updateEvTotal();
  renderList();

  return { element: root, refresh: renderList };
}

function makeRow(label: string, control: HTMLElement): HTMLElement {
  const row = document.createElement('label');
  row.className = 'reg-row';
  const span = document.createElement('span');
  span.className = 'reg-row-label';
  span.textContent = label;
  row.append(span, control);
  return row;
}
