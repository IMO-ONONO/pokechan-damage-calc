import type { FullDamageResult } from '../calc/calculate';
import type { GameData } from '../data/loader';
import type { MoveData, PokemonType } from '../data/types';
import { TYPE_COLORS } from './typeColors';

export interface MoveSlotHandle {
  element: HTMLElement;
  getMove: () => MoveData | null;
  setMove: (move: MoveData | null) => void;
  renderResult: (
    data: {
      result: FullDamageResult | null;
      defenderMaxHp: number;
      defenderCurrentHp: number;
      message?: string;
      // 天候連動などで実際に使われたタイプ・威力（ウェザーボール等）
      effectiveType?: PokemonType;
      effectivePower?: number;
    } | null,
  ) => void;
  clear: () => void;
}

export function createMoveSlot(
  index: number,
  data: GameData,
  onChange: () => void,
): MoveSlotHandle {
  const moves = [...data.movesByName.values()].filter((m) => m.nameJa);

  let selected: MoveData | null = null;

  // ── 行全体 ──
  const row = document.createElement('div');
  row.className = 'move-row';

  // ── 左側 ──
  const left = document.createElement('div');
  left.className = 'move-row-l';

  const numEl = document.createElement('div');
  numEl.className = 'move-num';
  numEl.textContent = `技${index + 1}`;
  left.appendChild(numEl);

  const sugWrap = document.createElement('div');
  sugWrap.className = 'suggest-wrap';

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = '技名（部分一致）';
  input.autocomplete = 'off';
  sugWrap.appendChild(input);

  const list = document.createElement('ul');
  list.className = 'suggest-list';
  list.style.display = 'none';
  sugWrap.appendChild(list);

  left.appendChild(sugWrap);

  const moveInfo = document.createElement('div');
  moveInfo.className = 'move-info muted';
  left.appendChild(moveInfo);

  row.appendChild(left);

  // ── 右側 ──
  const right = document.createElement('div');
  right.className = 'move-row-r';

  const hpBar = document.createElement('div');
  hpBar.className = 'hp-bar-thin';

  const hbtRem = document.createElement('div');
  hbtRem.className = 'hbt-rem';
  hbtRem.style.width = '100%';
  hpBar.appendChild(hbtRem);

  const hbtMaxd = document.createElement('div');
  hbtMaxd.className = 'hbt-maxd';
  hbtMaxd.style.width = '0';
  hpBar.appendChild(hbtMaxd);

  const hbtMind = document.createElement('div');
  hbtMind.className = 'hbt-mind';
  hbtMind.style.width = '0';
  hpBar.appendChild(hbtMind);

  right.appendChild(hpBar);

  const dmgLine = document.createElement('div');
  dmgLine.className = 'dmg-line';

  const dmgNums = document.createElement('span');
  dmgNums.className = 'dmg-nums';
  dmgNums.textContent = '-';

  const dmgPct = document.createElement('span');
  dmgPct.className = 'dmg-pct';
  dmgPct.textContent = '';

  const dmgKo = document.createElement('span');
  dmgKo.className = 'dmg-ko';
  dmgKo.textContent = '';

  dmgLine.appendChild(dmgNums);
  dmgLine.appendChild(dmgPct);
  dmgLine.appendChild(dmgKo);
  right.appendChild(dmgLine);

  row.appendChild(right);

  // ── オートコンプリート ──
  function renderDetail(m: MoveData, override?: { type: PokemonType; power: number }) {
    moveInfo.innerHTML = '';
    const effType = override?.type ?? m.type;
    const effPower = override?.power ?? m.power;
    const c = TYPE_COLORS[effType];
    const chip = document.createElement('span');
    chip.className = 'type-chip-mini';
    chip.style.background = c.bg;
    chip.style.color = c.fg;
    chip.textContent = c.ja;
    moveInfo.appendChild(chip);
    const txt = document.createElement('span');
    const catLabel = m.category === 'physical' ? '物理' : m.category === 'special' ? '特殊' : '変化';
    const suffix = override ? '（天候連動）' : '';
    txt.textContent = ` ${catLabel} 威${effPower ?? '-'} 命${m.accuracy ?? '-'}${suffix}`;
    moveInfo.appendChild(txt);
  }

  function selectMove(m: MoveData) {
    selected = m;
    input.value = m.nameJa ?? m.name;
    list.innerHTML = '';
    list.style.display = 'none';
    renderDetail(m);
    onChange();
  }

  function renderSuggestions(q: string) {
    list.innerHTML = '';
    const query = q.trim();
    if (!query) {
      list.style.display = 'none';
      return;
    }
    const lower = query.toLowerCase();
    const matches = moves
      .filter(
        (m) => (m.nameJa && m.nameJa.includes(query)) || m.name.toLowerCase().includes(lower),
      )
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
      name.className = 'suggest-name';
      name.textContent = `${m.nameJa ?? m.name}${m.power != null ? `（威${m.power}）` : ''}`;
      li.appendChild(name);
      li.addEventListener('mousedown', (e) => {
        e.preventDefault();
        selectMove(m);
      });
      list.appendChild(li);
    }
    list.style.display = '';
  }

  input.addEventListener('input', () => {
    selected = null;
    moveInfo.textContent = '';
    renderSuggestions(input.value);
    onChange();
  });
  input.addEventListener('focus', () => renderSuggestions(input.value));
  input.addEventListener('blur', () => {
    window.setTimeout(() => {
      list.style.display = 'none';
    }, 150);
  });

  // ── renderResult ──
  function renderResult(
    payload: {
      result: FullDamageResult | null;
      defenderMaxHp: number;
      defenderCurrentHp: number;
      message?: string;
      effectiveType?: PokemonType;
      effectivePower?: number;
    } | null,
  ) {
    // 動的タイプ・威力が指定されていれば moveInfo 表示を上書き
    if (selected) {
      if (payload?.effectiveType !== undefined && payload?.effectivePower !== undefined) {
        renderDetail(selected, { type: payload.effectiveType, power: payload.effectivePower });
      } else {
        renderDetail(selected);
      }
    }
    if (!payload || !payload.result) {
      // リセット
      hbtRem.style.width = '100%';
      hbtMaxd.style.left = '0';
      hbtMaxd.style.width = '0';
      hbtMind.style.left = '0';
      hbtMind.style.width = '0';
      dmgNums.textContent = '-';
      dmgPct.textContent = '';
      dmgKo.textContent = payload?.message ?? '';
      return;
    }

    const { result, defenderMaxHp, defenderCurrentHp } = payload;
    const min = result.damageRange.min;
    const max = result.damageRange.max;

    if (defenderMaxHp <= 0) {
      dmgNums.textContent = '-';
      dmgPct.textContent = '';
      dmgKo.textContent = '';
      return;
    }

    const remainingPct = Math.min(100, (defenderCurrentHp / defenderMaxHp) * 100);
    const minDmgPct = Math.min(remainingPct, (min / defenderMaxHp) * 100);
    const maxDmgPct = Math.min(remainingPct, (max / defenderMaxHp) * 100);

    hbtRem.style.width = `${remainingPct}%`;
    hbtMind.style.left = `${remainingPct - minDmgPct}%`;
    hbtMind.style.width = `${minDmgPct}%`;
    hbtMaxd.style.left = `${remainingPct - maxDmgPct}%`;
    hbtMaxd.style.width = `${maxDmgPct - minDmgPct}%`;

    dmgNums.textContent = `${min}〜${max}`;
    dmgPct.textContent = `${((min / defenderMaxHp) * 100).toFixed(1)}〜${((max / defenderMaxHp) * 100).toFixed(1)}%`;

    // 確定発数
    const currentHp = defenderCurrentHp;
    if (max <= 0) {
      dmgKo.textContent = '無効';
    } else {
      const worst = Math.ceil(currentHp / min);
      const best = Math.ceil(currentHp / max);
      if (best <= 0) {
        dmgKo.textContent = '確定1発';
      } else if (best === worst) {
        dmgKo.textContent = `確定${best}発`;
      } else {
        dmgKo.textContent = `乱数${best}〜${worst}発`;
      }
    }
  }

  return {
    element: row,
    getMove: () => selected,
    setMove: (m: MoveData | null) => {
      if (m) {
        selected = m;
        input.value = m.nameJa ?? m.name;
        list.innerHTML = '';
        list.style.display = 'none';
        renderDetail(m);
      } else {
        selected = null;
        input.value = '';
        moveInfo.textContent = '';
      }
    },
    renderResult,
    clear: () => {
      selected = null;
      input.value = '';
      moveInfo.textContent = '';
      renderResult(null);
    },
  };
}
