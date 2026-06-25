import type { MoveData, PokemonType, Weather } from '../data/types';

// 天候・場の状況などで実際のタイプ・威力が動的に変わる技の解決。
// 現状はウェザーボールのみ。今後 オーロラベール対抗の特殊技や 自然の力 を入れる場合もここに追加する。
export interface ResolvedMove {
  type: PokemonType;
  power: number;
  changed: boolean;
}

export function resolveDynamicMove(move: MoveData, weather: Weather): ResolvedMove {
  if (move.name === 'weather-ball') {
    // 通常時：ノーマル威力50。天候時：技タイプが天候タイプへ変化し威力2倍(=100)
    if (weather === 'sun') return { type: 'fire', power: 100, changed: true };
    if (weather === 'rain') return { type: 'water', power: 100, changed: true };
    if (weather === 'sand') return { type: 'rock', power: 100, changed: true };
    if (weather === 'snow') return { type: 'ice', power: 100, changed: true };
    return { type: 'normal', power: 50, changed: false };
  }
  return { type: move.type, power: move.power ?? 0, changed: false };
}
