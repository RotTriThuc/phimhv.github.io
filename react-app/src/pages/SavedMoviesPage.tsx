/**
 * SavedMoviesPage Component
 * 
 * Trang hiển thị danh sách phim đã lưu
 * Data từ Firebase Firestore
 * 
 * Features:
 * - Grid layout với 3D movie cards
 * - Remove saved movies
 * - Watch progress indicator
 * - Empty state
 */

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFirebase } from '../contexts/FirebaseContext';
import { movieApi } from '../services/movieApi';
import MovieCard3D from '../components/MovieCard3D';

const SavedMoviesPage = () => {
  const navigate = useNavigate();
  const { getSavedMovies, removeSavedMovie, getWatchProgress, isInitialized } = useFirebase();
  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [watchProgress, setWatchProgress] = useState<Record<string, any>>({});

  useEffect(() => {
    const fetchMovies = async () => {
      // Wait for Firebase to initialize
      if (!isInitialized) {
        return;
      }

      try {
        setLoading(true);
        const saved = await getSavedMovies();
        
        // Optimize images to avoid CORS issues
        const optimizedMovies = saved.map(movie => ({
          ...movie,
          poster_url: movieApi.optimizeImage(movie.poster_url || movie.thumb_url || ''),
          thumb_url: movieApi.optimizeImage(movie.thumb_url || movie.poster_url || ''),
        }));
        setMovies(optimizedMovies);

        // Load watch progress for all saved movies
        const progressMap: Record<string, any> = {};
        for (const movie of saved) {
          const progress = await getWatchProgress(movie.slug);
          if (progress) {
            progressMap[movie.slug] = progress;
          }
        }
        setWatchProgress(progressMap);
      } catch (error) {
        console.error('Failed to load saved movies:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, [getSavedMovies, getWatchProgress, isInitialized]);

  const handleRemove = async (movieSlug: string, movieName: string) => {
    if (!confirm(`Xóa "${movieName}" khỏi danh sách?`)) {
      return;
    }

    try {
      await removeSavedMovie(movieSlug);
      setMovies(prev => prev.filter(m => m.slug !== movieSlug));
      alert('✅ Đã xóa khỏi danh sách');
    } catch (error) {
      console.error('Failed to remove movie:', error);
      alert('❌ Không thể xóa phim');
    }
  };

  const handleWatch = (movieSlug: string) => {
    // Check if there's watch progress
    const progress = watchProgress[movieSlug];
    if (progress?.episodeSlug) {
      navigate(`/watch/${movieSlug}?ep=${progress.episodeSlug}`);
    } else {
      navigate(`/movie/${movieSlug}`);
    }
  };

  if (loading) {
    return (
      <motion.div
        className="loading-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="loading-spinner"></div>
        <p>Đang tải phim đã lưu...</p>
      </motion.div>
    );
  }

  if (movies.length === 0) {
    return (
      <motion.div
        className="container"
        style={{ padding: '80px 20px', textAlign: 'center' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', bounce: 0.5 }}
        >
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>📚</div>
          <h2 style={{ marginBottom: '15px' }}>Chưa có phim nào</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '30px' }}>
            Hãy lưu những bộ phim yêu thích để xem lại sau!
          </p>
          <motion.button
            className="btn btn-primary"
            onClick={() => navigate('/')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            🏠 Về trang chủ
          </motion.button>
        </motion.div>
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
          ❤️ Phim đã lưu
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '16px' }}>
          {movies.length} bộ phim trong danh sách của bạn
        </p>
      </motion.div>

      {/* Movies Grid */}
      <div className="movies-grid">
        {movies.map((movie, index) => (
          <motion.div
            key={movie.slug}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            style={{ position: 'relative' }}
          >
            <MovieCard3D
              movie={movie}
              onWatch={() => handleWatch(movie.slug)}
              onSave={() => handleRemove(movie.slug, movie.name)}
            />
            
            {/* Watch Progress Badge */}
            {watchProgress[movie.slug] && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  background: 'rgba(108, 92, 231, 0.95)',
                  color: '#fff',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '600',
                  backdropFilter: 'blur(10px)',
                  zIndex: 10,
                  pointerEvents: 'none',
                }}
              >
                📺 {watchProgress[movie.slug].episodeName}
              </motion.div>
            )}

            {/* Remove Button */}
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                handleRemove(movie.slug, movie.name);
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                background: 'rgba(255, 59, 48, 0.95)',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '16px',
                backdropFilter: 'blur(10px)',
                zIndex: 10,
              }}
              title="Xóa khỏi danh sách"
            >
              🗑️
            </motion.button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default SavedMoviesPage;

