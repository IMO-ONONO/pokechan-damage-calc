import type { BattleFormat, Field, PokemonType, Screen, Status, Weather } from '../data/types';
import { FIELDS, FORMATS, SCREENS, STATUSES, WEATHERS } from './constants';
import { TYPE_COLORS } from './typeColors';

export interface ConditionState {
  weather: Weather;
  field: Field;
  attackerStatus: Status;
  attackerLeechSeed: boolean;
  attackerBind: boolean;
  attackerStealthRock: boolean;
  defenderStatus: Status;
  defenderLeechSeed: boolean;
  defenderBind: boolean;
  defenderStealthRock: boolean;
  // ミミッキュのばけのかわが残っている状態。trueなら全攻撃技を無効化
  defenderDisguiseActive: boolean;
  // もらいびが発動済みかどうか（攻撃側がもらいび特性のとき）
  attackerFlashFireActive: boolean;
  // 変幻自在/リベロ発動済み時の変化後タイプ（''=未選択）
  attackerProteanType: PokemonType | '';
  screen: Screen;
  format: BattleFormat;
  isCritical: boolean;
}

export interface ConditionFormHandle {
  weatherSelect: HTMLSelectElement;
  fieldSelect: HTMLSelectElement;
  statusSelect: HTMLSelectElement;
  defenderStatusSelect: HTMLSelectElement;
  // 防御側スリップ要因
  leechSeedCheck: HTMLInputElement;
  bindCheck: HTMLInputElement;
  stealthRockCheck: HTMLInputElement;
  // 攻撃側スリップ要因
  attackerLeechSeedCheck: HTMLInputElement;
  attackerBindCheck: HTMLInputElement;
  attackerStealthRockCheck: HTMLInputElement;
  // 防御側ばけのかわ（ミミッキュ）
  disguiseCheck: HTMLInputElement;
  // 攻撃側もらいび発動済み
  flashFireCheck: HTMLInputElement;
  // 変幻自在/リベロ 変化後タイプ
  proteanTypeSelect: HTMLSelectElement;
  screenSelect: HTMLSelectElement;
  formatSelect: HTMLSelectElement;
  critCheck: HTMLInputElement;
  getState: () => ConditionState;
}

function makeSelect<T extends string>(
  options: { value: T; label: string }[],
): HTMLSelectElement {
  const sel = document.createElement('select');
  for (const o of options) {
    const opt = document.createElement('option');
    opt.value = o.value;
    opt.textContent = o.label;
    sel.appendChild(opt);
  }
  return sel;
}

