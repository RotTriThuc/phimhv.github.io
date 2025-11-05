/**
 * MovieGrid Component
 * 
 * Advanced grid layout với CSS Grid + Flexbox
 * Responsive: 6 cols (desktop), 4 cols (tablet), 2 cols (mobile)
 */

import { motion } from 'framer-motion';
import { useState } from 'react';
import MovieCard from './MovieCard';
import './MovieGrid.css';

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

interface MovieGridProps {
  movies: Movie[];
  title?: string;
  subtitle?: string;
  layout?: 'grid' | 'masonry' | 'flex';
  columns?: {
    desktop?: number;
    tablet?: number;
    mobile?: number;
  };
  showLoadMore?: boolean;
  onLoadMore?: () => void;
  loading?: boolean;
  onSaveMovie?: (movie: Movie) => void;
  onWatchMovie?: (slug: string) => void;
}

const MovieGrid: React.FC<MovieGridProps> = ({
  movies,
  title,
  subtitle,
  layout = 'grid',
  columns = {
    desktop: 6,
    tablet: 4,
    mobile: 2
  },
  showLoadMore = false,
  onLoadMore,
  loading = false,
  onSaveMovie,
  onWatchMovie
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Container animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1
      }
    }
  };

  // Item animation variants
  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 100,
        damping: 15
      }
    }
  };

  // Grid class based on layout and columns
  const getGridClass = () => {
    if (layout === 'masonry') return 'movie-grid-masonry';
    if (layout === 'flex') return 'movie-grid-flex';
    return 'movie-grid-css';
  };

  // Custom CSS variables cho dynamic columns
  const gridStyle = {
    '--desktop-cols': columns.desktop,
    '--tablet-cols': columns.tablet,
    '--mobile-cols': columns.mobile
  } as React.CSSProperties;

  return (
    <section className="movie-grid-section">
      {/* Section Header với Flexbox */}
      {title && (
        <div className="grid-header">
          <div className="header-content">
            <h2 className="grid-title">
              <span className="title-icon">🎬</span>
              {title}
            </h2>
            {subtitle && <p className="grid-subtitle">{subtitle}</p>}
          </div>
          
          {/* View Mode Toggle */}
          <div className="view-toggle">
            <button
              className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid view"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <rect x="1" y="1" width="6" height="6" />
                <rect x="9" y="1" width="6" height="6" />
                <rect x="1" y="9" width="6" height="6" />
                <rect x="9" y="9" width="6" height="6" />
              </svg>
            </button>
            <button
              className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List view"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <rect x="1" y="2" width="14" height="2" />
                <rect x="1" y="7" width="14" height="2" />
                <rect x="1" y="12" width="14" height="2" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Main Grid Container */}
      <motion.div
        className={`${getGridClass()} ${viewMode}`}
        style={gridStyle}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {movies.map((movie, index) => (
          <motion.div
            key={`${movie.slug}-${index}`}
            className="grid-item"
            variants={itemVariants}
            layout
            layoutId={movie._id}
          >
            <MovieCard
              movie={movie}
              layout={viewMode === 'list' ? 'horizontal' : 'vertical'}
              lazyLoad={true}
              onSave={onSaveMovie}
              onWatch={onWatchMovie}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Load More Button */}
      {showLoadMore && (
        <motion.div
          className="load-more-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <motion.button
            className="load-more-btn"
            onClick={onLoadMore}
            disabled={loading}
            whileHover={!loading ? { scale: 1.05 } : {}}
            whileTap={!loading ? { scale: 0.95 } : {}}
          >
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                Đang tải...
              </>
            ) : (
              <>
                <span>📽️</span>
                Xem thêm phim
              </>
            )}
          </motion.button>
        </motion.div>
      )}
    </section>
  );
};

export default MovieGrid;