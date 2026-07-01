// 持ち物オートコンプリート用リスト（英名⇔日本語名）。
// 計算層（src/calc/modifiers.ts）が参照する英名キーと対で持つ最小限のマッピング。
// GameData 側の itemsByName/itemsByNameJa は newItems.json（チャンピオンズ差分）が空のため未使用。
export interface ItemListEntry {
  name: string;
  nameJa: string;
}

export const ITEM_LIST: ItemListEntry[] = [
  { name: 'life-orb', nameJa: 'いのちのたま' },
  { name: 'choice-band', nameJa: 'こだわりハチマキ' },
  { name: 'choice-specs', nameJa: 'こだわりメガネ' },
  { name: 'expert-belt', nameJa: 'たつじんのおび' },
  // タイプ強化系
  { name: 'charcoal', nameJa: 'もくたん' },
  { name: 'mystic-water', nameJa: 'しんぴのしずく' },
  { name: 'miracle-seed', nameJa: 'きせきのタネ' },
  { name: 'magnet', nameJa: 'じしゃく' },
  { name: 'never-melt-ice', nameJa: 'とけないこおり' },
  { name: 'black-belt', nameJa: 'くろおび' },
  { name: 'poison-barb', nameJa: 'どくばり' },
  { name: 'soft-sand', nameJa: 'やわらかいすな' },
  { name: 'sharp-beak', nameJa: 'するどいくちばし' },
  { name: 'twisted-spoon', nameJa: 'まがったスプーン' },
  { name: 'silver-powder', nameJa: 'ぎんのこな' },
  { name: 'hard-stone', nameJa: 'かたいいし' },
  { name: 'spell-tag', nameJa: 'のろいのおふだ' },
  { name: 'dragon-fang', nameJa: 'りゅうのキバ' },
  { name: 'black-glasses', nameJa: 'くろいメガネ' },
  { name: 'metal-coat', nameJa: 'メタルコート' },
  { name: 'fairy-feather', nameJa: 'ようせいのはね' },
  { name: 'silk-scarf', nameJa: 'シルクのスカーフ' },
  // 半減きのみ
  { name: 'occa-berry', nameJa: 'オッカのみ' },
  { name: 'passho-berry', nameJa: 'イアのみ' },
  { name: 'wacan-berry', nameJa: 'ソクノのみ' },
  { name: 'rindo-berry', nameJa: 'リンドのみ' },
  { name: 'yache-berry', nameJa: 'ヤチェのみ' },
  { name: 'chople-berry', nameJa: 'ヨプのみ' },
  { name: 'kebia-berry', nameJa: 'カシブのみ' },
  { name: 'shuca-berry', nameJa: 'シュカのみ' },
  { name: 'coba-berry', nameJa: 'バコウのみ' },
  { name: 'payapa-berry', nameJa: 'ウタンのみ' },
  { name: 'tanga-berry', nameJa: 'タンガのみ' },
  { name: 'charti-berry', nameJa: 'ヨロギのみ' },
  { name: 'kasib-berry', nameJa: 'ナモのみ' },
  { name: 'haban-berry', nameJa: 'ハバンのみ' },
  { name: 'colbur-berry', nameJa: 'コブのみ' },
  { name: 'babiri-berry', nameJa: 'リリバのみ' },
  { name: 'roseli-berry', nameJa: 'ロゼルのみ' },
  { name: 'chilan-berry', nameJa: 'ホズのみ' },
];

export const ITEM_BY_NAME = new Map(ITEM_LIST.map((i) => [i.name, i]));