export function createConditionForm(onChange: () => void): ConditionFormHandle {
  const state: ConditionState = {
    weather: 'none',
    field: 'none',
    attackerStatus: 'none',
    attackerLeechSeed: false,
    attackerBind: false,
    attackerStealthRock: false,
    defenderStatus: 'none',
    defenderLeechSeed: false,
    defenderBind: false,
    defenderStealthRock: false,
    defenderDisguiseActive: true,
    attackerFlashFireActive: false,
    attackerProteanType: '',
    screen: 'none',
    format: 'single',
    isCritical: false,
  };

  const weatherSelect = makeSelect(WEATHERS);
  const fieldSelect = makeSelect(FIELDS);
  const statusSelect = makeSelect(STATUSES);
  const defenderStatusSelect = makeSelect(STATUSES);
  const screenSelect = makeSelect(SCREENS);
  const formatSelect = makeSelect(FORMATS);

  const critCheck = document.createElement('input');
  critCheck.type = 'checkbox';
  const leechSeedCheck = document.createElement('input');
  leechSeedCheck.type = 'checkbox';
  const bindCheck = document.createElement('input');
  bindCheck.type = 'checkbox';
  const stealthRockCheck = document.createElement('input');
  stealthRockCheck.type = 'checkbox';
  const attackerLeechSeedCheck = document.createElement('input');
  attackerLeechSeedCheck.type = 'checkbox';
  const attackerBindCheck = document.createElement('input');
  attackerBindCheck.type = 'checkbox';
  const attackerStealthRockCheck = document.createElement('input');
  attackerStealthRockCheck.type = 'checkbox';
  const disguiseCheck = document.createElement('input');
  disguiseCheck.type = 'checkbox';
  disguiseCheck.checked = true;
  const flashFireCheck = document.createElement('input');
  flashFireCheck.type = 'checkbox';

  // 変幻自在/リベロ 変化後タイプセレクタ（stellar を除く18タイプ）
  const PROTEAN_TYPES: PokemonType[] = [
    'normal', 'fighting', 'flying', 'poison', 'ground', 'rock',
    'bug', 'ghost', 'steel', 'fire', 'water', 'grass',
    'electric', 'psychic', 'ice', 'dragon', 'dark', 'fairy',
  ];
  const proteanTypeSelect = document.createElement('select');
  const noneOpt = document.createElement('option');
  noneOpt.value = '';
  noneOpt.textContent = 'なし';
  proteanTypeSelect.appendChild(noneOpt);
  for (const t of PROTEAN_TYPES) {
    const opt = document.createElement('option');
    opt.value = t;
    opt.textContent = TYPE_COLORS[t].ja;
    proteanTypeSelect.appendChild(opt);
  }

  weatherSelect.addEventListener('change', () => {
    state.weather = weatherSelect.value as Weather;
    onChange();
  });
  fieldSelect.addEventListener('change', () => {
    state.field = fieldSelect.value as Field;
    onChange();
  });
  statusSelect.addEventListener('change', () => {
    state.attackerStatus = statusSelect.value as Status;
    onChange();
  });
  defenderStatusSelect.addEventListener('change', () => {
    state.defenderStatus = defenderStatusSelect.value as Status;
    onChange();
  });
  screenSelect.addEventListener('change', () => {
    state.screen = screenSelect.value as Screen;
    onChange();
  });
  formatSelect.addEventListener('change', () => {
    state.format = formatSelect.value as BattleFormat;
    onChange();
  });
  critCheck.addEventListener('change', () => {
    state.isCritical = critCheck.checked;
    onChange();
  });
  leechSeedCheck.addEventListener('change', () => {
    state.defenderLeechSeed = leechSeedCheck.checked;
    onChange();
  });
  bindCheck.addEventListener('change', () => {
    state.defenderBind = bindCheck.checked;
    onChange();
  });
  stealthRockCheck.addEventListener('change', () => {
    state.defenderStealthRock = stealthRockCheck.checked;
    onChange();
  });
  attackerLeechSeedCheck.addEventListener('change', () => {
    state.attackerLeechSeed = attackerLeechSeedCheck.checked;
    onChange();
  });
  attackerBindCheck.addEventListener('change', () => {
    state.attackerBind = attackerBindCheck.checked;
    onChange();
  });
  attackerStealthRockCheck.addEventListener('change', () => {
    state.attackerStealthRock = attackerStealthRockCheck.checked;
    onChange();
  });
  disguiseCheck.addEventListener('change', () => {
    state.defenderDisguiseActive = disguiseCheck.checked;
    onChange();
  });
  flashFireCheck.addEventListener('change', () => {
    state.attackerFlashFireActive = flashFireCheck.checked;
    onChange();
  });
  proteanTypeSelect.addEventListener('change', () => {
    state.attackerProteanType = proteanTypeSelect.value as PokemonType | '';
    onChange();
  });

  return {
    weatherSelect,
    fieldSelect,
    statusSelect,
    defenderStatusSelect,
    leechSeedCheck,
    bindCheck,
    stealthRockCheck,
    attackerLeechSeedCheck,
    attackerBindCheck,
    attackerStealthRockCheck,
    disguiseCheck,
    flashFireCheck,
    proteanTypeSelect,
    screenSelect,
    formatSelect,
    critCheck,
    getState: () => state,
  };
}
