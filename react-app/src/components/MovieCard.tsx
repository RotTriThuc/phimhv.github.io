/**
 * MovieCard Component
 * 
 * Reusable movie card với lazy loading và hover effects
 * Hiển thị poster, quality badges, và thông tin phim
 * 
 * Features:
 * - Lazy loading images
 * - Quality badges (HD, Vietsub, Thuyết minh)
 * - Hover overlay với synopsis
 * - Rank number cho top lists
 * - Multiple layouts support
 */

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import './MovieCard.css';

interface Movie {
  _id: string;
  name: string;
  slug: string;
  origin_name: string;
  poster_url: string;
  thumb_url: string;
  year: number;
  quality: string;
  lang: string;
  episode_current: string;
  episode_total: string;
  time: string;
  type: string;
  sub_docquyen: boolean;
  chieurap: boolean;
  content?: string;
  category?: Array<{ name: string }>;
  country?: Array<{ name: string }>;
}

interface MovieCardProps {
  movie: Movie;
  showRank?: boolean;
  rank?: number;
  layout?: 'vertical' | 'horizontal';
  lazyLoad?: boolean;
  onSave?: (movie: any) => void;
  onWatch?: (slug: string) => void;
}

const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  showRank = false,
  rank,
  layout = 'vertical',
  lazyLoad = true,
  onSave,
  onWatch
}) => {
  const navigate = useNavigate();
  const cardRef = useRef<HTMLDivElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(!lazyLoad);
  const [showOverlay, setShowOverlay] = useState(false);

  // Enhanced Intersection Observer với progressive loading
  useEffect(() => {
    if (!lazyLoad) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Stagger loading cho better perceived performance
          const delay = Math.random() * 200;
          setTimeout(() => {
            setIsVisible(true);
          }, delay);
          observer.disconnect();
        }
      },
      { 
        rootMargin: '50px',  // Tối ưu hơn cho mobile
        threshold: 0.01
      }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [lazyLoad]);

  // Handle click
  const handleClick = () => {
    navigate(`/movie/${movie.slug}`);
  };

  // Handle watch
  const handleWatch = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onWatch) {
      onWatch(movie.slug);
    } else {
      navigate(`/watch/${movie.slug}`);
    }
  };

  // Handle save
  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSave) {
      onSave(movie);
    }
  };

  // Quality badge component
  const QualityBadge = () => (
    <div className="quality-badges">
      {movie.quality && (
        <span className="badge badge-quality">{movie.quality}</span>
      )}
      {movie.lang && (
        <span className="badge badge-lang">
          {movie.lang === 'vie' ? 'Vietsub' : movie.lang === 'tm' ? 'Thuyết minh' : movie.lang}
        </span>
      )}
      {movie.sub_docquyen && (
        <span className="badge badge-exclusive">Độc quyền</span>
      )}
      {movie.chieurap && (
        <span className="badge badge-cinema">Chiếu rạp</span>
      )}
    </div>
  );

  // Episode info component
  const EpisodeInfo = () => {
    if (!movie.episode_current) return null;
    
    return (
      <div className="episode-info">
        <span className="episode-current">{movie.episode_current}</span>
        {movie.episode_total && (
          <span className="episode-total">/{movie.episode_total}</span>
        )}
      </div>
    );
  };

  // Rank badge component
  const RankBadge = () => {
    if (!showRank || !rank) return null;
    
    let rankClass = 'rank-badge';
    if (rank === 1) rankClass += ' rank-gold';
    else if (rank === 2) rankClass += ' rank-silver';
    else if (rank === 3) rankClass += ' rank-bronze';
    
    return (
      <div className={rankClass}>
        <span className="rank-number">{rank}</span>
      </div>
    );
  };

  // Hover overlay component
  const HoverOverlay = () => (
    <motion.div 
      className="hover-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: showOverlay ? 1 : 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="overlay-content">
        {/* Movie info */}
        <div className="overlay-info">
          <h4 className="overlay-title">{movie.name}</h4>
          {movie.origin_name && (
            <p className="overlay-subtitle">{movie.origin_name}</p>
          )}
          
          {/* Meta info */}
          <div className="overlay-meta">
            {movie.year && <span>📅 {movie.year}</span>}
            {movie.time && <span>⏱️ {movie.time}</span>}
            {movie.type && <span>🎬 {movie.type}</span>}
          </div>

          {/* Categories */}
          {movie.category && (
            <div className="overlay-categories">
              {Array.isArray(movie.category) ? (
                movie.category.slice(0, 3).map((cat, i) => (
                  <span key={i} className="category-tag">
                    {typeof cat === 'string' ? cat : cat.name}
                  </span>
                ))
              ) : (
                <span className="category-tag">{movie.category}</span>
              )}
            </div>
          )}

          {/* Synopsis */}
          {movie.content && (
            <p className="overlay-synopsis">
              {movie.content.slice(0, 150)}...
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="overlay-actions">
          <motion.button 
            className="btn-play"
            onClick={handleWatch}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ▶️ Xem ngay
          </motion.button>
          <motion.button 
            className="btn-save"
            onClick={handleSave}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ❤️ Lưu
          </motion.button>
        </div>
      </div>
    </motion.div>
  );

  if (layout === 'horizontal') {
    return (
      <motion.div 
        ref={cardRef}
        className="movie-card-horizontal"
        onClick={handleClick}
        onMouseEnter={() => setShowOverlay(true)}
        onMouseLeave={() => setShowOverlay(false)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Poster */}
        <div className="card-poster-h">
          {isVisible && (
            <img 
              src={movie.thumb_url || movie.poster_url}
              alt={movie.name}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              className={imageLoaded ? 'loaded' : 'loading'}
            />
          )}
          {!imageLoaded && <div className="poster-skeleton"></div>}
          <QualityBadge />
          <EpisodeInfo />
        </div>

        {/* Info */}
        <div className="card-info-h">
          <h3 className="card-title-h">{movie.name}</h3>
          {movie.origin_name && (
            <p className="card-subtitle-h">{movie.origin_name}</p>
          )}
          <div className="card-meta-h">
            {movie.year && <span>📅 {movie.year}</span>}
            {movie.time && <span>⏱️ {movie.time}</span>}
          </div>
          {movie.content && (
            <p className="card-description-h">
              {movie.content.slice(0, 100)}...
            </p>
          )}
        </div>

        <RankBadge />
      </motion.div>
    );
  }

  // Default vertical layout
  return (
    <motion.div 
      ref={cardRef}
      className="movie-card"
      onClick={handleClick}
      onMouseEnter={() => setShowOverlay(true)}
      onMouseLeave={() => setShowOverlay(false)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -10 }}
      transition={{ duration: 0.3 }}
    >
      {/* Enhanced Poster container với blur-up technique */}
      <div className="card-poster" data-loaded={imageLoaded}>
        {/* Low quality placeholder cho instant load */}
        {!imageLoaded && (
          <div className="poster-placeholder">
            <div className="poster-skeleton"></div>
            <div className="poster-shimmer"></div>
          </div>
        )}
        
        {isVisible && (
          <motion.img 
            src={movie.poster_url || movie.thumb_url}
            alt={movie.name}
            loading="lazy"
            decoding="async"
            onLoad={() => setImageLoaded(true)}
            onError={(e) => {
              // Fallback image on error
              (e.target as HTMLImageElement).src = '/placeholder-poster.jpg';
            }}
            className={`poster-image ${imageLoaded ? 'loaded' : 'loading'}`}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ 
              opacity: imageLoaded ? 1 : 0,
              scale: imageLoaded ? 1 : 1.1
            }}
            transition={{ 
              duration: 0.6,
              ease: [0.43, 0.13, 0.23, 0.96]
            }}
          />
        )}
        
        <QualityBadge />
        <EpisodeInfo />
        <RankBadge />
        <HoverOverlay />
      </div>

      {/* Card info */}
      <div className="card-info">
        <h3 className="card-title">{movie.name}</h3>
        {movie.origin_name && (
          <p className="card-subtitle">{movie.origin_name}</p>
        )}
        <div className="card-meta">
          {movie.year && <span className="meta-year">{movie.year}</span>}
          {movie.country && movie.country[0] && (
            <span className="meta-country">{movie.country[0].name}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default MovieCard;