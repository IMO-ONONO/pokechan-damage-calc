import type { BattleFormat, Field, Screen, Status, Weather } from '../data/types';
import { FIELDS, FORMATS, SCREENS, STATUSES, WEATHERS } from './constants';

export interface ConditionState {
  weather: Weather;
  field: Field;
  attackerStatus: Status;
  defenderStatus: Status;
  screen: Screen;
  format: BattleFormat;
  isCritical: boolean;
}

export interface ConditionFormHandle {
  weatherSelect: HTMLSelectElement;
  fieldSelect: HTMLSelectElement;
  statusSelect: HTMLSelectElement;
  defenderStatusSelect: HTMLSelectElement;
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

  return {
    weatherSelect,
    fieldSelect,
    statusSelect,
    defenderStatusSelect,
    screenSelect,
    formatSelect,
    critCheck,
    getState: () => state,
  };
}
