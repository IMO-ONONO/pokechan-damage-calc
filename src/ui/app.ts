import { calculateFullDamage } from '../calc/calculate';
import { getTypeMultiplier } from '../calc/typeChart';
import { loadGameData } from '../data/loader';
import type { SavedPokemon } from '../data/savedPokemon';
import { createConditionForm, type ConditionState } from './conditionForm';
import { createMoveSlot, type MoveSlotHandle } from './moveForm';
import {
  clonePokeState,
  computeStats,
  createPokemonForm,
  resolveActivePokemon,
} from './pokemonForm';
import { createRegistrationPage } from './registrationPage';

export async function initApp(root: HTMLElement) {
  // 1. データ読み込み
  root.textContent = 'データ読み込み中...';
  const data = await loadGameData('m-b');
  root.innerHTML = '';

  // 2. タブナビ + 2ビュー
  const nav = document.createElement('div');
  nav.className = 'tab-nav';
  const calcTab = document.createElement('button');
  calcTab.type = 'button';
  calcTab.className = 'tab-btn active';
  calcTab.textContent = 'ダメージ計算';
  const regTab = document.createElement('button');
  regTab.type = 'button';
  regTab.className = 'tab-btn';
  regTab.textContent = 'ポケモン登録';
  nav.append(calcTab, regTab);
  root.appendChild(nav);

  const calcView = document.createElement('div');
  calcView.className = 'view view-calc';
  root.appendChild(calcView);

  // 攻撃側に登録ポケモンを呼び出したら技4枠もセットする
  function applySavedMoves(saved: SavedPokemon) {
    for (let i = 0; i < 4; i++) {
      const name = saved.moves?.[i] ?? null;
      moveSlots[i].setMove(name ? data.movesByName.get(name) ?? null : null);
    }
    recalc();
  }

  // 3. 技+結果セクション
  const movesSection = document.createElement('section');
  movesSection.className = 'moves-section';
  const moveSlots: MoveSlotHandle[] = [];
  for (let i = 0; i < 4; i++) {
    const slot = createMoveSlot(i, data, () => recalc());
    moveSlots.push(slot);
    movesSection.appendChild(slot.element);
  }
  calcView.appendChild(movesSection);

  // 4. ポケモン+条件 3列行
  const attackerForm = createPokemonForm('attacker', data, () => recalc(), applySavedMoves);
  const defenderForm = createPokemonForm('defender', data, () => recalc());
  const conditionForm = createConditionForm(() => recalc());

  const pokeCondRow = document.createElement('div');
  pokeCondRow.className = 'poke-cond-row';

  // 左列: ATK
  const atkCol = document.createElement('div');
  atkCol.className = 'poke-col poke-col-atk';
  const atkHeader = document.createElement('div');
  atkHeader.className = 'poke-col-header poke-col-header-atk';
  atkHeader.textContent = 'ATK 攻撃側';
  atkCol.appendChild(atkHeader);
  atkCol.appendChild(attackerForm.element);
  pokeCondRow.appendChild(atkCol);

  // 中央列: スワップ + 条件
  const midCol = document.createElement('div');
  midCol.className = 'poke-col poke-col-mid';

  const swapBtn = document.createElement('button');
  swapBtn.type = 'button';
  swapBtn.className = 'swap-btn';
  swapBtn.textContent = '⇄';
  swapBtn.addEventListener('click', () => {
    const a = clonePokeState(attackerForm.getState());
    const d = clonePokeState(defenderForm.getState());
    attackerForm.setState(d);
    defenderForm.setState(a);
    recalc();
  });
  midCol.appendChild(swapBtn);

  // 条件コントロールをラベル付きrowとして追加
  function addCondRow(label: string, ctrl: HTMLElement) {
    const row = document.createElement('label');
    row.className = 'cond-row';
    const span = document.createElement('span');
    span.textContent = label;
    row.appendChild(span);
    row.appendChild(ctrl);
    midCol.appendChild(row);
  }
  addCondRow('天候', conditionForm.weatherSelect);
  addCondRow('フィールド', conditionForm.fieldSelect);
  addCondRow('攻状態', conditionForm.statusSelect);
  addCondRow('防状態', conditionForm.defenderStatusSelect);
  addCondRow('壁', conditionForm.screenSelect);
  addCondRow('形式', conditionForm.formatSelect);

  const critLabel = document.createElement('label');
  critLabel.className = 'cond-row toggle';
  critLabel.appendChild(conditionForm.critCheck);
  const critSpan = document.createElement('span');
  critSpan.textContent = ' 急所';
  critLabel.appendChild(critSpan);
  midCol.appendChild(critLabel);

  // 防御側の追加スリップ（やどりぎ・バインド）
  function addToggle(label: string, input: HTMLInputElement) {
    const lab = document.createElement('label');
    lab.className = 'cond-row toggle';
    lab.appendChild(input);
    const span = document.createElement('span');
    span.textContent = ` ${label}`;
    lab.appendChild(span);
    midCol.appendChild(lab);
  }
  addToggle('やどりぎ', conditionForm.leechSeedCheck);
  addToggle('バインド', conditionForm.bindCheck);
  addToggle('ステロ', conditionForm.stealthRockCheck);

  pokeCondRow.appendChild(midCol);

  // 右列: DEF
  const defCol = document.createElement('div');
  defCol.className = 'poke-col poke-col-def';
  const defHeader = document.createElement('div');
  defHeader.className = 'poke-col-header poke-col-header-def';
  defHeader.textContent = 'DEF 防御側';
  defCol.appendChild(defHeader);
  defCol.appendChild(defenderForm.element);
  pokeCondRow.appendChild(defCol);

  calcView.appendChild(pokeCondRow);

  // 5. 能力値グリッド（6列: A | C | [ラベル] | H | B | D）
  const statsSection = document.createElement('section');
  statsSection.className = 'stats-section';

  const atkCells = attackerForm.statCells;
  const defCells = defenderForm.statCells;

  const sgrid = document.createElement('div');
  sgrid.className = 'stats-master-grid';

  // ヘルパー: ラベルセル作成
  function makeLabel(text: string, cls = 'sg-label'): HTMLElement {
    const el = document.createElement('div');
    el.className = cls;
    el.textContent = text;
    return el;
  }
  function makeDash(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'sg-dash';
    el.textContent = '-';
    return el;
  }

  // row0 header + Lv.50ボタン（中央）
  const lv50Btn = document.createElement('button');
  lv50Btn.type = 'button';
  lv50Btn.className = 'lv50-btn';
  lv50Btn.textContent = 'Lv50';
  lv50Btn.addEventListener('click', () => {
    const aState = attackerForm.getState();
    const dState = defenderForm.getState();
    aState.level = 50;
    dState.level = 50;
    attackerForm.setState(aState);
    defenderForm.setState(dState);
    recalc();
  });

  const headerCells = [
    atkCells.attack.headerEl,
    atkCells.spAttack.headerEl,
    lv50Btn,
    defCells.hp.headerEl,
    defCells.defense.headerEl,
    defCells.spDefense.headerEl,
  ];
  for (const c of headerCells) sgrid.appendChild(c);

  // row1 種族値
  const baseCells = [
    atkCells.attack.baseEl,
    atkCells.spAttack.baseEl,
    makeLabel('種族値'),
    defCells.hp.baseEl,
    defCells.defense.baseEl,
    defCells.spDefense.baseEl,
  ];
  for (const c of baseCells) sgrid.appendChild(c);

  // row2 個体値
  const ivCells = [
    atkCells.attack.ivEl,
    atkCells.spAttack.ivEl,
    makeLabel('個体値'),
    defCells.hp.ivEl,
    defCells.defense.ivEl,
    defCells.spDefense.ivEl,
  ];
  for (const c of ivCells) sgrid.appendChild(c);

  // row3 能力ポイント
  const evCells = [
    atkCells.attack.evEl,
    atkCells.spAttack.evEl,
    makeLabel('能力P'),
    defCells.hp.evEl,
    defCells.defense.evEl,
    defCells.spDefense.evEl,
  ];
  for (const c of evCells) sgrid.appendChild(c);

  // row4 実数値
  const actualCells = [
    atkCells.attack.actualEl,
    atkCells.spAttack.actualEl,
    makeLabel('実数値'),
    defCells.hp.actualEl,
    defCells.defense.actualEl,
    defCells.spDefense.actualEl,
  ];
  for (const c of actualCells) sgrid.appendChild(c);

  // row5 ランク (HP=null → dash)
  const stageCells = [
    atkCells.attack.stageEl!,
    atkCells.spAttack.stageEl!,
    makeLabel('ランク'),
    makeDash(),
    defCells.defense.stageEl!,
    defCells.spDefense.stageEl!,
  ];
  for (const c of stageCells) sgrid.appendChild(c);

  statsSection.appendChild(sgrid);
  calcView.appendChild(statsSection);

  // 5c. スリップダメージのターン経過シミュレーション（防御側状態異常がある時のみ表示）
  const slipSection = document.createElement('section');
  slipSection.className = 'slip-section card';
  slipSection.style.display = 'none';
  const slipTitle = document.createElement('div');
  slipTitle.className = 'slip-title';
  slipSection.appendChild(slipTitle);
  const slipGrid = document.createElement('div');
  slipGrid.className = 'slip-grid';
  slipSection.appendChild(slipGrid);
  calcView.appendChild(slipSection);

  // 5b. 登録ページ（別ビュー）
  const regPage = createRegistrationPage(data);
  const regView = document.createElement('div');
  regView.className = 'view view-reg';
  regView.style.display = 'none';
  regView.appendChild(regPage.element);
  root.appendChild(regView);

  // タブ切替
  function showCalc() {
    calcView.style.display = '';
    regView.style.display = 'none';
    calcTab.classList.add('active');
    regTab.classList.remove('active');
  }
  function showReg() {
    calcView.style.display = 'none';
    regView.style.display = '';
    regTab.classList.add('active');
    calcTab.classList.remove('active');
    regPage.refresh();
  }
  calcTab.addEventListener('click', showCalc);
  regTab.addEventListener('click', showReg);

  // 6. recalc
  function recalc() {
    attackerForm.refreshActuals();
    defenderForm.refreshActuals();

    const aState = attackerForm.getState();
    const dState = defenderForm.getState();
    const cond = conditionForm.getState();
    const aStats = computeStats(aState, data);
    const dStats = computeStats(dState, data);
    const aActive = resolveActivePokemon(aState, data);
    const dActive = resolveActivePokemon(dState, data);

    for (let i = 0; i < 4; i++) {
      const move = moveSlots[i].getMove();
      if (!move) {
        moveSlots[i].renderResult(null);
        continue;
      }
      if (!aStats || !dStats || !aActive || !dActive) {
        moveSlots[i].renderResult({
          result: null,
          defenderMaxHp: 0,
          defenderCurrentHp: 0,
          message: '攻防を選んでください',
        });
        continue;
      }
      if (move.category === 'status' || move.power === null) {
        moveSlots[i].renderResult({
          result: null,
          defenderMaxHp: dStats.hp,
          defenderCurrentHp: Math.floor(dStats.hp * dState.hpRatio),
          message: '変化技',
        });
        continue;
      }
      const result = calculateFullDamage({
        level: aState.level,
        movePower: move.power,
        attackerStats: aStats,
        defenderStats: dStats,
        attackerStages: aState.stages,
        defenderStages: dState.stages,
        context: {
          moveType: move.type,
          category: move.category,
          attackerTypes: aActive.types,
          defenderTypes: dActive.types,
          attackerAbility: aState.ability,
          defenderAbility: dState.ability,
          attackerItem: aState.item,
          defenderItem: dState.item,
          attackerStatus: cond.attackerStatus,
          attackerHpRatio: aState.hpRatio,
          weather: cond.weather,
          field: cond.field,
          screen: cond.screen,
          format: cond.format,
          moveTarget: move.target,
          isCritical: cond.isCritical,
        },
        typeChart: data.typeChart.chart,
      });
      moveSlots[i].renderResult({
        result,
        defenderMaxHp: dStats.hp,
        defenderCurrentHp: Math.floor(dStats.hp * dState.hpRatio),
      });
    }

    // スリップダメージ表の更新
    updateSlipTable(dStats?.hp ?? 0, dState.hpRatio, cond, dActive?.types ?? []);
  }

  // 防御側のスリップを6ターン分（0T..5T）表示する。状態異常+やどりぎ+バインドを合算、ステロは入場時のみ。
  function updateSlipTable(
    maxHp: number,
    hpRatio: number,
    cond: ConditionState,
    defenderTypes: import('../data/types').PokemonType[],
  ) {
    const status = cond.defenderStatus;
    const statusLabels: Record<string, string> = {
      burn: 'やけど(1/16)',
      poison: 'どく(1/8)',
      badpoison: 'もうどく(累積)',
    };
    // ステロは岩タイプの相性倍率（×0.25〜×4）で 1/8 を掛ける
    let stealthDmg = 0;
    let stealthMult = 1;
    if (cond.defenderStealthRock && defenderTypes.length > 0) {
      stealthMult = getTypeMultiplier('rock', defenderTypes, data.typeChart.chart);
      stealthDmg = Math.floor((maxHp * stealthMult) / 8);
    }

    const parts: string[] = [];
    if (statusLabels[status]) parts.push(statusLabels[status]);
    if (cond.defenderLeechSeed) parts.push('やどりぎ(1/8)');
    if (cond.defenderBind) parts.push('バインド(1/8)');
    if (cond.defenderStealthRock) parts.push(`ステロ(${stealthMult}×)`);

    if (parts.length === 0 || maxHp <= 0) {
      slipSection.style.display = 'none';
      return;
    }
    slipSection.style.display = '';
    slipTitle.textContent = `スリップ ${parts.join(' + ')}`;
    slipGrid.innerHTML = '';

    const currentHp = Math.floor(maxHp * hpRatio);
    const burnTick = Math.max(1, Math.floor(maxHp / 16));
    const eighth = Math.max(1, Math.floor(maxHp / 8));

    function damageAtTurn(n: number): number {
      // ステロは入場時のみなので t>=0 で1回だけ加算（0Tで既に控除済みのHPを起点）
      let acc = cond.defenderStealthRock ? stealthDmg : 0;
      if (status === 'burn') acc += burnTick * n;
      else if (status === 'poison') acc += eighth * n;
      else if (status === 'badpoison') {
        for (let i = 1; i <= n; i++) acc += Math.floor((maxHp * i) / 16);
      }
      if (cond.defenderLeechSeed) acc += eighth * n;
      if (cond.defenderBind) acc += eighth * n;
      return acc;
    }

    for (let t = 0; t <= 5; t++) {
      const dmg = damageAtTurn(t);
      const hp = Math.max(0, currentHp - dmg);
      const cell = document.createElement('div');
      cell.className = 'slip-cell';
      const head = document.createElement('div');
      head.className = 'slip-cell-head';
      head.textContent = `${t}T`;
      const val = document.createElement('div');
      val.className = 'slip-cell-hp';
      val.textContent = `${hp}/${maxHp}`;
      const delta = document.createElement('div');
      delta.className = 'slip-cell-delta';
      delta.textContent = t === 0 ? '-' : `-${dmg}`;
      if (hp === 0) cell.classList.add('slip-cell-ko');
      cell.append(head, val, delta);
      slipGrid.appendChild(cell);
    }
  }

  recalc();
}
