import type { EVs, IVs, Nature, Stats } from '../data/types';

const NATURE_TABLE: Record<Nature, { up?: keyof Stats; down?: keyof Stats }> = {
  hardy: {},
  lonely: { up: 'attack', down: 'defense' },
  brave: { up: 'attack', down: 'speed' },
  adamant: { up: 'attack', down: 'spAttack' },
  naughty: { up: 'attack', down: 'spDefense' },
  bold: { up: 'defense', down: 'attack' },
  docile: {},
  relaxed: { up: 'defense', down: 'speed' },
  impish: { up: 'defense', down: 'spAttack' },
  lax: { up: 'defense', down: 'spDefense' },
  timid: { up: 'speed', down: 'attack' },
  hasty: { up: 'speed', down: 'defense' },
  serious: {},
  jolly: { up: 'speed', down: 'spAttack' },
  naive: { up: 'speed', down: 'spDefense' },
  modest: { up: 'spAttack', down: 'attack' },
  mild: { up: 'spAttack', down: 'defense' },
  quiet: { up: 'spAttack', down: 'speed' },
  bashful: {},
  rash: { up: 'spAttack', down: 'spDefense' },
  calm: { up: 'spDefense', down: 'attack' },
  gentle: { up: 'spDefense', down: 'defense' },
  sassy: { up: 'spDefense', down: 'speed' },
  careful: { up: 'spDefense', down: 'spAttack' },
  quirky: {},
};

export const DEFAULT_IVS: IVs = {
  hp: 31,
  attack: 31,
  defense: 31,
  spAttack: 31,
  spDefense: 31,
  speed: 31,
};

export const ZERO_EVS: EVs = {
  hp: 0,
  attack: 0,
  defense: 0,
  spAttack: 0,
  spDefense: 0,
  speed: 0,
};

export function calculateStats(
  baseStats: Stats,
  ivs: IVs,
  evs: EVs,
  level: number,
  nature: Nature,
): Stats {
  const nat = NATURE_TABLE[nature];
  const compute = (key: keyof Stats): number => {
    const base = baseStats[key];
    const iv = ivs[key];
    const ev = evs[key];
    if (key === 'hp') {
      return (
        Math.floor(((base * 2 + iv + Math.floor(ev / 4)) * level) / 100) + level + 10
      );
    }
    let raw = Math.floor(((base * 2 + iv + Math.floor(ev / 4)) * level) / 100) + 5;
    if (nat.up === key) raw = Math.floor(raw * 1.1);
    else if (nat.down === key) raw = Math.floor(raw * 0.9);
    return raw;
  };
  return {
    hp: compute('hp'),
    attack: compute('attack'),
    defense: compute('defense'),
    spAttack: compute('spAttack'),
    spDefense: compute('spDefense'),
    speed: compute('speed'),
  };
}

export function applyStatStage(stat: number, stage: number): number {
  const clamped = Math.max(-6, Math.min(6, stage));
  if (clamped >= 0) {
    return Math.floor((stat * (2 + clamped)) / 2);
  }
  return Math.floor((stat * 2) / (2 - clamped));
}
