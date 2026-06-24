import type { FullDamageResult } from '../calc/calculate';
import type { MoveData } from '../data/types';
import { TYPE_COLORS } from './typeColors';

export interface SlotResult {
  move: MoveData | null;
  result: FullDamageResult | null;
  defenderMaxHp: number;
  defenderCurrentHp: number;
  message?: string;
}

export interface ResultViewHandle {
  element: HTMLElement;
  render: (slots: SlotResult[]) => void;
}

export function createResultView(): ResultViewHandle {
  const wrap = document.createElement('section');
  wrap.className = 'card result-view';
  const h = document.createElement('h2');
  h.textContent = '結果（4技同時比較）';
  wrap.appendChild(h);
  const body = document.createElement('div');
  body.className = 'result-grid';
  wrap.appendChild(body);

  function makeSlot(slot: SlotResult, idx: number): HTMLElement {
    const card = document.createElement('div');
    card.className = 'result-card';

    const lbl = document.createElement('div');
    lbl.className = 'result-label';
    lbl.textContent = `技${idx + 1}`;
    card.appendChild(lbl);

    if (!slot.move) {
      const empty = document.createElement('div');
      empty.className = 'muted';
      empty.textContent = slot.message ?? '未選択';
      card.appendChild(empty);
      return card;
    }

    const chipRow = document.createElement('div');
    chipRow.className = 'result-move';
    const c = TYPE_COLORS[slot.move.type];
    const chip = document.createElement('span');
    chip.className = 'type-chip-mini';
    chip.style.background = c.bg;
    chip.style.color = c.fg;
    chip.textContent = c.ja;
    chipRow.appendChild(chip);
    const nm = document.createElement('span');
    nm.className = 'result-move-name';
    nm.textContent = ` ${slot.move.nameJa ?? slot.move.name}`;
    chipRow.appendChild(nm);
    card.appendChild(chipRow);

    if (!slot.result) {
      const m = document.createElement('div');
      m.className = 'muted';
      m.textContent = slot.message ?? '計算不可';
      card.appendChild(m);
      return card;
    }

    const { damageRange } = slot.result;
    const maxHp = slot.defenderMaxHp;
    const currentHp = slot.defenderCurrentHp;
    const pct = (n: number) => Math.round((n / maxHp) * 1000) / 10;

    const remainingPct = Math.max(0, (currentHp / maxHp) * 100);
    const minDmgPctRaw = (damageRange.min / maxHp) * 100;
    const maxDmgPctRaw = (damageRange.max / maxHp) * 100;
    const minDmgPct = Math.min(remainingPct, minDmgPctRaw);
    const maxDmgPct = Math.min(remainingPct, maxDmgPctRaw);

    const worst = damageRange.min > 0 ? Math.ceil(currentHp / damageRange.min) : Infinity;
    const best = damageRange.max > 0 ? Math.ceil(currentHp / damageRange.max) : Infinity;

    const bar = document.createElement('div');
    bar.className = 'hp-bar';

    const remaining = document.createElement('div');
    remaining.className = 'hp-bar-remaining';
    remaining.style.width = `${remainingPct}%`;
    bar.appendChild(remaining);

    const maxBand = document.createElement('div');
    maxBand.className = 'hp-bar-max-damage';
    maxBand.style.left = `${remainingPct - maxDmgPct}%`;
    maxBand.style.width = `${maxDmgPct - minDmgPct}%`;
    bar.appendChild(maxBand);

    const minBand = document.createElement('div');
    minBand.className = 'hp-bar-min-damage';
    minBand.style.left = `${remainingPct - minDmgPct}%`;
    minBand.style.width = `${minDmgPct}%`;
    bar.appendChild(minBand);

    card.appendChild(bar);

    const dmg = document.createElement('p');
    dmg.className = 'damage-text';
    dmg.innerHTML = `<strong>${damageRange.min}〜${damageRange.max}</strong> (${pct(damageRange.min)}%〜${pct(damageRange.max)}%)`;
    card.appendChild(dmg);

    const ko = document.createElement('p');
    ko.className = 'ko-text';
    if (!Number.isFinite(worst)) {
      ko.textContent = '無効';
    } else if (worst === best) {
      ko.textContent = `確定${worst}発`;
    } else {
      ko.textContent = `乱数${best}〜${worst}発`;
    }
    card.appendChild(ko);

    const hpInfo = document.createElement('p');
    hpInfo.className = 'muted';
    hpInfo.textContent = `防御HP ${currentHp}/${maxHp}`;
    card.appendChild(hpInfo);

    return card;
  }

  function render(slots: SlotResult[]) {
    body.innerHTML = '';
    slots.forEach((s, i) => body.appendChild(makeSlot(s, i)));
  }

  return { element: wrap, render };
}
