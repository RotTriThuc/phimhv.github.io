/**
 * WatchPage Component
 * 
 * Trang xem phim với video player
 * Support: M3U8 (HLS), MP4, iframe embed
 * 
 * Features:
 * - Video player với controls
 * - Episode selector
 * - Watch progress tracking
 * - Comments section
 * - Recommended movies
 */

import { motion } from 'framer-motion';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { movieApi } from '../services/movieApi';
import { useFirebase } from '../contexts/FirebaseContext';
import type { MovieDetail } from '../services/movieApi';
import './WatchPage.css';

const WatchPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setWatchProgress } = useFirebase();
  
  const [movie, setMovie] = useState<MovieDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentEpisode, setCurrentEpisode] = useState<any>(null);
  const [currentServer, setCurrentServer] = useState(0);
  
  const videoRef = useRef<HTMLIFrameElement>(null);
  const episodeSlug = searchParams.get('ep');

  useEffect(() => {
    const fetchMovie = async () => {
      if (!slug) return;
      
      try {
        setLoading(true);
        console.log('🎬 Fetching movie for watch page:', slug);
        const response = await movieApi.getMovieDetail(slug);
        console.log('📦 Watch Page Response:', response);
        
        if (response.status && response.movie) {
          // ✅ CRITICAL FIX: Merge episodes from response root (same as MovieDetailPage)
          const movieData = {
            ...response.movie,
            episodes: response.episodes || []
          };
          
          console.log('🎯 Movie data with episodes:', {
            name: movieData.name,
            hasEpisodes: !!movieData.episodes,
            episodesCount: movieData.episodes?.length || 0,
          });
          
          setMovie(movieData);
          
          // Find current episode
          const ep = findEpisode(movieData, episodeSlug);
          console.log('🎮 Found episode:', ep);
          
          if (ep) {
            setCurrentEpisode(ep);
            
            // Save watch progress with movie metadata
            await setWatchProgress(slug, {
              movieName: movieData.name,
              posterUrl: movieData.poster_url,
              thumbUrl: movieData.thumb_url,
              year: movieData.year,
              quality: movieData.quality,
              episodeName: ep.name,
              episodeSlug: ep.slug,
              serverIndex: currentServer,
              timestamp: Date.now(),
            });
          } else {
            console.error('❌ Episode not found. Episode slug:', episodeSlug);
            console.error('Available episodes:', movieData.episodes);
          }
        } else {
          setError('Không tìm thấy phim');
        }
      } catch (err) {
        console.error('Failed to fetch movie:', err);
        setError('Không thể tải thông tin phim');
      } finally {
        setLoading(false);
      }
    };

    fetchMovie();
  }, [slug, episodeSlug, currentServer, setWatchProgress]);

  const findEpisode = (movie: MovieDetail, epSlug: string | null) => {
    if (!movie.episodes || movie.episodes.length === 0) return null;
    
    for (const server of movie.episodes) {
      for (const ep of server.server_data) {
        if (ep.slug === epSlug || ep.name === epSlug) {
          return ep;
        }
      }
    }
    
    // Return first episode if not found
    return movie.episodes[0]?.server_data[0] || null;
  };

  const handleEpisodeChange = (episode: any) => {
    const params = new URLSearchParams();
    params.set('ep', episode.slug);
    navigate(`/watch/${slug}?${params.toString()}`, { replace: true });
  };

  const handleServerChange = (serverIndex: number) => {
    setCurrentServer(serverIndex);
  };

  if (loading) {
    return (
      <motion.div
        className="loading-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="loading-spinner"></div>
        <p>Đang tải player...</p>
      </motion.div>
    );
  }

  if (error || !movie || !currentEpisode) {
    return (
      <motion.div
        className="error-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="error-icon">😢</div>
        <h2>Không thể phát video</h2>
        <p>{error || 'Episode không tồn tại'}</p>
        <button className="btn btn-primary" onClick={() => navigate(`/movie/${slug}`)}>
          Về trang phim
        </button>
      </motion.div>
    );
  }

  // Determine video source
  const videoSource = currentEpisode.link_embed || currentEpisode.link_m3u8;

  return (
    <motion.div
      className="watch-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Video Player */}
      <div className="video-section">
        <div className="video-container">
          {videoSource ? (
            <iframe
              ref={videoRef}
              src={videoSource}
              title={`${movie.name} - ${currentEpisode.name}`}
              frameBorder="0"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              className="video-player"
            />
          ) : (
            <div className="video-error">
              <p>❌ Không có nguồn video</p>
              <p>Vui lòng thử server khác hoặc tập khác</p>
            </div>
          )}
        </div>

        {/* Movie Info Bar */}
        <div className="video-info">
          <div className="info-left">
            <h1 className="movie-title">{movie.name}</h1>
            <p className="episode-title">
              {currentEpisode.name} {movie.lang && `- ${movie.lang}`}
            </p>
          </div>
          <div className="info-right">
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => navigate(`/movie/${slug}`)}
            >
              ℹ️ Chi tiết
            </button>
          </div>
        </div>
      </div>

      {/* Controls & Episodes */}
      <div className="container watch-content">
        <div className="content-grid">
          {/* Episodes List */}
          <div className="episodes-section">
            <h2 className="section-title">📺 Danh sách tập</h2>
            
            {/* Server Selector */}
            {movie.episodes && movie.episodes.length > 1 && (
              <div className="server-selector">
                <span>Server:</span>
                {movie.episodes.map((server, index) => (
                  <button
                    key={index}
                    className={`btn btn-sm ${currentServer === index ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => handleServerChange(index)}
                  >
                    {server.server_name}
                  </button>
                ))}
              </div>
            )}

            {/* Episodes Grid */}
            <div className="episodes-grid">
              {movie.episodes && movie.episodes[currentServer]?.server_data.map((ep, index) => (
                <motion.button
                  key={index}
                  className={`episode-btn ${ep.slug === currentEpisode.slug ? 'active' : ''}`}
                  onClick={() => handleEpisodeChange(ep)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {ep.name}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Movie Details Sidebar */}
          <div className="details-sidebar">
            <div className="movie-poster">
              <img
                src={movieApi.optimizeImage(movie.poster_url || movie.thumb_url)}
                alt={movie.name}
              />
            </div>

            <div className="movie-meta">
              <h3>{movie.name}</h3>
              <p className="origin-name">{movie.origin_name}</p>

              <div className="meta-badges">
                {movie.quality && (
                  <span className="badge badge-primary">{movie.quality}</span>
                )}
                {movie.year && (
                  <span className="badge badge-warning">{movie.year}</span>
                )}
                {movie.episode_current && (
                  <span className="badge badge-success">{movie.episode_current}</span>
                )}
              </div>

              {movie.category && movie.category.length > 0 && (
                <div className="meta-item">
                  <strong>Thể loại:</strong>
                  <p>{movie.category.map(c => c.name).join(', ')}</p>
                </div>
              )}

              {movie.country && movie.country.length > 0 && (
                <div className="meta-item">
                  <strong>Quốc gia:</strong>
                  <p>{movie.country.map(c => c.name).join(', ')}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {movie.content && (
          <div className="movie-description">
            <h2 className="section-title">📝 Nội dung phim</h2>
            <div dangerouslySetInnerHTML={{ __html: movie.content }} />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default WatchPage;

