/**
 * HomePage Component
 * 
 * Main landing page với Banner 3D và Movie Grid
 * Hiển thị phim mới nhất, trending, và categories
 * 
 * Features:
 * - 3D Banner slider
 * - Animated movie cards
 * - Infinite scroll
 * - Category filtering
 * - Performance optimized
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Banner3D from '../components/Banner3D';
import MovieCard from '../components/MovieCard';
import ContinueWatchingSection from '../components/ContinueWatchingSection';
import { useFirebase } from '../contexts/FirebaseContext';
import { movieApi } from '../services/movieApi';
import type { Movie } from '../services/movieApi';
import './HomePage.css';
import './AnimeListPage.css';

// Movie type imported from movieApi service

const HomePage = () => {
  const [bannerMovies, setBannerMovies] = useState<Movie[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { saveMovie, isMovieSaved } = useFirebase();

  // Fetch movies from API using new service - Load nhiều pages ngay từ đầu
  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true);
        console.log('🎬 Fetching movies from API...');
        
        // Load 5 pages để có đủ phim hiển thị (khoảng 60-80 phim)
        const pagesToLoad = 5;
        let allMovies: Movie[] = [];
        
        for (let page = 1; page <= pagesToLoad; page++) {
          try {
            console.log(`📄 Loading page ${page}/${pagesToLoad}...`);
            const response = await movieApi.getNewMovies(page);
            
            if (response.status && response.items) {
              const pageMovies = response.items;
              console.log(`✅ Page ${page}: ${pageMovies.length} movies`);
              
              // Optimize images
              const optimizedMovies = pageMovies.map(movie => ({
                ...movie,
                poster_url: movieApi.optimizeImage(movie.poster_url),
                thumb_url: movieApi.optimizeImage(movie.thumb_url),
              }));
              
              allMovies = [...allMovies, ...optimizedMovies];
              
              // Check if there are more pages
              if (response.pagination) {
                const { currentPage: apiPage, totalPages } = response.pagination;
                
                // Stop early if no more pages
                if (apiPage >= totalPages) {
                  console.log(`🛑 Reached last page at ${apiPage}`);
                  break;
                }
              }
            } else {
              console.warn(`⚠️ Page ${page} returned no items`);
              break;
            }
          } catch (pageErr) {
            console.error(`❌ Error loading page ${page}:`, pageErr);
            // Continue with what we have
            break;
          }
        }
        
        if (allMovies.length > 0) {
          setMovies(allMovies);
          
          // Set top 5 movies for banner
          setBannerMovies(allMovies.slice(0, 5));
          console.log(`🎯 Banner: ${allMovies.slice(0, 5).length} movies`);
          console.log(`🎬 Total movies loaded: ${allMovies.length}`);
        } else {
          console.warn('⚠️ No movies loaded');
          setError('Không tìm thấy phim nào.');
        }

        setLoading(false);
      } catch (err) {
        console.error('❌ Failed to fetch movies:', err);
        setError('Không thể tải danh sách phim. Vui lòng thử lại sau.');
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  // Handle save movie
  const handleSaveMovie = async (movie: Movie) => {
    try {
      const saved = await isMovieSaved(movie.slug);
      if (saved) {
        alert('Phim đã có trong danh sách!');
        return;
      }

      await saveMovie(movie);
      alert(`Đã lưu "${movie.name}" vào danh sách yêu thích!`);
    } catch (error) {
      console.error('Failed to save movie:', error);
      alert('Không thể lưu phim. Vui lòng thử lại.');
    }
  };

  // Loading state
  if (loading) {
    return (
      <motion.div
        className="loading-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="loading-spinner"></div>
        <p className="loading-text">Đang tải nội dung tuyệt vời...</p>
      </motion.div>
    );
  }

  // Error state
  if (error) {
    return (
      <motion.div
        className="error-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="error-icon">❌</div>
        <h2 className="error-title">Oops! Đã có lỗi xảy ra</h2>
        <p className="error-message">{error}</p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          Tải lại trang
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="home-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Hero Banner với 3D effects */}
      {bannerMovies.length > 0 && (
        <Banner3D 
          movies={bannerMovies} 
          autoPlayInterval={5000}
        />
      )}

      {/* Continue Watching Section - Hiển thị phim đang xem */}
      <ContinueWatchingSection />

      {/* Main content */}
      <div className="container">
        {/* PHIM MỚI CẬP NHẬT - Luôn ở trên cùng */}
        <motion.section
          className="movie-section"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Section header với nút "Xem thêm" */}
          <div className="section-header-flex">
            <div className="section-title-group">
              <h2 className="section-title-large">
                <span className="title-icon">🔥</span>
                PHIM MỚI CẬP NHẬT
              </h2>
              <p className="section-description">
                Cập nhật liên tục những bộ phim mới nhất mỗi ngày
              </p>
            </div>
            <motion.a
              href="/category/phim-moi"
              className="btn-see-more"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Xem tất cả <span className="arrow">→</span>
            </motion.a>
          </div>

          {/* Movie grid với staggered animation */}
          <div className="anime-movies-grid">
            {movies.slice(0, 18).map((movie) => (
              <MovieCard
                key={movie._id || movie.slug}
                movie={movie}
                onSave={() => handleSaveMovie(movie)}
              />
            ))}
          </div>
        </motion.section>

        {/* PHIM ĐỀ CỪU / PHIM HOT */}
        {movies.length > 18 && (
          <motion.section
            className="movie-section"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <div className="section-header-flex">
              <div className="section-title-group">
                <h2 className="section-title-large">
                  <span className="title-icon">⭐</span>
                  PHIM ĐỀ CỬ
                </h2>
                <p className="section-description">
                  Những bộ phim được đánh giá cao và yêu thích nhất
                </p>
              </div>
              <motion.a
                href="/category/phim-de-cu"
                className="btn-see-more"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Xem tất cả <span className="arrow">→</span>
              </motion.a>
            </div>

            <div className="anime-movies-grid">
              {movies.slice(18, 36).map((movie) => (
                <MovieCard
                  key={movie._id || movie.slug}
                  movie={movie}
                  onSave={() => handleSaveMovie(movie)}
                />
              ))}
            </div>
          </motion.section>
        )}

        {/* PHIM BỘ HOT */}
        {movies.filter(m => m.type === 'series').length > 0 && (
          <motion.section
            className="movie-section"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <div className="section-header-flex">
              <div className="section-title-group">
                <h2 className="section-title-large">
                  <span className="title-icon">📺</span>
                  PHIM BỘ HOT
                </h2>
                <p className="section-description">
                  Những bộ phim dài tập hấp dẫn nhất
                </p>
              </div>
              <motion.a
                href="/category/phim-bo"
                className="btn-see-more"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Xem tất cả <span className="arrow">→</span>
              </motion.a>
            </div>

            <div className="anime-movies-grid">
              {movies.filter(m => m.type === 'series').slice(0, 12).map((movie) => (
                <MovieCard
                  key={movie._id || movie.slug}
                  movie={movie}
                  onSave={() => handleSaveMovie(movie)}
                />
              ))}
            </div>
          </motion.section>
        )}

        {/* PHIM LẺ HOT */}
        {movies.filter(m => m.type === 'single').length > 0 && (
          <motion.section
            className="movie-section"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <div className="section-header-flex">
              <div className="section-title-group">
                <h2 className="section-title-large">
                  <span className="title-icon">🎬</span>
                  PHIM LẺ HOT
                </h2>
                <p className="section-description">
                  Những bộ phim điện ảnh chất lượng cao
                </p>
              </div>
              <motion.a
                href="/category/phim-le"
                className="btn-see-more"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Xem tất cả <span className="arrow">→</span>
              </motion.a>
            </div>

            <div className="anime-movies-grid">
              {movies.filter(m => m.type === 'single').slice(0, 12).map((movie) => (
                <MovieCard
                  key={movie._id || movie.slug}
                  movie={movie}
                  onSave={() => handleSaveMovie(movie)}
                />
              ))}
            </div>
          </motion.section>
        )}

        {/* PHIM CHIẾU RẠP */}
        {movies.filter(m => m.chieurap).length > 0 && (
          <motion.section
            className="movie-section"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <div className="section-header-flex">
              <div className="section-title-group">
                <h2 className="section-title-large">
                  <span className="title-icon">🎬</span>
                  PHIM CHIẾU RẠP
                </h2>
                <p className="section-description">
                  Những bộ phim đang hot tại rạp chiếu
                </p>
              </div>
              <motion.a
                href="/category/phim-chieu-rap"
                className="btn-see-more"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Xem tất cả <span className="arrow">→</span>
              </motion.a>
            </div>

            <div className="anime-movies-grid">
              {movies.filter(m => m.chieurap).slice(0, 12).map((movie) => (
                <MovieCard
                  key={movie._id || movie.slug}
                  movie={movie}
                  onSave={() => handleSaveMovie(movie)}
                />
              ))}
            </div>
          </motion.section>
        )}

        {/* PHIM HOT - Hiển thị phim đa dạng */}
        {movies.length > 36 && (
          <motion.section
            className="movie-section"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <div className="section-header-flex">
              <div className="section-title-group">
                <h2 className="section-title-large">
                  <span className="title-icon">🎬</span>
                  PHIM HOT
                </h2>
                <p className="section-description">
                  Những bộ phim đang thịnh hành và được yêu thích
                </p>
              </div>
            </div>

            <div className="anime-movies-grid">
              {movies.slice(36, 54).map((movie) => (
                <MovieCard
                  key={movie._id || movie.slug}
                  movie={movie}
                  onSave={() => handleSaveMovie(movie)}
                />
              ))}
            </div>
          </motion.section>
        )}



        {/* Categories preview */}
        <motion.div
          className="categories-section"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h3 className="categories-title">Thể loại phổ biến</h3>
          <div className="categories-grid">
            {[
              { name: 'Hành động', icon: '⚔️', slug: 'hanh-dong' },
              { name: 'Phiêu lưu', icon: '🗺️', slug: 'phieu-luu' },
              { name: 'Hài hước', icon: '😄', slug: 'hai-huoc' },
              { name: 'Học đường', icon: '🎓', slug: 'hoc-duong' },
              { name: 'Lãng mạn', icon: '💕', slug: 'lang-man' },
              { name: 'Siêu nhiên', icon: '✨', slug: 'sieu-nhien' },
            ].map((category) => (
              <motion.a
                key={category.slug}
                href={`/category/${category.slug}`}
                className="category-card"
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="category-icon">{category.icon}</span>
                <span className="category-name">{category.name}</span>
              </motion.a>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default HomePage;

