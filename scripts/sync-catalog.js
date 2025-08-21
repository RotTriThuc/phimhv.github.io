/*
  Sync toàn bộ kho phim từ KKPhim API (phimapi.com)
  Cách chạy:
    node scripts/sync-catalog.js --types=all --out=data/kho-phim.json
  Hoặc chỉ 1 số loại:
    node scripts/sync-catalog.js --types=phim-bo,phim-le --out=data/phim.json
*/

const https = require('https');
const fs = require('fs');
const path = require('path');

const API_BASE = 'https://phimapi.com';
const DEFAULT_TYPES = [
  'phim-bo',
  'phim-le',
  'tv-shows',
  'hoat-hinh',
  'phim-vietsub',
  'phim-thuyet-minh',
  'phim-long-tieng',
];

function buildUrl(p, params = {}) {
  const url = new URL(p, API_BASE);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  });
  return url.toString();
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { 'Accept': 'application/json', 'User-Agent': 'sync-catalog/1.0' } }, (res) => {
        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          res.resume();
          return;
        }
        let raw = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          try {
            const json = JSON.parse(raw);
            resolve(json);
          } catch (e) {
            reject(new Error(`JSON parse error for ${url}: ${e.message}`));
          }
        });
      })
      .on('error', reject);
  });
}

function extractItems(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.paginate?.items)) return payload.paginate.items;
  return [];
}

async function fetchAllByType(type) {
  const firstUrl = buildUrl(`/v1/api/danh-sach/${type}`, { page: 1, limit: 64 });
  const first = await getJson(firstUrl);
  const items = extractItems(first);
  const totalPages = first?.paginate?.totalPages || first?.totalPages || (items.length ? 1 : 0);
  const all = [...items];
  for (let p = 2; p <= totalPages; p++) {
    const url = buildUrl(`/v1/api/danh-sach/${type}`, { page: p, limit: 64 });
    const data = await getJson(url);
    const pageItems = extractItems(data);
    if (!pageItems.length) break;
    all.push(...pageItems);
    process.stdout.write(`\r  ${type}: page ${p}/${totalPages} (total: ${all.length})   `);
  }
  process.stdout.write('\n');
  return all;
}

function uniqBySlug(items) {
  const map = new Map();
  for (const it of items) {
    const slug = it?.slug || it?.id || it?._id;
    if (!slug) continue;
    if (!map.has(slug)) map.set(slug, it);
  }
  return Array.from(map.values());
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { types: 'all', out: 'data/kho-phim.json' };
  for (const a of args) {
    if (a.startsWith('--types=')) opts.types = a.replace('--types=', '').trim();
    else if (a.startsWith('--out=')) opts.out = a.replace('--out=', '').trim();
  }
  return opts;
}

(async function main() {
  const { types, out } = parseArgs();
  const typeList = types === 'all' ? DEFAULT_TYPES : types.split(',').map((s) => s.trim()).filter(Boolean);
  console.log('Sync catalog from KKPhim API');
  console.log('Types:', typeList.join(', '));

  const results = [];
  for (const t of typeList) {
    console.log(`Fetching type: ${t}`);
    try {
      const arr = await fetchAllByType(t);
      console.log(`  -> fetched ${arr.length} items`);
      results.push(...arr);
    } catch (e) {
      console.error(`  -> failed: ${e.message}`);
    }
  }

  const unique = uniqBySlug(results);
  const outPath = path.resolve(process.cwd(), out);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    source: 'phimapi.com',
    total: unique.length,
    items: unique,
  }, null, 2), 'utf8');

  console.log(`Saved ${unique.length} unique items to ${outPath}`);
})().catch((e) => {
  console.error('Sync failed:', e);
  process.exit(1);
}); 