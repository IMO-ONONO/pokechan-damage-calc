import type { GameData } from '../data/loader';
import { deleteSaved, loadSaved, MAX_SAVED, type SavedPokemon } from '../data/savedPokemon';
import { buildTypePillBackground, pickFgForTypes } from './typeColors';

let overlay: HTMLElement | null = null;

function close(): void {
  if (overlay) {
    overlay.remove();
    overlay = null;
  }
}

export function openLoadPanel(data: GameData, onPick: (saved: SavedPokemon) => void): void {
  close();

  overlay = document.createElement('div');
  overlay.className = 'saved-overlay';
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  const panel = document.createElement('div');
  panel.className = 'saved-panel';

  const head = document.createElement('div');
  head.className = 'saved-head';
  head.textContent = '登録ポケモンを呼び出す';
  panel.appendChild(head);

  const listEl = document.createElement('div');
  listEl.className = 'saved-list';
  panel.appendChild(listEl);

  const foot = document.createElement('div');
  foot.className = 'saved-foot';
  const count = document.createElement('span');
  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'saved-close';
  closeBtn.textContent = '閉じる';
  closeBtn.addEventListener('click', () => close());
  foot.append(count, closeBtn);
  panel.appendChild(foot);

  function render() {
    const items = loadSaved();
    count.textContent = `${items.length} / ${MAX_SAVED} 体`;
    listEl.innerHTML = '';
    if (items.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'saved-empty';
      empty.textContent = '登録なし。各カードの「登録」ボタンで保存できます';
      listEl.appendChild(empty);
      return;
    }
    for (const it of items) {
      const row = document.createElement('div');
      row.className = 'saved-row';

      const main = document.createElement('button');
      main.type = 'button';
      main.className = 'saved-row-main';

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
      label.className = 'saved-row-label';
      label.textContent = it.label;

      main.append(chip, label);
      main.addEventListener('click', () => {
        onPick(it);
        close();
      });

      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'saved-row-del';
      del.textContent = '✕';
      del.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteSaved(it.id);
        render();
      });

      row.append(main, del);
      listEl.appendChild(row);
    }
  }

  render();
  overlay.appendChild(panel);
  document.body.appendChild(overlay);
}
