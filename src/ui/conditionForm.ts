import type { BattleFormat, Field, Screen, Status, Weather } from '../data/types';
import { FIELDS, FORMATS, SCREENS, STATUSES, WEATHERS } from './constants';

export interface ConditionState {
  weather: Weather;
  field: Field;
  attackerStatus: Status;
  defenderStatus: Status;
  defenderLeechSeed: boolean;
  defenderBind: boolean;
  defenderStealthRock: boolean;
  screen: Screen;
  format: BattleFormat;
  isCritical: boolean;
}

export interface ConditionFormHandle {
  weatherSelect: HTMLSelectElement;
  fieldSelect: HTMLSelectElement;
  statusSelect: HTMLSelectElement;
  defenderStatusSelect: HTMLSelectElement;
  leechSeedCheck: HTMLInputElement;
  bindCheck: HTMLInputElement;
  stealthRockCheck: HTMLInputElement;
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
    defenderStatus: 'none',
    defenderLeechSeed: false,
    defenderBind: false,
    defenderStealthRock: false,
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

  return {
    weatherSelect,
    fieldSelect,
    statusSelect,
    defenderStatusSelect,
    leechSeedCheck,
    bindCheck,
    stealthRockCheck,
    screenSelect,
    formatSelect,
    critCheck,
    getState: () => state,
  };
}
