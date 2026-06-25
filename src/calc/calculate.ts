import type { Stats, StatStages, TypeChartData } from '../data/types';
import { calculateDamageRange, type DamageRange } from './damage';
import {
  getAttackerItemModifier,
  getBurnModifier,
  getCriticalModifier,
  getFieldModifier,
  getPinchAbilityModifier,
  getScreenModifier,
  getSpreadModifier,
  getWeatherDefenseModifier,
  getWeatherModifier,
  type ModifierBreakdown,
  type ModifierContext,
} from './modifiers';
import { applyStatStage } from './stats';
import { getStab, getTypeMultiplier } from './typeChart';

export interface FullDamageInput {
  level: number;
  movePower: number;
  attackerStats: Stats;
  defenderStats: Stats;
  attackerStages: StatStages;
  defenderStages: StatStages;
  context: ModifierContext;
  typeChart: TypeChartData['chart'];
}

export interface FullDamageResult {
  damageRange: DamageRange;
  effectiveAttack: number;
  effectiveDefense: number;
  modifiers: ModifierBreakdown;
}

export function calculateFullDamage(input: FullDamageInput): FullDamageResult {
  const {
    level,
    movePower,
    attackerStats,
    defenderStats,
    attackerStages,
    defenderStages,
    context,
    typeChart,
  } = input;

  const isPhysical = context.category === 'physical';
  const baseAttack = isPhysical ? attackerStats.attack : attackerStats.spAttack;
  const baseDefense = isPhysical ? defenderStats.defense : defenderStats.spDefense;
  const attackStage = isPhysical ? attackerStages.attack : attackerStages.spAttack;
  const defenseStage = isPhysical ? defenderStages.defense : defenderStages.spDefense;

  const effectiveAttack =
    context.isCritical && attackStage < 0
      ? baseAttack
      : applyStatStage(baseAttack, attackStage);
  const stagedDefense =
    context.isCritical && defenseStage > 0
      ? baseDefense
      : applyStatStage(baseDefense, defenseStage);
  // 砂嵐(いわ特防×1.5) / 雪(こおり防御×1.5) を防御値に適用
  const weatherDefMod = getWeatherDefenseModifier(
    context.weather,
    context.defenderTypes,
    context.category,
  );
  const effectiveDefense = Math.floor(stagedDefense * weatherDefMod);

  const stab = getStab(
    context.moveType,
    context.attackerTypes,
    context.attackerAbility === 'adaptability',
  );
  const typeEffectiveness = getTypeMultiplier(
    context.moveType,
    context.defenderTypes,
    typeChart,
  );
  const weather = getWeatherModifier(context.moveType, context.weather);
  const field = getFieldModifier(
    context.moveType,
    context.field,
    context.isAttackerGrounded ?? true,
    context.isDefenderGrounded ?? true,
  );
  const critical = getCriticalModifier(context.isCritical);
  const burn = getBurnModifier(
    context.attackerStatus,
    context.category,
    context.attackerAbility,
  );
  const pinchAbility = getPinchAbilityModifier(
    context.attackerAbility,
    context.moveType,
    context.attackerHpRatio,
  );
  const attackerItem = getAttackerItemModifier(
    context.attackerItem,
    context.moveType,
    context.category,
    typeEffectiveness > 1,
  );
  const screen = getScreenModifier(
    context.screen,
    context.category,
    context.isCritical,
    context.format,
  );
  const spread = getSpreadModifier(context.moveTarget, context.format);

  const total =
    stab *
    typeEffectiveness *
    weather *
    field *
    critical *
    burn *
    pinchAbility *
    attackerItem *
    screen *
    spread;

  const damageRange = calculateDamageRange({
    level,
    movePower,
    attack: effectiveAttack,
    defense: effectiveDefense,
    modifiers: total,
  });

  return {
    damageRange,
    effectiveAttack,
    effectiveDefense,
    modifiers: {
      stab,
      typeEffectiveness,
      weather,
      field,
      critical,
      burn,
      pinchAbility,
      attackerItem,
      screen,
      spread,
      total,
    },
  };
}
