/**
 * AnimeListPage Component
 * 
 * Trang hiển thị danh sách phim hoạt hình/anime với pagination
 * 
 * Features:
 * - Pagination (page 1, 2, 3...)
 * - Year and Country filters
 * - Fast loading
 */

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingSpinner from '../components/LoadingSpinner';
import MovieCard from '../components/MovieCard';
import { movieApi } from '../services/movieApi';
import type { Movie } from '../services/movieApi';
import { useFirebase } from '../contexts/FirebaseContext';
import './AnimeListPage.css';

const ANIME_FILTERS = {
  year: [
    { name: '2025', value: '2025' },
    { name: '2024', value: '2024' },
    { name: '2023', value: '2023' },
    { name: '2022', value: '2022' },
    { name: '2021', value: '2021' },
    { name: '2020', value: '2020' },
    { name: '2010-2019', value: '2010-2019' },
    { name: 'Cũ hơn', value: 'classic' },
  ],
  country: [
    { name: '🇯🇵 Nhật Bản', value: 'nhat-ban', slug: 'nhat-ban' },
    { name: '🇨🇳 Trung Quốc', value: 'trung-quoc', slug: 'trung-quoc' },
    { name: '🇰🇷 Hàn Quốc', value: 'han-quoc', slug: 'han-quoc' },
    { name: '🇺🇸 Âu Mỹ', value: 'au-my', slug: 'au-my' },
    { name: '🇭🇰 Hồng Kông', value: 'hong-kong', slug: 'hong-kong' },
    { name: '🇹🇭 Thái Lan', value: 'thai-lan', slug: 'thai-lan' },
    { name: '🇫🇷 Pháp', value: 'phap', slug: 'phap' },
    { name: '🇬🇧 Anh', value: 'anh', slug: 'anh' },
    { name: '🇨🇦 Canada', value: 'canada', slug: 'canada' },
    { name: '🇦🇺 Úc', value: 'uc', slug: 'uc' },
    { name: '🇮🇳 Ấn Độ', value: 'an-do', slug: 'an-do' },
    { name: '🇲🇾 Malaysia', value: 'malaysia', slug: 'malaysia' },
    { name: '🇲🇽 Mexico', value: 'mexico', slug: 'mexico' },
    { name: '🇵🇱 Ba Lan', value: 'ba-lan', slug: 'ba-lan' },
    { name: '🇮🇪 Ireland', value: 'ireland', slug: 'ireland' },
    { name: '🇫🇮 Phần Lan', value: 'phan-lan', slug: 'phan-lan' },
    { name: '🇨🇿 Séc', value: 'sec', slug: 'sec' },
    { name: '🇸🇰 Slovakia', value: 'slovakia', slug: 'slovakia' },
    { name: '🇮🇷 Iran', value: 'iran', slug: 'iran' },
  ],
};

const AnimeListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parseInt(searchParams.get('page') || '1');
  const yearFilter = searchParams.get('year') || '';
  const countryFilter = searchParams.get('country') || '';
  
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const { saveMovie, isMovieSaved } = useFirebase();

  // Load anime movies với pagination
  useEffect(() => {
    const loadAnimeMovies = async () => {
      try {
        setLoading(true);
        console.log(`🎌 Loading anime page ${currentPage}, year: ${yearFilter}, country: ${countryFilter}`);
        
        const response = await movieApi.getMoviesByType('hoat-hinh', {
          page: currentPage,
          limit: 24,
          year: yearFilter ? parseInt(yearFilter) : undefined,
          country: countryFilter || undefined,
          sort_field: 'modified.time',
          sort_type: 'desc',
        });
        
        if (response && response.status && response.data?.items) {
          const optimizedMovies = response.data.items.map(movie => ({
            ...movie,
            poster_url: movieApi.optimizeImage(movie.poster_url),
            thumb_url: movieApi.optimizeImage(movie.thumb_url),
          }));
          
          setMovies(optimizedMovies);
          
          // Set pagination from API
          if (response.data.params?.pagination) {
            setTotalPages(response.data.params.pagination.totalPages || 1);
          }
        } else {
          setMovies([]);
        }
      } catch (error) {
        console.error('❌ Failed to load anime:', error);
        setMovies([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadAnimeMovies();
  }, [currentPage, yearFilter, countryFilter]);

  const handleFilterChange = (filterType: 'year' | 'country', value: string) => {
    const params: any = { page: '1' }; // Reset to page 1 when filter changes
    
    // Keep other filters
    if (filterType === 'year') {
      if (value && value !== yearFilter) params.year = value;
      if (countryFilter) params.country = countryFilter;
    } else {
      if (yearFilter) params.year = yearFilter;
      if (value && value !== countryFilter) params.country = value;
    }
    
    setSearchParams(params);
  };

  const clearAllFilters = () => {
    setSearchParams({ page: '1' });
  };

  const handlePageChange = (newPage: number) => {
    const params: any = { page: newPage.toString() };
    if (yearFilter) params.year = yearFilter;
    if (countryFilter) params.country = countryFilter;
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveMovie = (movie: Movie) => {
    (async () => {
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
    })();
  };

  if (loading) {
    return <LoadingSpinner size="large" text="Đang tải phim hoạt hình..." />;
  }

  return (
    <div className="anime-list-page">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="anime-header"
      >
        <div className="container">
          <h1 className="anime-title">
            <span className="anime-icon">🎌</span>
            Phim Hoạt Hình & Anime
          </h1>

          {/* Filters */}
          <div className="anime-filters">
            <div className="filter-dropdown">
              <button
                className={`filter-btn ${yearFilter || countryFilter ? 'active' : ''}`}
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              >
                <span>🎯 Bộ lọc</span>
                <span className="dropdown-arrow">▼</span>
              </button>

              <AnimatePresence>
                {showFilterDropdown && (
                  <motion.div
                    className="dropdown-content other-filters"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    {/* Year Filter */}
                    <div className="filter-section">
                      <h4>📅 Năm phát hành</h4>
                      <div className="filter-options">
                        {ANIME_FILTERS.year.map(year => (
                          <button
                            key={year.value}
                            className={`filter-option ${yearFilter === year.value ? 'active' : ''}`}
                            onClick={() => handleFilterChange('year', year.value)}
                          >
                            {year.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Country Filter */}
                    <div className="filter-section">
                      <h4>🌏 Quốc gia</h4>
                      <div className="filter-options">
                        {ANIME_FILTERS.country.map(country => (
                          <button
                            key={country.value}
                            className={`filter-option ${countryFilter === country.value ? 'active' : ''}`}
                            onClick={() => handleFilterChange('country', country.value)}
                          >
                            {country.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Clear Filters Button */}
            {(yearFilter || countryFilter) && (
              <motion.button
                className="clear-filters-btn"
                onClick={clearAllFilters}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                🗑️ Xóa bộ lọc
              </motion.button>
            )}
          </div>

          {/* Active Filters Display */}
          <div className="active-filters">
            {yearFilter && (
              <span className="active-filter-tag">
                Năm: {yearFilter}
                <button onClick={() => handleFilterChange('year', '')}>×</button>
              </span>
            )}
            {countryFilter && (
              <span className="active-filter-tag">
                Quốc gia: {ANIME_FILTERS.country.find(c => c.value === countryFilter)?.name || countryFilter}
                <button onClick={() => handleFilterChange('country', '')}>×</button>
              </span>
            )}
          </div>

          <p className="category-count" style={{ marginTop: '20px', fontSize: '16px', color: 'var(--text-muted)' }}>
            Trang {currentPage} / {totalPages}
          </p>
        </div>
      </motion.div>

      {/* Movies Grid */}
      <div className="container">
        {movies.length > 0 ? (
          <>
            <div className="anime-movies-grid">
              {movies.map((movie) => (
                <MovieCard
                  key={movie._id || movie.slug}
                  movie={movie}
                  onSave={handleSaveMovie}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <motion.div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '10px',
                  marginTop: '40px',
                  flexWrap: 'wrap',
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {currentPage > 1 && (
                  <motion.button
                    className="btn btn-secondary"
                    onClick={() => handlePageChange(currentPage - 1)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '8px',
                      background: 'var(--card)',
                      border: '1px solid var(--border)',
                      color: 'var(--text)',
                      cursor: 'pointer',
                    }}
                  >
                    ← Trang trước
                  </motion.button>
                )}
                
                <span style={{
                  padding: '10px 20px',
                  background: 'var(--card)',
                  borderRadius: '8px',
                  border: '2px solid var(--primary)',
                  color: 'var(--primary)',
                  fontWeight: 'bold',
                }}>
                  {currentPage} / {totalPages}
                </span>

                {currentPage < totalPages && (
                  <motion.button
                    className="btn btn-secondary"
                    onClick={() => handlePageChange(currentPage + 1)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '8px',
                      background: 'var(--card)',
                      border: '1px solid var(--border)',
                      color: 'var(--text)',
                      cursor: 'pointer',
                    }}
                  >
                    Trang sau →
                  </motion.button>
                )}
              </motion.div>
            )}
          </>
        ) : (
          <div className="no-results">
            <span className="no-results-icon">🎌</span>
            <h3>Không tìm thấy phim hoạt hình/anime</h3>
            <p>Thử thay đổi bộ lọc hoặc trang khác</p>
            {(yearFilter || countryFilter) && (
              <button onClick={clearAllFilters} className="reset-btn">
                🔄 Xóa bộ lọc và thử lại
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnimeListPage;
