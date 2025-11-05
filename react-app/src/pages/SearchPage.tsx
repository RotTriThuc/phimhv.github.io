import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import MovieCard from '../components/MovieCard';
import { movieApi } from '../services/movieApi';
import type { Movie } from '../services/movieApi';
import './AnimeListPage.css';

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMovies = async () => {
      if (!query) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const response = await movieApi.searchMovies({
          keyword: query,
          page: 1,
          limit: 24,
          sort_field: 'modified.time',
          sort_type: 'desc',
        });
        
        if (response.status && response.data?.items) {
          // Optimize images to WebP
          const optimizedMovies = response.data.items.map(movie => ({
            ...movie,
            poster_url: movieApi.optimizeImage(movie.poster_url),
            thumb_url: movieApi.optimizeImage(movie.thumb_url),
          }));
          setMovies(optimizedMovies);
        } else {
          setMovies([]);
        }
      } catch (error) {
        console.error('Search failed:', error);
        setMovies([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMovies();
  }, [query]);

  return (
    <motion.div
      className="anime-list-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="anime-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="container">
          <h1 className="anime-title">
            <span className="anime-icon">🔍</span>
            Kết quả tìm kiếm: "{query}"
          </h1>
        </div>
      </motion.div>

      <div className="container">
        {loading ? (
          <div className="loading-spinner" />
        ) : movies.length > 0 ? (
          <div className="anime-movies-grid">
            {movies.map((movie) => (
              <MovieCard
                key={movie._id || movie.slug}
                movie={movie}
              />
            ))}
          </div>
        ) : query ? (
          <div className="no-results">
            <span className="no-results-icon">🔍</span>
            <h3>Không tìm thấy kết quả</h3>
            <p>Không tìm thấy kết quả cho "{query}"</p>
          </div>
        ) : (
          <div className="no-results">
            <span className="no-results-icon">🎬</span>
            <h3>Tìm kiếm phim</h3>
            <p>Nhập từ khóa để tìm kiếm phim</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default SearchPage;

