/**
 * ContinueWatchingSection Component
 * 
 * Hiển thị danh sách phim đang xem (có watch progress)
 * Dùng trên HomePage để user dễ dàng tiếp tục xem
 * 
 * Features:
 * - Load watch progress từ Firebase
 * - Grid layout responsive
 * - Navigate đến tập đang xem
 * - Hiển thị thông tin tập đã xem
 * - Skeleton loading state
 */

import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useState, useRef } from 'react';
import { useWatchProgressList } from '../hooks/useWatchProgress';
import { movieApi } from '../services/movieApi';
import './ContinueWatchingSection.css';

const ContinueWatchingSection = () => {
  const navigate = useNavigate();
  const { progressList, loading, hasProgress } = useWatchProgressList();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Handle scroll position
  const updateScrollButtons = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  // Scroll functions
  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = scrollContainerRef.current.clientWidth * 0.8; // Scroll 80% of visible width
    const newScrollLeft = direction === 'left'
      ? scrollContainerRef.current.scrollLeft - scrollAmount
      : scrollContainerRef.current.scrollLeft + scrollAmount;
    
    scrollContainerRef.current.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    });
  };

  // Không hiển thị section nếu không có phim đang xem
  if (!loading && !hasProgress) {
    return null;
  }

  // Loading state
  if (loading) {
    return (
      <section className="continue-watching-section">
        <div className="container">
          <h2 className="section-title">
            <span className="title-icon">📺</span>
            Tiếp tục xem
          </h2>
          <div className="continue-watching-grid">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="continue-watching-card skeleton">
                <div className="card-poster skeleton-pulse"></div>
                <div className="card-info">
                  <div className="skeleton-text skeleton-pulse"></div>
                  <div className="skeleton-text skeleton-pulse short"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  const handleContinueWatch = (movieSlug: string, episodeSlug: string) => {
    navigate(`/watch/${movieSlug}?ep=${episodeSlug}`);
  };

  const handleViewDetails = (movieSlug: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/movie/${movieSlug}`);
  };

  return (
    <motion.section
      className="continue-watching-section"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">
            <span className="title-icon">📺</span>
            Tiếp tục xem
            <span className="title-count">({progressList.length})</span>
          </h2>

          {/* Scroll Navigation Buttons */}
          {progressList.length > 4 && (
            <div className="scroll-controls">
              <motion.button
                className="scroll-btn scroll-btn-left"
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                ←
              </motion.button>
              <motion.button
                className="scroll-btn scroll-btn-right"
                onClick={() => scroll('right')}
                disabled={!canScrollRight}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                →
              </motion.button>
            </div>
          )}
        </div>

        <div 
          className="continue-watching-carousel"
          ref={scrollContainerRef}
          onScroll={updateScrollButtons}
        >
          {progressList.map((progress, index) => {
            const posterUrl = movieApi.optimizeImage(
              progress.posterUrl || progress.thumbUrl || ''
            );

            return (
              <motion.div
                key={progress.movieSlug}
                className="continue-watching-card"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(index * 0.05, 0.3) }}
                whileHover={{ scale: 1.05, y: -8 }}
                onClick={() => handleContinueWatch(progress.movieSlug, progress.episodeSlug)}
              >
                {/* Poster Image */}
                <div className="card-poster">
                  <img
                    src={posterUrl}
                    alt={progress.movieName || 'Movie'}
                    loading="lazy"
                  />
                  
                  {/* Play Overlay */}
                  <div className="play-overlay">
                    <div className="play-icon">▶</div>
                  </div>

                  {/* Progress Badge */}
                  <div className="progress-badge">
                    <span className="badge-icon">🎬</span>
                    <span className="badge-text">{progress.episodeName}</span>
                  </div>
                </div>

                {/* Card Info */}
                <div className="card-info">
                  <h3 className="movie-title">
                    {progress.movieName || 'Đang tải...'}
                  </h3>
                  
                  <div className="movie-meta">
                    {progress.quality && (
                      <span className="meta-badge">{progress.quality}</span>
                    )}
                    {progress.year && (
                      <span className="meta-badge">{progress.year}</span>
                    )}
                  </div>

                  <div className="card-actions">
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => handleContinueWatch(progress.movieSlug, progress.episodeSlug)}
                    >
                      ▶ Tiếp tục
                    </button>
                    <button
                      className="btn btn-sm btn-ghost"
                      onClick={(e) => handleViewDetails(progress.movieSlug, e)}
                    >
                      ℹ️ Chi tiết
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
};

export default ContinueWatchingSection;
