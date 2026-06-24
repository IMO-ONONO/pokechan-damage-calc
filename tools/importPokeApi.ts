import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const API_BASE = 'https://pokeapi.co/api/v2';
const OUT_DIR = join(here, '..', 'public', 'data', 'base');
const THROTTLE_MS = 80;

const args = process.argv.slice(2);
const LIMIT = (() => {
  const a = args.find((v) => v.startsWith('--limit='));
  return a ? parseInt(a.split('=')[1], 10) : Infinity;
})();
const ONLY = (() => {
  const i = args.indexOf('--only');
  return i >= 0 ? args[i + 1].split(',') : ['types', 'abilities', 'moves', 'pokemon'];
})();

type NameEntry = { name: string; language: { name: string } };

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function fetchJson<T>(url: string, retries = 3): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      return (await res.json()) as T;
    } catch (err) {
      if (i === retries - 1) throw err;
      await sleep(500 * (i + 1));
    }
  }
  throw new Error('unreachable');
}

function pickJa(entries: NameEntry[] | undefined): string | undefined {
  if (!entries) return undefined;
  return (
    entries.find((e) => e.language.name === 'ja-Hrkt')?.name ??
    entries.find((e) => e.language.name === 'ja')?.name
  );
}

interface RefList {
  results: { name: string; url: string }[];
}

async function importTypeChart() {
  console.log('[types] fetching list...');
  const list = await fetchJson<RefList>(`${API_BASE}/type?limit=30`);
  const targets = list.results.filter((r) => !['unknown', 'shadow'].includes(r.name));
  console.log(`[types] ${targets.length} types`);

  const typeNames: { name: string; nameJa?: string }[] = [];
  const chart: Record<string, Record<string, number>> = {};

  for (const r of targets) {
    const t = await fetchJson<{
      name: string;
      names: NameEntry[];
      damage_relations: {
        double_damage_to: { name: string }[];
        half_damage_to: { name: string }[];
        no_damage_to: { name: string }[];
      };
    }>(r.url);
    await sleep(THROTTLE_MS);
    typeNames.push({ name: t.name, nameJa: pickJa(t.names) });
    const row: Record<string, number> = {};
    for (const x of t.damage_relations.double_damage_to) row[x.name] = 2;
    for (const x of t.damage_relations.half_damage_to) row[x.name] = 0.5;
    for (const x of t.damage_relations.no_damage_to) row[x.name] = 0;
    chart[t.name] = row;
  }
  await writeFile(
    join(OUT_DIR, 'typeChart.json'),
    JSON.stringify({ types: typeNames, chart }),
  );
  console.log(`[types] wrote typeChart.json`);
}

async function importAbilities() {
  console.log('[abilities] fetching list...');
  const list = await fetchJson<RefList>(`${API_BASE}/ability?limit=500`);
  const targets = list.results.slice(0, LIMIT);
  console.log(`[abilities] ${targets.length} entries`);

  const out: unknown[] = [];
  for (let i = 0; i < targets.length; i++) {
    const r = targets[i];
    try {
      const a = await fetchJson<{
        id: number;
        name: string;
        names: NameEntry[];
        effect_entries: { language: { name: string }; short_effect: string }[];
      }>(r.url);
      await sleep(THROTTLE_MS);
      out.push({
        id: a.id,
        name: a.name,
        nameJa: pickJa(a.names),
        effect: a.effect_entries.find((e) => e.language.name === 'en')?.short_effect,
        effectJa: a.effect_entries.find((e) => e.language.name === 'ja')?.short_effect,
      });
      if ((i + 1) % 50 === 0) console.log(`[abilities] ${i + 1}/${targets.length}`);
    } catch (err) {
      console.error(`[abilities] failed: ${r.name}`, err);
    }
  }
  await writeFile(join(OUT_DIR, 'abilities.json'), JSON.stringify(out));
  console.log(`[abilities] wrote ${out.length} entries`);
}

async function importMoves() {
  console.log('[moves] fetching list...');
  const list = await fetchJson<RefList>(`${API_BASE}/move?limit=1500`);
  const targets = list.results.slice(0, LIMIT);
  console.log(`[moves] ${targets.length} entries`);

  const out: unknown[] = [];
  for (let i = 0; i < targets.length; i++) {
    const r = targets[i];
    try {
      const m = await fetchJson<{
        id: number;
        name: string;
        names: NameEntry[];
        type: { name: string };
        damage_class: { name: string } | null;
        power: number | null;
        accuracy: number | null;
        pp: number | null;
        priority: number;
        target: { name: string } | null;
      }>(r.url);
      await sleep(THROTTLE_MS);
      out.push({
        id: m.id,
        name: m.name,
        nameJa: pickJa(m.names),
        type: m.type.name,
        category: m.damage_class?.name ?? 'status',
        power: m.power,
        accuracy: m.accuracy,
        pp: m.pp,
        priority: m.priority,
        target: m.target?.name,
      });
      if ((i + 1) % 50 === 0) console.log(`[moves] ${i + 1}/${targets.length}`);
    } catch (err) {
      console.error(`[moves] failed: ${r.name}`, err);
    }
  }
  await writeFile(join(OUT_DIR, 'moves.json'), JSON.stringify(out));
  console.log(`[moves] wrote ${out.length} entries`);
}

async function importPokemon() {
  console.log('[pokemon] fetching list...');
  const list = await fetchJson<RefList>(`${API_BASE}/pokemon?limit=2000`);
  const targets = list.results.slice(0, LIMIT);
  console.log(`[pokemon] ${targets.length} entries`);

  const out: unknown[] = [];
  for (let i = 0; i < targets.length; i++) {
    const r = targets[i];
    try {
      const p = await fetchJson<{
        id: number;
        name: string;
        types: { type: { name: string } }[];
        stats: { stat: { name: string }; base_stat: number }[];
        abilities: { ability: { name: string }; is_hidden: boolean }[];
        height: number;
        weight: number;
        species: { url: string };
      }>(r.url);
      await sleep(THROTTLE_MS);
      let nameJa: string | undefined;
      try {
        const sp = await fetchJson<{ names: NameEntry[] }>(p.species.url);
        await sleep(THROTTLE_MS);
        nameJa = pickJa(sp.names);
      } catch {
        // species 失敗時はnameJa無しで継続
      }
      out.push({
        id: p.id,
        name: p.name,
        nameJa,
        types: p.types.map((t) => t.type.name),
        baseStats: Object.fromEntries(p.stats.map((s) => [s.stat.name, s.base_stat])),
        abilities: p.abilities.map((a) => ({ name: a.ability.name, isHidden: a.is_hidden })),
        height: p.height,
        weight: p.weight,
      });
      if ((i + 1) % 50 === 0) console.log(`[pokemon] ${i + 1}/${targets.length}`);
    } catch (err) {
      console.error(`[pokemon] failed: ${r.name}`, err);
    }
  }
  await writeFile(join(OUT_DIR, 'pokemon.json'), JSON.stringify(out));
  console.log(`[pokemon] wrote ${out.length} entries`);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  console.log(`Output dir: ${OUT_DIR}`);
  console.log(`Targets: ${ONLY.join(', ')}, limit=${LIMIT === Infinity ? 'all' : LIMIT}`);

  if (ONLY.includes('types')) await importTypeChart();
  if (ONLY.includes('abilities')) await importAbilities();
  if (ONLY.includes('moves')) await importMoves();
  if (ONLY.includes('pokemon')) await importPokemon();

  console.log('done');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
