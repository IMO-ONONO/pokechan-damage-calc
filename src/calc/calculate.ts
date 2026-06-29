import type { Stats, StatStages, TypeChartData } from '../data/types';
import {
  getDefenderAbilityHalveModifier,
  ignoresDefenderAbility,
  isAbilityImmune,
  isSoundproofImmune,
} from './abilityImmunity';
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
  // 化けの皮（ミミッキュ）または防御側特性によるタイプ無効化を判定。
  // かたやぶり等の特性無視系が攻撃側にある場合は特性無効化を貫通する（化けの皮は貫通しない）。
  const disguiseBlock = !!context.disguiseActive && context.defenderAbility === 'disguise';
  const ignoreAbility = ignoresDefenderAbility(context.attackerAbility);
  const abilityBlock =
    !ignoreAbility &&
    (isAbilityImmune(context.moveType, context.defenderAbility) ||
      isSoundproofImmune(context.defenderAbility, context.moveName));
  const baseTypeEff = getTypeMultiplier(context.moveType, context.defenderTypes, typeChart);
  const halveMod = ignoreAbility
    ? 1
    : getDefenderAbilityHalveModifier(
        context.moveType,
        context.defenderAbility,
        baseTypeEff,
        context.moveName,
      );
  const typeEffectiveness = disguiseBlock || abilityBlock ? 0 : baseTypeEff * halveMod;
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

  // 本編準拠の sequential floor で適用するため、modifier を列で渡す。
  // 順序：STAB → タイプ相性 → 天候 → フィールド → 急所 → やけど → ピンチ特性 → アイテム → 壁 → 範囲技
  const modifierList = [
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
  ];
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
    modifierList,
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
