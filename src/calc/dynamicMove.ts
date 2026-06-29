import type { MoveData, PokemonType, Status, Weather } from '../data/types';

// 天候・場の状況などで実際のタイプ・威力が動的に変わる技の解決。
// 現状はウェザーボール・たたりめ。今後 オーロラベール対抗の特殊技や 自然の力 を入れる場合もここに追加する。
export interface ResolvedMove {
  type: PokemonType;
  power: number;
  changed: boolean;
}

export function resolveDynamicMove(move: MoveData, weather: Weather, defenderStatus: Status = 'none'): ResolvedMove {
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
  return { type: move.type, power: move.power ?? 0, changed: false };
}
