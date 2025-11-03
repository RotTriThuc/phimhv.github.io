import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { movieApi } from '../services/movieApi';
import { useFirebase } from '../contexts/FirebaseContext';
import Comments from '../components/Comments';
import type { MovieDetail } from '../services/movieApi';

const MovieDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { saveMovie, isMovieSaved } = useFirebase();
  
  const [movie, setMovie] = useState<MovieDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const fetchMovie = async () => {
      if (!slug) return;
      
      try {
        setLoading(true);
        console.log(`🎬 Fetching movie detail for slug: ${slug}`);
        const response = await movieApi.getMovieDetail(slug);
        console.log('📦 Movie Detail Response:', response);
        
        if (response.status && response.movie) {
          // ✅ CRITICAL FIX: episodes is OUTSIDE movie object in API response!
          // API returns: { status, movie: {...}, episodes: [...] }
          // We need to merge episodes into movie object
          const movieData = {
            ...response.movie,
            episodes: response.episodes || [] // Merge episodes from response root
          };
          
          console.log('🎯 Movie data:', {
            name: movieData.name,
            hasEpisodes: !!movieData.episodes,
            episodesLength: movieData.episodes?.length || 0,
            episodes: movieData.episodes,
          });
          
          // Log ALL keys as readable string
          const allKeys = Object.keys(movieData);
          console.log('🔑 Movie keys available (' + allKeys.length + ' keys):');
          console.log(allKeys.join(', '));
          console.log('📦 Full movie object:', movieData);
          
          // Store for debugging
          (window as any).lastMovieData = movieData;
          
          setMovie(movieData);
          
          // Check if movie is saved
          const saved = await isMovieSaved(slug);
          setIsSaved(saved);
        } else {
          console.warn('⚠️ No movie in response:', response);
          setError('Không tìm thấy phim');
        }
      } catch (err) {
        console.error('❌ Failed to fetch movie:', err);
        setError('Không thể tải thông tin phim');
      } finally {
        setLoading(false);
      }
    };

    fetchMovie();
  }, [slug, isMovieSaved]);

  const handleSave = async () => {
    if (!movie) return;
    
    try {
      await saveMovie({
        slug: movie.slug,
        name: movie.name,
        poster_url: movie.poster_url,
        thumb_url: movie.thumb_url,
        year: movie.year,
        quality: movie.quality,
        episode_current: movie.episode_current,
        lang: movie.lang,
      });
      setIsSaved(true);
      alert(`✅ Đã lưu "${movie.name}"`);
    } catch (error) {
      console.error('Failed to save:', error);
      alert('❌ Không thể lưu phim');
    }
  };

  const handleWatch = () => {
    console.log('🎮 Handle Watch - Movie:', movie);
    console.log('📺 Episodes:', movie?.episodes);
    console.log('🔑 Movie keys:', movie ? Object.keys(movie) : 'null');
    
    if (!movie) {
      alert('❌ Không có thông tin phim');
      return;
    }
    
    if (!movie.episodes || movie.episodes.length === 0) {
      const allKeys = Object.keys(movie);
      console.error('❌ No episodes found for movie:', movie.name);
      console.error('🔍 Movie object structure:', movie);
      console.error('🔑 Available keys (' + allKeys.length + ' keys):');
      console.error(allKeys.join(', '));
      
      // Check for alternative episode fields
      const possibleEpisodeKeys = allKeys.filter(key => 
        key.toLowerCase().includes('episode') || 
        key.toLowerCase().includes('server') ||
        key.toLowerCase().includes('link')
      );
      
      if (possibleEpisodeKeys.length > 0) {
        console.warn('🔍 Found possible episode-related keys:', possibleEpisodeKeys);
        console.warn('🔍 Their values:', possibleEpisodeKeys.map(k => ({ [k]: (movie as any)[k] })));
      }
      
      alert('❌ Phim chưa có tập nào.\n\nCó thể:\n1. API không trả về episodes\n2. Phim chưa có tập\n3. Cần thêm query param\n\nCheck Console (F12) để xem keys có sẵn!');
      return;
    }
    
    console.log('✅ Found episodes:', movie.episodes.length);
    const firstEpisode = movie.episodes[0].server_data[0];
    console.log('🎬 Navigating to first episode:', firstEpisode);
    navigate(`/watch/${slug}?ep=${firstEpisode.slug}`);
  };

  if (loading) {
    return (
      <motion.div
        className="loading-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="loading-spinner"></div>
        <p>Đang tải thông tin phim...</p>
      </motion.div>
    );
  }

  if (error || !movie) {
    return (
      <motion.div
        className="error-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="error-icon">😢</div>
        <h2>Không tìm thấy phim</h2>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>
          Về trang chủ
        </button>
      </motion.div>
    );
  }

  const posterUrl = movieApi.optimizeImage(movie.poster_url || movie.thumb_url);

  return (
    <motion.div
      className="container"
      style={{ padding: '40px 20px' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
    >
      <div style={{ display: 'flex', gap: '30px', marginBottom: '40px', flexWrap: 'wrap' }}>
        {/* Poster */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          style={{ flex: '0 0 300px' }}
        >
          <img
            src={posterUrl}
            alt={movie.name}
            style={{
              width: '100%',
              borderRadius: '16px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
            }}
          />
        </motion.div>

        {/* Info */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          style={{ flex: '1', minWidth: '300px' }}
        >
          <h1 style={{ fontSize: '36px', marginBottom: '10px' }}>{movie.name}</h1>
          <p style={{ color: '#a0a0a8', marginBottom: '20px' }}>{movie.origin_name}</p>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
            {movie.quality && (
              <span className="badge" style={{ background: '#6c5ce7', padding: '6px 12px', borderRadius: '6px' }}>
                {movie.quality}
              </span>
            )}
            {movie.lang && (
              <span className="badge" style={{ background: '#00b894', padding: '6px 12px', borderRadius: '6px' }}>
                {movie.lang}
              </span>
            )}
            {movie.year && (
              <span className="badge" style={{ background: '#fdcb6e', padding: '6px 12px', borderRadius: '6px', color: '#2d3436' }}>
                {movie.year}
              </span>
            )}
            <span className="badge" style={{ background: '#fd79a8', padding: '6px 12px', borderRadius: '6px' }}>
              {movie.episode_current}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
            <motion.button
              className="btn btn-primary"
              onClick={handleWatch}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{ padding: '14px 28px', fontSize: '16px' }}
            >
              ▶️ Xem phim
            </motion.button>
            
            <motion.button
              className="btn btn-secondary"
              onClick={handleSave}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{ padding: '14px 28px', fontSize: '16px' }}
              disabled={isSaved}
            >
              {isSaved ? '✅ Đã lưu' : '❤️ Lưu phim'}
            </motion.button>
          </div>

          {movie.content && (
            <div style={{ marginBottom: '20px' }}>
              <h3>📝 Nội dung</h3>
              <p style={{ lineHeight: '1.6', color: '#e8e8ea' }}
                 dangerouslySetInnerHTML={{ __html: movie.content }}
              />
            </div>
          )}

          {movie.category && movie.category.length > 0 && (
            <div style={{ marginBottom: '15px' }}>
              <strong>🎭 Thể loại:</strong> {movie.category.map(c => c.name).join(', ')}
            </div>
          )}

          {movie.country && movie.country.length > 0 && (
            <div style={{ marginBottom: '15px' }}>
              <strong>🌍 Quốc gia:</strong> {movie.country.map(c => c.name).join(', ')}
            </div>
          )}

          {movie.actor && movie.actor.length > 0 && (
            <div style={{ marginBottom: '15px' }}>
              <strong>👥 Diễn viên:</strong> {movie.actor.join(', ')}
            </div>
          )}
        </motion.div>
      </div>

      {/* Episodes */}
      {movie.episodes && movie.episodes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 style={{ marginBottom: '20px' }}>📺 Danh sách tập</h2>
          {movie.episodes.map((server, serverIndex) => (
            <div key={serverIndex} style={{ marginBottom: '30px' }}>
              <h3 style={{ marginBottom: '15px', color: '#6c5ce7' }}>
                🎬 {server.server_name}
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                gap: '10px',
              }}>
                {server.server_data.map((episode, episodeIndex) => (
                  <motion.button
                    key={episodeIndex}
                    className="btn btn-ghost"
                    onClick={() => navigate(`/watch/${slug}?ep=${episode.slug}`)}
                    whileHover={{ scale: 1.05, borderColor: '#6c5ce7' }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      padding: '12px',
                      fontSize: '14px',
                      borderRadius: '8px',
                    }}
                  >
                    {episode.name}
                  </motion.button>
                ))}
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Comments Section */}
      <Comments movieSlug={movie.slug} movieName={movie.name} />
    </motion.div>
  );
};

export default MovieDetailPage;

