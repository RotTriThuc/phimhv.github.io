/*
  Sync toàn bộ kho phim từ KKPhim API (phimapi.com)
  Cách chạy:
    node scripts/sync-catalog.js --types=all --out=data/kho-phim.json
  Hoặc chỉ 1 số loại:
    node scripts/sync-catalog.js --types=phim-bo,phim-le --out=data/phim.json
*/

// Import shared utilities
import { HttpClient } from '../utils/http-client.js';
import { FileOperations } from '../utils/file-operations.js';
import { API_CONFIG, FILE_PATHS, ERROR_MESSAGES } from '../config/constants.js';

// Use centralized configuration
const httpClient = new HttpClient({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  retryAttempts: API_CONFIG.RETRY_ATTEMPTS
});

const DEFAULT_TYPES = API_CONFIG.DEFAULT_TYPES;

// Remove buildUrl function - now handled by HttpClient

// Remove getJson function - now handled by HttpClient

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
  // Use HttpClient for first page
  const first = await httpClient.get(`/v1/api/danh-sach/${type}`, { page: 1, limit: 64 });
  const items = extractItems(first);
  const totalPages = first?.paginate?.totalPages || first?.totalPages || (items.length ? 1 : 0);
  const all = [...items];

  // Fetch remaining pages
  for (let p = 2; p <= totalPages; p++) {
    const data = await httpClient.get(`/v1/api/danh-sach/${type}`, { page: p, limit: 64 });
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
  // Use constants for default values
  const opts = {
    types: 'all',
    out: `${FILE_PATHS.DATA_DIR}/${FILE_PATHS.MOVIES_FILE}`
  };

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

  // Use FileOperations utility for consistent file handling
  const outputData = {
    generatedAt: new Date().toISOString(),
    source: API_CONFIG.BASE_URL.replace('https://', ''),
    total: unique.length,
    items: unique,
  };

  await FileOperations.writeJSON(out, outputData, { ensureDir: true });
  console.log(`Saved ${unique.length} unique items to ${out}`);
})().catch((e) => {
  console.error('❌ Sync failed:', e.message);
  process.exit(1);
});