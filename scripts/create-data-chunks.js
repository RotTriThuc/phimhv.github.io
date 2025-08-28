/**
 * 📦 Data Chunking Script
 * Chia kho-phim.json 14.5MB thành các chunks nhỏ để tối ưu loading
 */

import fs from 'fs';
import path from 'path';

const ITEMS_PER_CHUNK = 100;
const INPUT_FILE = './data/kho-phim.json';
const OUTPUT_DIR = './data/chunks';

async function createDataChunks() {
  try {
    console.log('📦 Starting data chunking process...');
    
    // Read original data
    console.log('📖 Reading kho-phim.json...');
    const rawData = fs.readFileSync(INPUT_FILE, 'utf8');
    const movies = JSON.parse(rawData);
    
    console.log(`📊 Found ${movies.length} movies (${(rawData.length / 1024 / 1024).toFixed(2)} MB)`);
    
    // Create output directory
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
      console.log(`📁 Created directory: ${OUTPUT_DIR}`);
    }
    
    // Calculate chunks
    const totalChunks = Math.ceil(movies.length / ITEMS_PER_CHUNK);
    console.log(`📦 Creating ${totalChunks} chunks (${ITEMS_PER_CHUNK} items each)...`);
    
    let totalSize = 0;
    const chunkInfo = [];
    
    // Create chunks
    for (let i = 0; i < totalChunks; i++) {
      const startIndex = i * ITEMS_PER_CHUNK;
      const endIndex = Math.min(startIndex + ITEMS_PER_CHUNK, movies.length);
      const chunkMovies = movies.slice(startIndex, endIndex);
      
      const chunkData = {
        page: i + 1,
        items: chunkMovies,
        totalItems: movies.length,
        itemsInPage: chunkMovies.length,
        hasNext: endIndex < movies.length,
        hasPrev: i > 0,
        startIndex,
        endIndex: endIndex - 1
      };
      
      const chunkJson = JSON.stringify(chunkData, null, 2);
      const chunkFile = path.join(OUTPUT_DIR, `page-${i + 1}.json`);
      
      fs.writeFileSync(chunkFile, chunkJson);
      
      const chunkSize = chunkJson.length;
      totalSize += chunkSize;
      
      chunkInfo.push({
        page: i + 1,
        file: `page-${i + 1}.json`,
        items: chunkMovies.length,
        size: chunkSize,
        sizeKB: Math.round(chunkSize / 1024)
      });
      
      console.log(`✅ Created chunk ${i + 1}/${totalChunks}: ${chunkMovies.length} items, ${Math.round(chunkSize / 1024)} KB`);
    }
    
    // Create metadata file
    const metadata = {
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      totalItems: movies.length,
      totalChunks,
      itemsPerChunk: ITEMS_PER_CHUNK,
      originalSize: rawData.length,
      chunkedSize: totalSize,
      compressionRatio: ((rawData.length - totalSize) / rawData.length * 100).toFixed(2),
      chunks: chunkInfo,
      categories: extractCategories(movies),
      years: extractYears(movies),
      countries: extractCountries(movies),
      stats: {
        avgMoviesPerYear: calculateAvgMoviesPerYear(movies),
        topCategories: getTopCategories(movies, 10),
        topCountries: getTopCountries(movies, 10)
      }
    };
    
    const metadataFile = path.join(OUTPUT_DIR, 'metadata.json');
    fs.writeFileSync(metadataFile, JSON.stringify(metadata, null, 2));
    
    console.log('\n📊 Chunking Summary:');
    console.log(`├── Original size: ${(rawData.length / 1024 / 1024).toFixed(2)} MB`);
    console.log(`├── Chunked size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`├── Compression: ${metadata.compressionRatio}%`);
    console.log(`├── Total chunks: ${totalChunks}`);
    console.log(`├── Avg chunk size: ${Math.round(totalSize / totalChunks / 1024)} KB`);
    console.log(`└── Metadata file: ${Math.round(JSON.stringify(metadata).length / 1024)} KB`);
    
    // Create index file for easy access
    const indexContent = `
/**
 * 📦 Data Chunks Index
 * Generated automatically by create-data-chunks.js
 */

export const CHUNK_CONFIG = {
  totalItems: ${movies.length},
  totalChunks: ${totalChunks},
  itemsPerChunk: ${ITEMS_PER_CHUNK},
  baseUrl: './data/chunks/',
  metadataUrl: './data/chunks/metadata.json'
};

export const CHUNK_INFO = ${JSON.stringify(chunkInfo, null, 2)};

export function getChunkUrl(pageNumber) {
  if (pageNumber < 1 || pageNumber > ${totalChunks}) {
    throw new Error(\`Invalid page number: \${pageNumber}. Must be between 1 and ${totalChunks}\`);
  }
  return \`\${CHUNK_CONFIG.baseUrl}page-\${pageNumber}.json\`;
}

export function getPageForIndex(itemIndex) {
  return Math.floor(itemIndex / ${ITEMS_PER_CHUNK}) + 1;
}

export function getIndexRange(pageNumber) {
  const startIndex = (pageNumber - 1) * ${ITEMS_PER_CHUNK};
  const endIndex = Math.min(startIndex + ${ITEMS_PER_CHUNK}, ${movies.length});
  return { startIndex, endIndex };
}
`;
    
    fs.writeFileSync('./data/chunks-index.js', indexContent);
    
    console.log('\n✅ Data chunking completed successfully!');
    console.log(`📁 Files created in: ${OUTPUT_DIR}`);
    console.log(`📋 Index file: ./data/chunks-index.js`);
    
    return {
      success: true,
      totalChunks,
      totalSize,
      compressionRatio: metadata.compressionRatio,
      metadata
    };
    
  } catch (error) {
    console.error('❌ Data chunking failed:', error);
    throw error;
  }
}

/**
 * Extract unique categories
 */
function extractCategories(movies) {
  const categories = new Set();
  movies.forEach(movie => {
    if (movie.category && Array.isArray(movie.category)) {
      movie.category.forEach(cat => {
        if (cat.name) categories.add(cat.name);
      });
    }
  });
  return Array.from(categories).sort();
}

/**
 * Extract unique years
 */
function extractYears(movies) {
  const years = new Set();
  movies.forEach(movie => {
    if (movie.year) years.add(movie.year);
  });
  return Array.from(years).sort((a, b) => b - a);
}

/**
 * Extract unique countries
 */
function extractCountries(movies) {
  const countries = new Set();
  movies.forEach(movie => {
    if (movie.country && Array.isArray(movie.country)) {
      movie.country.forEach(country => {
        if (country.name) countries.add(country.name);
      });
    }
  });
  return Array.from(countries).sort();
}

/**
 * Calculate average movies per year
 */
function calculateAvgMoviesPerYear(movies) {
  const yearCounts = {};
  movies.forEach(movie => {
    if (movie.year) {
      yearCounts[movie.year] = (yearCounts[movie.year] || 0) + 1;
    }
  });
  
  const years = Object.keys(yearCounts);
  const totalMovies = Object.values(yearCounts).reduce((sum, count) => sum + count, 0);
  
  return years.length > 0 ? Math.round(totalMovies / years.length) : 0;
}

/**
 * Get top categories by movie count
 */
function getTopCategories(movies, limit = 10) {
  const categoryCounts = {};
  
  movies.forEach(movie => {
    if (movie.category && Array.isArray(movie.category)) {
      movie.category.forEach(cat => {
        if (cat.name) {
          categoryCounts[cat.name] = (categoryCounts[cat.name] || 0) + 1;
        }
      });
    }
  });
  
  return Object.entries(categoryCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));
}

/**
 * Get top countries by movie count
 */
function getTopCountries(movies, limit = 10) {
  const countryCounts = {};
  
  movies.forEach(movie => {
    if (movie.country && Array.isArray(movie.country)) {
      movie.country.forEach(country => {
        if (country.name) {
          countryCounts[country.name] = (countryCounts[country.name] || 0) + 1;
        }
      });
    }
  });
  
  return Object.entries(countryCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));
}

/**
 * Verify chunks integrity
 */
async function verifyChunks() {
  try {
    console.log('🔍 Verifying chunks integrity...');
    
    const metadata = JSON.parse(fs.readFileSync(path.join(OUTPUT_DIR, 'metadata.json'), 'utf8'));
    let totalItems = 0;
    
    for (let i = 1; i <= metadata.totalChunks; i++) {
      const chunkFile = path.join(OUTPUT_DIR, `page-${i}.json`);
      
      if (!fs.existsSync(chunkFile)) {
        throw new Error(`Missing chunk file: page-${i}.json`);
      }
      
      const chunkData = JSON.parse(fs.readFileSync(chunkFile, 'utf8'));
      totalItems += chunkData.items.length;
      
      if (chunkData.page !== i) {
        throw new Error(`Page number mismatch in chunk ${i}`);
      }
    }
    
    if (totalItems !== metadata.totalItems) {
      throw new Error(`Item count mismatch: expected ${metadata.totalItems}, got ${totalItems}`);
    }
    
    console.log('✅ Chunks integrity verified successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Chunks verification failed:', error);
    return false;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createDataChunks()
    .then(async (result) => {
      console.log('\n🔍 Running verification...');
      const verified = await verifyChunks();
      
      if (verified) {
        console.log('\n🎉 All done! Data chunking completed successfully.');
        console.log('\nNext steps:');
        console.log('1. Test with: node -e "import(\'./data/chunks-index.js\').then(console.log)"');
        console.log('2. Update your app to use data pagination');
        console.log('3. Deploy chunks to your server');
      } else {
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Process failed:', error);
      process.exit(1);
    });
}

export { createDataChunks, verifyChunks };
