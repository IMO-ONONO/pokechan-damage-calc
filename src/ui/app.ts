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

  // 2. タブナビ + 3ビュー
  const nav = document.createElement('div');
  nav.className = 'tab-nav';
  const calcTab = document.createElement('button');
  calcTab.type = 'button';
  calcTab.className = 'tab-btn active';
  calcTab.textContent = 'ダメージ計算';
  const condTab = document.createElement('button');
  condTab.type = 'button';
  condTab.className = 'tab-btn';
  condTab.textContent = '場の条件';
  const regTab = document.createElement('button');
  regTab.type = 'button';
  regTab.className = 'tab-btn';
  regTab.textContent = 'ポケモン登録';
  nav.append(calcTab, condTab, regTab);
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

  // 急所と形式だけは即切替したいので中段に残す
  function addCondRow(label: string, ctrl: HTMLElement, parent: HTMLElement = midCol) {
    const row = document.createElement('label');
    row.className = 'cond-row';
    const span = document.createElement('span');
    span.textContent = label;
    row.appendChild(span);
    row.appendChild(ctrl);
    parent.appendChild(row);
    return row;
  }
  function addToggle(label: string, input: HTMLInputElement, parent: HTMLElement = midCol) {
    const lab = document.createElement('label');
    lab.className = 'cond-row toggle';
    lab.appendChild(input);
    const span = document.createElement('span');
    span.textContent = ` ${label}`;
    lab.appendChild(span);
    parent.appendChild(lab);
    return lab;
  }
  // 条件サマリー & 「場の条件」タブへのリンク
  const condShortcut = document.createElement('button');
  condShortcut.type = 'button';
  condShortcut.className = 'cond-shortcut';
  condShortcut.textContent = '場の条件 →';
  midCol.appendChild(condShortcut);
  const condSummary = document.createElement('div');
  condSummary.className = 'cond-summary muted';
  midCol.appendChild(condSummary);

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

  // 5c. スリップダメージ表（攻撃側 / 防御側）。要因がある時のみ表示
  function buildSlipBlock(sideClass: string) {
    const section = document.createElement('section');
    section.className = `slip-section card ${sideClass}`;
    section.style.display = 'none';
    const title = document.createElement('div');
    title.className = 'slip-title';
    section.appendChild(title);
    const grid = document.createElement('div');
    grid.className = 'slip-grid';
    section.appendChild(grid);
    return { section, title, grid };
  }
  const atkSlip = buildSlipBlock('slip-atk');
  const defSlip = buildSlipBlock('slip-def');
  calcView.appendChild(atkSlip.section);
  calcView.appendChild(defSlip.section);

  // 5d. 場の条件ビュー
  const condView = document.createElement('div');
  condView.className = 'view view-cond';
  condView.style.display = 'none';
  condView.innerHTML = '<h2>場の条件</h2>';

  function makeCondCard(title: string): HTMLElement {
    const card = document.createElement('section');
    card.className = 'card cond-card';
    const h = document.createElement('h3');
    h.className = 'cond-card-h';
    h.textContent = title;
    card.appendChild(h);
    return card;
  }
  // 場全体
  const fieldCard = makeCondCard('場全体');
  addCondRow('天候', conditionForm.weatherSelect, fieldCard);
  addCondRow('フィールド', conditionForm.fieldSelect, fieldCard);
  addCondRow('形式', conditionForm.formatSelect, fieldCard);
  condView.appendChild(fieldCard);
  // 攻撃側
  const atkCard = makeCondCard('攻撃側');
  atkCard.classList.add('side-atk');
  addCondRow('状態異常', conditionForm.statusSelect, atkCard);
  addToggle('やどりぎ', conditionForm.attackerLeechSeedCheck, atkCard);
  addToggle('バインド', conditionForm.attackerBindCheck, atkCard);
  addToggle('ステロ', conditionForm.attackerStealthRockCheck, atkCard);
  addToggle('急所を出す', conditionForm.critCheck, atkCard);
  condView.appendChild(atkCard);
  // 防御側
  const defCard2 = makeCondCard('防御側');
  defCard2.classList.add('side-def');
  addCondRow('状態異常', conditionForm.defenderStatusSelect, defCard2);
  addCondRow('壁', conditionForm.screenSelect, defCard2);
  addToggle('やどりぎ', conditionForm.leechSeedCheck, defCard2);
  addToggle('バインド', conditionForm.bindCheck, defCard2);
  addToggle('ステロ', conditionForm.stealthRockCheck, defCard2);
  condView.appendChild(defCard2);

  root.appendChild(condView);

  // 5b. 登録ページ（別ビュー）
  const regPage = createRegistrationPage(data);
  const regView = document.createElement('div');
  regView.className = 'view view-reg';
  regView.style.display = 'none';
  regView.appendChild(regPage.element);
  root.appendChild(regView);

  // タブ切替
  function activate(tab: HTMLElement) {
    [calcTab, condTab, regTab].forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');
  }
  function showCalc() {
    calcView.style.display = '';
    condView.style.display = 'none';
    regView.style.display = 'none';
    activate(calcTab);
  }
  function showCond() {
    calcView.style.display = 'none';
    condView.style.display = '';
    regView.style.display = 'none';
    activate(condTab);
  }
  function showReg() {
    calcView.style.display = 'none';
    condView.style.display = 'none';
    regView.style.display = '';
    activate(regTab);
    regPage.refresh();
  }
  calcTab.addEventListener('click', showCalc);
  condTab.addEventListener('click', showCond);
  regTab.addEventListener('click', showReg);
  condShortcut.addEventListener('click', showCond);

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

    // スリップ表（攻防両方）
    renderSlip(
      atkSlip,
      '攻撃側',
      aStats?.hp ?? 0,
      aState.hpRatio,
      cond.attackerStatus,
      cond.attackerLeechSeed,
      cond.attackerBind,
      cond.attackerStealthRock,
      aActive?.types ?? [],
    );
    renderSlip(
      defSlip,
      '防御側',
      dStats?.hp ?? 0,
      dState.hpRatio,
      cond.defenderStatus,
      cond.defenderLeechSeed,
      cond.defenderBind,
      cond.defenderStealthRock,
      dActive?.types ?? [],
    );

    // 中段の条件サマリー更新
    updateCondSummary(cond);
  }

  function updateCondSummary(cond: ConditionState) {
    const parts: string[] = [];
    if (cond.weather !== 'none') parts.push(`天:${cond.weather}`);
    if (cond.field !== 'none') parts.push(`場:${cond.field}`);
    if (cond.screen !== 'none') parts.push(`壁:${cond.screen}`);
    if (cond.attackerStatus !== 'none') parts.push(`攻状態:${cond.attackerStatus}`);
    if (cond.defenderStatus !== 'none') parts.push(`防状態:${cond.defenderStatus}`);
    if (cond.isCritical) parts.push('急所');
    if (cond.format === 'double') parts.push('ダブル');
    const extras: string[] = [];
    if (cond.attackerLeechSeed || cond.attackerBind || cond.attackerStealthRock) extras.push('攻スリップ');
    if (cond.defenderLeechSeed || cond.defenderBind || cond.defenderStealthRock) extras.push('防スリップ');
    if (extras.length) parts.push(extras.join(','));
    condSummary.textContent = parts.length ? parts.join(' / ') : '条件なし';
  }

  // スリップ表を片側分描画する共通ヘルパ。
  function renderSlip(
    target: { section: HTMLElement; title: HTMLElement; grid: HTMLElement },
    sideLabel: string,
    maxHp: number,
    hpRatio: number,
    status: string,
    leechSeed: boolean,
    bind: boolean,
    stealthRock: boolean,
    types: import('../data/types').PokemonType[],
  ) {
    const statusLabels: Record<string, string> = {
      burn: 'やけど(1/16)',
      poison: 'どく(1/8)',
      badpoison: 'もうどく(累積)',
    };
    let stealthDmg = 0;
    let stealthMult = 1;
    if (stealthRock && types.length > 0) {
      stealthMult = getTypeMultiplier('rock', types, data.typeChart.chart);
      stealthDmg = Math.floor((maxHp * stealthMult) / 8);
    }
    const parts: string[] = [];
    if (statusLabels[status]) parts.push(statusLabels[status]);
    if (leechSeed) parts.push('やどりぎ(1/8)');
    if (bind) parts.push('バインド(1/8)');
    if (stealthRock) parts.push(`ステロ(${stealthMult}×)`);

    if (parts.length === 0 || maxHp <= 0) {
      target.section.style.display = 'none';
      return;
    }
    target.section.style.display = '';
    target.title.textContent = `${sideLabel}スリップ ${parts.join(' + ')}`;
    target.grid.innerHTML = '';

    const currentHp = Math.floor(maxHp * hpRatio);
    const burnTick = Math.max(1, Math.floor(maxHp / 16));
    const eighth = Math.max(1, Math.floor(maxHp / 8));

    function damageAtTurn(n: number): number {
      let acc = stealthRock ? stealthDmg : 0;
      if (status === 'burn') acc += burnTick * n;
      else if (status === 'poison') acc += eighth * n;
      else if (status === 'badpoison') {
        for (let i = 1; i <= n; i++) acc += Math.floor((maxHp * i) / 16);
      }
      if (leechSeed) acc += eighth * n;
      if (bind) acc += eighth * n;
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
      target.grid.appendChild(cell);
    }
  }

  recalc();
}
