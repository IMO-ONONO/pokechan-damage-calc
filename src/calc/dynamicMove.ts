import type { MoveData, PokemonType, Status, Weather } from '../data/types';
import { isSoundMove } from './abilityImmunity';

// 天候・場の状況などで実際のタイプ・威力が動的に変わる技の解決。
// 現状はウェザーボール・たたりめ・スキン系特性・うるおいボイス。
// 今後 オーロラベール対抗の特殊技や 自然の力 を入れる場合もここに追加する。
export interface ResolvedMove {
  type: PokemonType;
  power: number;
  changed: boolean;
}

// スキン系特性：ノーマル技のタイプを変換し威力×1.2
const SKIN_TYPE: Record<string, PokemonType> = {
  pixilate: 'fairy',
  aerilate: 'flying',
  refrigerate: 'ice',
  galvanize: 'electric',
};

export function resolveDynamicMove(
  move: MoveData,
  weather: Weather,
  defenderStatus: Status = 'none',
  attackerAbility?: string,
): ResolvedMove {
  if (move.name === 'weather-ball') {
    // 通常時：ノーマル威力50。天候時：技タイプが天候タイプへ変化し威力2倍(=100)
    if (weather === 'sun') return { type: 'fire', power: 100, changed: true };
    if (weather === 'rain') return { type: 'water', power: 100, changed: true };
    if (weather === 'sand') return { type: 'rock', power: 100, changed: true };
    if (weather === 'snow') return { type: 'ice', power: 100, changed: true };
    return { type: 'normal', power: 50, changed: false };
  }
  // たたりめ：相手が状態異常のとき威力2倍(65→130)
  if (move.name === 'hex' && defenderStatus !== 'none') {
    return { type: move.type, power: 130, changed: true };
  }
  // スキン系（攻撃側特性でノーマル技をタイプ変換+1.2倍）
  if (attackerAbility) {
    const skinType = SKIN_TYPE[attackerAbility];
    if (skinType && move.type === 'normal') {
      return {
        type: skinType,
        power: Math.floor((move.power ?? 0) * 1.2),
        changed: true,
      };
    }
  }
  // うるおいボイス：音技を水タイプに変換（威力ブーストなし）
  if (attackerAbility === 'liquid-voice' && isSoundMove(move.name)) {
    return { type: 'water', power: move.power ?? 0, changed: true };
  }
  return { type: move.type, power: move.power ?? 0, changed: false };
}
