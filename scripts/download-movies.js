/**
 * Script tải phim từ KKPhim API và phân loại theo thể loại
 * Sử dụng với số lượng 23,967 phim từ kkphim.vip
 */

const fs = require('fs');
const path = require('path');

const API_BASE = 'https://phimapi.com';
const OUTPUT_DIR = path.join(__dirname, '../data');
const BATCH_SIZE = 3; // Số request đồng thời
const DELAY_BETWEEN_BATCHES = 1000; // 1 giây

// Danh sách thể loại từ KKPhim
const CATEGORIES = [
  { name: 'Hành Động', slug: 'hanh-dong' },
  { name: 'Cổ Trang', slug: 'co-trang' },
  { name: 'Chiến Tranh', slug: 'chien-tranh' },
  { name: 'Viễn Tưởng', slug: 'vien-tuong' },
  { name: 'Kinh Dị', slug: 'kinh-di' },
  { name: 'Tài Liệu', slug: 'tai-lieu' },
  { name: 'Bí Ẩn', slug: 'bi-an' },
  { name: 'Phim 18+', slug: 'phim-18' },
  { name: 'Tình Cảm', slug: 'tinh-cam' },
  { name: 'Tâm Lý', slug: 'tam-ly' },
  { name: 'Thể Thao', slug: 'the-thao' },
  { name: 'Phiêu Lưu', slug: 'phieu-luu' },
  { name: 'Âm Nhạc', slug: 'am-nhac' },
  { name: 'Gia Đình', slug: 'gia-dinh' },
  { name: 'Học Đường', slug: 'hoc-duong' },
  { name: 'Hài Hước', slug: 'hai-huoc' },
  { name: 'Hình Sự', slug: 'hinh-su' },
  { name: 'Võ Thuật', slug: 'vo-thuat' },
  { name: 'Khoa Học', slug: 'khoa-hoc' },
  { name: 'Thần Thoại', slug: 'than-thoai' },
  { name: 'Chính Kịch', slug: 'chinh-kich' },
  { name: 'Kinh Điển', slug: 'kinh-dien' }
];

class MovieDownloader {
  constructor() {
    this.allMovies = [];
    this.categorizedMovies = {};
    this.errors = [];

    // Khởi tạo categories
    CATEGORIES.forEach((cat) => {
      this.categorizedMovies[cat.slug] = {
        name: cat.name,
        slug: cat.slug,
        movies: []
      };
    });
  }

  async fetchWithRetry(url, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        console.log(`📡 Tải: ${url} (lần ${i + 1})`);
        const response = await fetch(url, {
          headers: { Accept: 'application/json' }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        return await response.json();
      } catch (error) {
        console.log(`❌ Lỗi: ${error.message}`);
        if (i === retries - 1) throw error;
        await this.delay(1000 * (i + 1));
      }
    }
  }

  async delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async downloadMoviesPage(page) {
    try {
      const url = `${API_BASE}/danh-sach/phim-moi-cap-nhat?page=${page}`;
      const data = await this.fetchWithRetry(url);

      if (data.items && Array.isArray(data.items)) {
        console.log(`✅ Trang ${page}: ${data.items.length} phim`);
        return { items: data.items, pagination: data.pagination };
      }

      return { items: [], pagination: null };
    } catch (error) {
      console.error(`❌ Lỗi trang ${page}:`, error.message);
      this.errors.push({ page, error: error.message });
      return { items: [], pagination: null };
    }
  }

