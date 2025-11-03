/**
 * CategoryPage Component
 * 
 * Browse movies by category/genre
 * Dynamic route: /category/:slug
 * 
 * Features:
 * - Pagination support
 * - Filter by year, country
 * - Sort options
 * - Grid layout
 */

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import MovieCard3D from '../components/MovieCard3D';
import { movieApi } from '../services/movieApi';
import type { Movie } from '../services/movieApi';

const CategoryPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1');
  
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryName, setCategoryName] = useState('');
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchMovies = async () => {
      if (!slug) return;
      
      try {
        setLoading(true);
        const response = await movieApi.getMoviesByCategory(slug, {
          page,
          limit: 24,
          sort_field: 'modified.time',
          sort_type: 'desc',
        });
        
        if (response.status && response.data?.items) {
          const optimizedMovies = response.data.items.map(movie => ({
            ...movie,
            poster_url: movieApi.optimizeImage(movie.poster_url),
            thumb_url: movieApi.optimizeImage(movie.thumb_url),
          }));
          setMovies(optimizedMovies);
          
          // Extract category name from breadcrumb
          if (response.data.breadCrumb && response.data.breadCrumb.length > 0) {
            const currentCrumb = response.data.breadCrumb.find(b => b.isCurrent);
            if (currentCrumb) {
              setCategoryName(currentCrumb.name);
            }
          }
          
          // Set pagination
          if (response.data.params?.pagination) {
            setTotalPages(response.data.params.pagination.totalPages || 1);
          }
        } else {
          setMovies([]);
        }
      } catch (error) {
        console.error('Failed to fetch category movies:', error);
        setMovies([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMovies();
  }, [slug, page]);

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
      className="container"
      style={{ padding: '40px 20px' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Header */}
      <motion.div
        style={{ marginBottom: '40px' }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 style={{ fontSize: '36px', marginBottom: '10px' }}>
          🎬 {categoryName || slug}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '16px' }}>
          {movies.length > 0 ? `${movies.length} phim` : 'Không có phim nào'}
        </p>
      </motion.div>

      {/* Movies Grid */}
      {movies.length > 0 ? (
        <>
          <div className="movies-grid">
            {movies.map((movie, index) => (
              <motion.div
                key={movie.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <MovieCard3D movie={movie} />
              </motion.div>
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
          style={{ textAlign: 'center', padding: '60px 20px' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎭</div>
          <h2 style={{ marginBottom: '10px' }}>Không có phim nào</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            Thể loại này chưa có phim
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default CategoryPage;

