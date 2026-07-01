// 持ち物オートコンプリート用リスト（英名⇔日本語名⇔効果テキスト）。
// 計算層（src/calc/modifiers.ts）が参照する英名キーと対で持つ最小限のマッピング。
// GameData 側の itemsByName/itemsByNameJa は newItems.json（チャンピオンズ差分）が空のため未使用。
export interface ItemListEntry {
  name: string;
  nameJa: string;
  effect: string; // 短い効果テキスト。検索・表示に使う
}

export const ITEM_LIST: ItemListEntry[] = [
  { name: 'life-orb', nameJa: 'いのちのたま', effect: '全ダメージ×1.3' },
  { name: 'choice-band', nameJa: 'こだわりハチマキ', effect: '物理技×1.5' },
  { name: 'choice-specs', nameJa: 'こだわりメガネ', effect: '特殊技×1.5' },
  { name: 'expert-belt', nameJa: 'たつじんのおび', effect: '効果バツグン技×1.2' },
  // タイプ強化系
  { name: 'charcoal', nameJa: 'もくたん', effect: 'ほのお技×1.2' },
  { name: 'mystic-water', nameJa: 'しんぴのしずく', effect: 'みず技×1.2' },
  { name: 'miracle-seed', nameJa: 'きせきのタネ', effect: 'くさ技×1.2' },
  { name: 'magnet', nameJa: 'じしゃく', effect: 'でんき技×1.2' },
  { name: 'never-melt-ice', nameJa: 'とけないこおり', effect: 'こおり技×1.2' },
  { name: 'black-belt', nameJa: 'くろおび', effect: 'かくとう技×1.2' },
  { name: 'poison-barb', nameJa: 'どくばり', effect: 'どく技×1.2' },
  { name: 'soft-sand', nameJa: 'やわらかいすな', effect: 'じめん技×1.2' },
  { name: 'sharp-beak', nameJa: 'するどいくちばし', effect: 'ひこう技×1.2' },
  { name: 'twisted-spoon', nameJa: 'まがったスプーン', effect: 'エスパー技×1.2' },
  { name: 'silver-powder', nameJa: 'ぎんのこな', effect: 'むし技×1.2' },
  { name: 'hard-stone', nameJa: 'かたいいし', effect: 'いわ技×1.2' },
  { name: 'spell-tag', nameJa: 'のろいのおふだ', effect: 'ゴースト技×1.2' },
  { name: 'dragon-fang', nameJa: 'りゅうのキバ', effect: 'ドラゴン技×1.2' },
  { name: 'black-glasses', nameJa: 'くろいメガネ', effect: 'あく技×1.2' },
  { name: 'metal-coat', nameJa: 'メタルコート', effect: 'はがね技×1.2' },
  { name: 'fairy-feather', nameJa: 'ようせいのはね', effect: 'フェアリー技×1.2' },
  { name: 'silk-scarf', nameJa: 'シルクのスカーフ', effect: 'ノーマル技×1.2' },
  // 半減きのみ
  { name: 'occa-berry', nameJa: 'オッカのみ', effect: 'ほのお効果バツグン半減' },
  { name: 'passho-berry', nameJa: 'イアのみ', effect: 'みず効果バツグン半減' },
  { name: 'wacan-berry', nameJa: 'ソクノのみ', effect: 'でんき効果バツグン半減' },
  { name: 'rindo-berry', nameJa: 'リンドのみ', effect: 'くさ効果バツグン半減' },
  { name: 'yache-berry', nameJa: 'ヤチェのみ', effect: 'こおり効果バツグン半減' },
  { name: 'chople-berry', nameJa: 'ヨプのみ', effect: 'かくとう効果バツグン半減' },
  { name: 'kebia-berry', nameJa: 'カシブのみ', effect: 'どく効果バツグン半減' },
  { name: 'shuca-berry', nameJa: 'シュカのみ', effect: 'じめん効果バツグン半減' },
  { name: 'coba-berry', nameJa: 'バコウのみ', effect: 'ひこう効果バツグン半減' },
  { name: 'payapa-berry', nameJa: 'ウタンのみ', effect: 'エスパー効果バツグン半減' },
  { name: 'tanga-berry', nameJa: 'タンガのみ', effect: 'むし効果バツグン半減' },
  { name: 'charti-berry', nameJa: 'ヨロギのみ', effect: 'いわ効果バツグン半減' },
  { name: 'kasib-berry', nameJa: 'ナモのみ', effect: 'ゴースト効果バツグン半減' },
  { name: 'haban-berry', nameJa: 'ハバンのみ', effect: 'ドラゴン効果バツグン半減' },
  { name: 'colbur-berry', nameJa: 'コブのみ', effect: 'あく効果バツグン半減' },
  { name: 'babiri-berry', nameJa: 'リリバのみ', effect: 'はがね効果バツグン半減' },
  { name: 'roseli-berry', nameJa: 'ロゼルのみ', effect: 'フェアリー効果バツグン半減' },
  { name: 'chilan-berry', nameJa: 'ホズのみ', effect: 'ノーマル技を半減' },
];

export const ITEM_BY_NAME = new Map(ITEM_LIST.map((i) => [i.name, i]));