  async downloadAllMovies() {
    console.log('🚀 Bắt đầu tải toàn bộ phim từ KKPhim...');

    // Lấy trang đầu để biết tổng số trang
    const firstPage = await this.downloadMoviesPage(1);
    if (!firstPage.pagination) {
      throw new Error('Không thể lấy thông tin phân trang');
    }

    const totalPages = firstPage.pagination.totalPages;
    const totalItems = firstPage.pagination.totalItems;

    console.log(`📊 Tổng số: ${totalItems} phim trên ${totalPages} trang`);

    this.allMovies.push(...firstPage.items);

    // Tạo danh sách các trang cần tải (bỏ trang 1 đã tải)
    const pagesToDownload = [];
    for (let page = 2; page <= Math.min(totalPages, 100); page++) {
      // Giới hạn 100 trang để test
      pagesToDownload.push(page);
    }

    // Tải theo batch
    for (let i = 0; i < pagesToDownload.length; i += BATCH_SIZE) {
      const batch = pagesToDownload.slice(i, i + BATCH_SIZE);

      console.log(
        `🔄 Batch ${Math.floor(i / BATCH_SIZE) + 1}: Trang ${batch.join(', ')}`
      );

      const promises = batch.map((page) => this.downloadMoviesPage(page));
      const results = await Promise.allSettled(promises);

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          this.allMovies.push(...result.value.items);
        }
      });

      const progress = Math.round(
        ((i + BATCH_SIZE) / pagesToDownload.length) * 100
      );
      console.log(`📈 Tiến độ: ${progress}% - ${this.allMovies.length} phim`);

      // Nghỉ giữa các batch
      if (i + BATCH_SIZE < pagesToDownload.length) {
        await this.delay(DELAY_BETWEEN_BATCHES);
      }
    }

    console.log(`✅ Hoàn thành tải ${this.allMovies.length} phim`);
  }

  categorizeMovies() {
    console.log('🏷️  Đang phân loại phim theo thể loại...');

    this.allMovies.forEach((movie) => {
      const categories = movie.category || [];
      categories.forEach((cat) => {
        if (this.categorizedMovies[cat.slug]) {
          this.categorizedMovies[cat.slug].movies.push(movie);
        }
      });
    });

    // Thống kê
    Object.values(this.categorizedMovies).forEach((category) => {
      console.log(`📁 ${category.name}: ${category.movies.length} phim`);
    });
  }

  async saveData() {
    // Đảm bảo thư mục tồn tại
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Lưu tất cả phim
    const allMoviesData = {
      downloaded_at: new Date().toISOString(),
      total_movies: this.allMovies.length,
      source: 'KKPhim API (phimapi.com)',
      items: this.allMovies
    };

    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'kho-phim.json'),
      JSON.stringify(allMoviesData, null, 2)
    );
    console.log(`💾 Đã lưu ${this.allMovies.length} phim vào kho-phim.json`);

    // Lưu từng thể loại
    Object.values(this.categorizedMovies).forEach((category) => {
      if (category.movies.length > 0) {
        const categoryData = {
          name: category.name,
          slug: category.slug,
          total_movies: category.movies.length,
          movies: category.movies
        };

        const filename = `the-loai-${category.slug}.json`;
        fs.writeFileSync(
          path.join(OUTPUT_DIR, filename),
          JSON.stringify(categoryData, null, 2)
        );
        console.log(
          `💾 Đã lưu ${category.movies.length} phim ${category.name} vào ${filename}`
        );
      }
    });

    // Lưu thống kê
    const stats = {
      total_movies: this.allMovies.length,
      categories: Object.values(this.categorizedMovies)
        .map((cat) => ({
          name: cat.name,
          slug: cat.slug,
          count: cat.movies.length
        }))
        .sort((a, b) => b.count - a.count),
      errors: this.errors,
      generated_at: new Date().toISOString()
    };

    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'thong-ke.json'),
      JSON.stringify(stats, null, 2)
    );
    console.log('📊 Đã lưu thống kê vào thong-ke.json');
  }

  async run() {
    try {
      await this.downloadAllMovies();
      this.categorizeMovies();
      await this.saveData();

      console.log('🎉 Hoàn thành! Tất cả phim đã được tải và phân loại.');
      console.log('📈 Thống kê:');
      console.log(`   - Tổng phim: ${this.allMovies.length}`);
      console.log(`   - Lỗi: ${this.errors.length}`);
      console.log(
        `   - Thể loại có phim: ${Object.values(this.categorizedMovies).filter((c) => c.movies.length > 0).length}`
      );
    } catch (error) {
      console.error('💥 Lỗi:', error.message);
      process.exit(1);
    }
  }
}

// Chạy nếu được gọi trực tiếp
if (require.main === module) {
  const downloader = new MovieDownloader();
  downloader.run();
}

module.exports = MovieDownloader;
