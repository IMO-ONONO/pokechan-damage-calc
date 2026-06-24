import type { PokemonType, TypeChartData } from '../data/types';

export function getTypeMultiplier(
  attackingType: PokemonType,
  defendingTypes: PokemonType[],
  chart: TypeChartData['chart'],
): number {
  const row = chart[attackingType];
  if (!row) return 1;
  let m = 1;
  for (const d of defendingTypes) {
    const v = row[d];
    if (v !== undefined) m *= v;
  }
  return m;
}

export function getStab(
  moveType: PokemonType,
  attackerTypes: PokemonType[],
  adaptability = false,
): number {
  if (!attackerTypes.includes(moveType)) return 1;
  return adaptability ? 2 : 1.5;
}
