/**
 * TypePage Component
 * 
 * Browse movies by type (phim-bo, phim-le, hoat-hinh, tv-shows)
 * Dynamic route: /danh-sach/:type
 */

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import MovieCard from '../components/MovieCard';
import { movieApi } from '../services/movieApi';
import type { Movie } from '../services/movieApi';
import './AnimeListPage.css';

const TypePage = () => {
  const { type } = useParams<{ type: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1');
  
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);

  // Map type slug to display name
  const getTypeName = () => {
    switch (type) {
      case 'phim-bo': return 'Phim Bộ';
      case 'phim-le': return 'Phim Lẻ';
      case 'hoat-hinh': return 'Phim Hoạt Hình';
      case 'tv-shows': return 'TV Shows';
      case 'phim-vietsub': return 'Phim Vietsub';
      case 'phim-thuyet-minh': return 'Phim Thuyết Minh';
      case 'phim-long-tieng': return 'Phim Lồng Tiếng';
      default: return type;
    }
  };

  useEffect(() => {
    const fetchMovies = async () => {
      if (!type) return;
      
      // Validate type
      const validTypes = ['phim-bo', 'phim-le', 'tv-shows', 'hoat-hinh', 'phim-vietsub', 'phim-thuyet-minh', 'phim-long-tieng'];
      if (!validTypes.includes(type)) {
        console.error('Invalid type:', type);
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const response = await movieApi.getMoviesByType(
          type as any,
          {
            page,
            limit: 24,
            sort_field: 'modified.time',
            sort_type: 'desc',
          }
        );
        
        if (response.status && response.data?.items) {
          const optimizedMovies = response.data.items.map(movie => ({
            ...movie,
            poster_url: movieApi.optimizeImage(movie.poster_url),
            thumb_url: movieApi.optimizeImage(movie.thumb_url),
          }));
          setMovies(optimizedMovies);
          
          // Set pagination
          if (response.data.params?.pagination) {
            setTotalPages(response.data.params.pagination.totalPages || 1);
          }
        } else {
          setMovies([]);
        }
      } catch (error) {
        console.error('Failed to fetch movies:', error);
        setMovies([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMovies();
  }, [type, page]);

  const handlePageChange = (newPage: number) => {
    setSearchParams({ page: newPage.toString() });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <motion.div
        className="loading-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="loading-spinner"></div>
        <p>Đang tải phim...</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="anime-list-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Header */}
      <motion.div
        className="anime-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="container">
          <h1 className="anime-title">
            <span className="anime-icon">🎬</span>
            {getTypeName()}
          </h1>
          <p className="category-count" style={{ marginTop: '20px', fontSize: '16px', color: 'var(--text-muted)' }}>
            Trang {page} / {totalPages}
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
                />
              ))}
            </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <motion.div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '10px',
                marginTop: '40px',
                flexWrap: 'wrap',
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {page > 1 && (
                <motion.button
                  className="btn btn-secondary"
                  onClick={() => handlePageChange(page - 1)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  ← Trang trước
                </motion.button>
              )}
              
              <span style={{
                padding: '10px 20px',
                background: 'var(--card)',
                borderRadius: '8px',
                border: '1px solid var(--border)',
              }}>
                Trang {page} / {totalPages}
              </span>

              {page < totalPages && (
                <motion.button
                  className="btn btn-secondary"
                  onClick={() => handlePageChange(page + 1)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Trang sau →
                </motion.button>
              )}
            </motion.div>
          )}
        </>
      ) : (
        <motion.div
          className="no-results"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <span className="no-results-icon">🎭</span>
          <h3>Không có phim nào</h3>
          <p>Loại phim này chưa có dữ liệu</p>
        </motion.div>
      )}
      </div>
    </motion.div>
  );
};

export default TypePage;
