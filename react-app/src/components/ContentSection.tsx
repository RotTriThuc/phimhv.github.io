/**
 * ContentSection Component
 * 
 * Reusable section component cho các danh sách phim
 * Cấu trúc lặp (loop) với lazy loading và animations
 * 
 * Features:
 * - Section header với view more link
 * - Horizontal scroll cho mobile
 * - Grid layout cho desktop
 * - Skeleton loading
 * - Infinite scroll support
 */

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import MovieCard from './MovieCard';
import './ContentSection.css';

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

interface ContentSectionProps {
  title: string;
  subtitle?: string;
  movies: Movie[];
  loading?: boolean;
  viewMoreLink?: string;
  sectionType?: 'new' | 'hot' | 'series' | 'movie' | 'cartoon';
  layout?: 'grid' | 'carousel' | 'list';
  showRank?: boolean;
  itemsPerRow?: number;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

const ContentSection: React.FC<ContentSectionProps> = ({
  title,
  subtitle,
  movies,
  loading = false,
  viewMoreLink,
  sectionType = 'new',
  layout = 'grid',
  showRank = false,
  itemsPerRow = 6,
  onLoadMore,
  hasMore = false
}) => {
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(loading);

  // Intersection Observer cho lazy loading section
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Handle loading state
  useEffect(() => {
    if (loading) {
      setShowSkeleton(true);
    } else {
      // Delay để có smooth transition
      const timer = setTimeout(() => setShowSkeleton(false), 300);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  // Section icons theo type
  const getSectionIcon = () => {
    switch (sectionType) {
      case 'hot': return '🔥';
      case 'series': return '📺';
      case 'movie': return '🎬';
      case 'cartoon': return '🦄';
      default: return '✨';
    }
  };

  // Section gradient theo type
  const getSectionGradient = () => {
    switch (sectionType) {
      case 'hot': return 'section-gradient-hot';
      case 'series': return 'section-gradient-series';
      case 'movie': return 'section-gradient-movie';
      case 'cartoon': return 'section-gradient-cartoon';
      default: return 'section-gradient-default';
    }
  };

  // Animation variants
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

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 100,
        damping: 20
      }
    }
  };

  // Skeleton loader component
  const SkeletonCard = () => (
    <div className="skeleton-card">
      <div className="skeleton-poster"></div>
      <div className="skeleton-info">
        <div className="skeleton-title"></div>
        <div className="skeleton-meta"></div>
      </div>
    </div>
  );

  // Render layout theo type
  const renderContent = () => {
    if (showSkeleton) {
      return (
        <div className={`content-${layout}`}>
          {[...Array(itemsPerRow)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      );
    }

    if (layout === 'carousel') {
      return (
        <div className="content-carousel">
          <div className="carousel-track">
            {movies.map((movie, index) => (
              <motion.div
                key={movie._id}
                variants={itemVariants}
                className="carousel-item"
              >
                <MovieCard
                  movie={movie}
                  showRank={showRank}
                  rank={index + 1}
                  lazyLoad={!isVisible}
                />
              </motion.div>
            ))}
          </div>
          
          {/* Carousel navigation */}
          <button className="carousel-nav carousel-prev">‹</button>
          <button className="carousel-nav carousel-next">›</button>
        </div>
      );
    }

    if (layout === 'list') {
      return (
        <div className="content-list">
          {movies.map((movie, index) => (
            <motion.div
              key={movie._id}
              variants={itemVariants}
              className="list-item"
            >
              <MovieCard
                movie={movie}
                showRank={showRank}
                rank={index + 1}
                layout="horizontal"
                lazyLoad={!isVisible}
              />
            </motion.div>
          ))}
        </div>
      );
    }

    // Default grid layout
    return (
      <div className={`content-grid grid-${itemsPerRow}`}>
        {movies.map((movie, index) => (
          <motion.div
            key={movie._id}
            variants={itemVariants}
            className="grid-item"
          >
            <MovieCard
              movie={movie}
              showRank={showRank}
              rank={index + 1}
              lazyLoad={!isVisible}
            />
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <section 
      ref={sectionRef}
      className={`content-section ${getSectionGradient()}`}
      data-section-type={sectionType}
    >
      <div className="section-container">
        {/* Section Header */}
        <div className="section-header">
          <motion.div 
            className="section-title-group"
            initial={{ x: -50, opacity: 0 }}
            animate={isVisible ? { x: 0, opacity: 1 } : {}}
            transition={{ type: 'spring', stiffness: 100 }}
          >
            <span className="section-icon">{getSectionIcon()}</span>
            <div>
              <h2 className="section-title">{title}</h2>
              {subtitle && <p className="section-subtitle">{subtitle}</p>}
            </div>
          </motion.div>

          {viewMoreLink && (
            <motion.button
              className="section-view-more"
              onClick={() => navigate(viewMoreLink)}
              whileHover={{ scale: 1.05, x: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              Xem tất cả
              <span className="arrow-icon">→</span>
            </motion.button>
          )}
        </div>

        {/* Section Content */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isVisible ? "visible" : "hidden"}
          className="section-content"
        >
          {renderContent()}
        </motion.div>

        {/* Load More Button */}
        {hasMore && onLoadMore && (
          <motion.div 
            className="section-load-more"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <motion.button
              className="btn-load-more"
              onClick={onLoadMore}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  Đang tải...
                </>
              ) : (
                <>
                  <span className="icon">📥</span>
                  Tải thêm phim
                </>
              )}
            </motion.button>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default ContentSection;