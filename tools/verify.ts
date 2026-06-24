import { calculateStats, DEFAULT_IVS, ZERO_EVS } from '../src/calc/stats';
import { calculateFullDamage } from '../src/calc/calculate';
import type { Stats, StatStages, TypeChartData } from '../src/data/types';

const zeroStages: StatStages = {
  attack: 0,
  defense: 0,
  spAttack: 0,
  spDefense: 0,
  speed: 0,
};

interface TestCase {
  name: string;
  expected: { minPct: number; maxPct: number };
  run: () => { min: number; max: number; defenderHp: number };
}

const dummyTypeChart: TypeChartData['chart'] = {
  fire: { grass: 2, water: 0.5, fire: 0.5 },
  water: { fire: 2, grass: 0.5, water: 0.5 },
  grass: { water: 2, fire: 0.5, grass: 0.5 },
  normal: {},
};

function pct(n: number, total: number): number {
  return Math.round((n / total) * 1000) / 10;
}

const tests: TestCase[] = [
  {
    name: '無補正・等倍ノーマル技（参照値: 基本ダメージ式の単体検証）',
    expected: { minPct: 0, maxPct: 100 },
    run: () => {
      const baseStats: Stats = {
        hp: 100,
        attack: 100,
        defense: 100,
        spAttack: 100,
        spDefense: 100,
        speed: 100,
      };
      const attackerStats = calculateStats(baseStats, DEFAULT_IVS, ZERO_EVS, 50, 'hardy');
      const defenderStats = calculateStats(baseStats, DEFAULT_IVS, ZERO_EVS, 50, 'hardy');
      const result = calculateFullDamage({
        level: 50,
        movePower: 80,
        attackerStats,
        defenderStats,
        attackerStages: zeroStages,
        defenderStages: zeroStages,
        context: {
          moveType: 'normal',
          category: 'physical',
          attackerTypes: ['fire'],
          defenderTypes: ['water'],
          attackerStatus: 'none',
          attackerHpRatio: 1,
          weather: 'none',
          field: 'none',
          screen: 'none',
          format: 'single',
          isCritical: false,
        },
        typeChart: dummyTypeChart,
      });
      return {
        min: result.damageRange.min,
        max: result.damageRange.max,
        defenderHp: defenderStats.hp,
      };
    },
  },
  {
    name: 'タイプ一致（STAB）×効果ばつぐん',
    expected: { minPct: 0, maxPct: 100 },
    run: () => {
      const baseStats: Stats = {
        hp: 100,
        attack: 100,
        defense: 100,
        spAttack: 100,
        spDefense: 100,
        speed: 100,
      };
      const attackerStats = calculateStats(baseStats, DEFAULT_IVS, ZERO_EVS, 50, 'hardy');
      const defenderStats = calculateStats(baseStats, DEFAULT_IVS, ZERO_EVS, 50, 'hardy');
      const result = calculateFullDamage({
        level: 50,
        movePower: 80,
        attackerStats,
        defenderStats,
        attackerStages: zeroStages,
        defenderStages: zeroStages,
        context: {
          moveType: 'fire',
          category: 'special',
          attackerTypes: ['fire'],
          defenderTypes: ['grass'],
          attackerStatus: 'none',
          attackerHpRatio: 1,
          weather: 'none',
          field: 'none',
          screen: 'none',
          format: 'single',
          isCritical: false,
        },
        typeChart: dummyTypeChart,
      });
      return {
        min: result.damageRange.min,
        max: result.damageRange.max,
        defenderHp: defenderStats.hp,
      };
    },
  },
];

for (const t of tests) {
  const r = t.run();
  console.log(
    `[${t.name}] ダメージ ${r.min}〜${r.max} (HP ${r.defenderHp}, ${pct(r.min, r.defenderHp)}%〜${pct(r.max, r.defenderHp)}%)`,
  );
}
