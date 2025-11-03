import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import MovieCard3D from '../components/MovieCard3D';
import { movieApi } from '../services/movieApi';
import type { Movie } from '../services/movieApi';

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
      className="container"
      style={{ padding: '40px 20px' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <h1>Kết quả tìm kiếm: "{query}"</h1>
      <div className="movie-grid" style={{ marginTop: '30px' }}>
        {loading ? (
          <div className="loading-spinner" />
        ) : movies.length > 0 ? (
          movies.map((movie) => (
            <MovieCard3D 
              key={movie.slug} 
              movie={{
                slug: movie.slug,
                name: movie.name,
                poster_url: movie.poster_url,
                thumb_url: movie.thumb_url,
                year: movie.year,
                quality: movie.quality,
                episode_current: movie.episode_current,
                lang: movie.lang,
              }} 
            />
          ))
        ) : query ? (
          <p>Không tìm thấy kết quả cho "{query}"</p>
        ) : (
          <p>Nhập từ khóa để tìm kiếm phim</p>
        )}
      </div>
    </motion.div>
  );
};

export default SearchPage;

