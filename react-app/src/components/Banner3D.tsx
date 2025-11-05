/**
 * Banner3D Component
 * 
 * Hero banner với 3D particle effects và cinematic animations
 * Sử dụng Three.js qua React Three Fiber để tạo hiệu ứng 3D thực sự
 * 
 * Features:
 * - 3D particle system background
 * - Parallax scrolling effect
 * - Smooth transitions giữa các slides
 * - Auto-play với manual controls
 * - Responsive design
 */

import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial, OrbitControls } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { useRef, useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import './Banner3D.css';

// Particle system cho background
function ParticleField() {
  const ref = useRef<THREE.Points>(null);
  
  // Generate random particle positions (reduced from 2000 to 1000 for performance)
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < 1000; i++) {
      const x = (Math.random() - 0.5) * 100;
      const y = (Math.random() - 0.5) * 100;
      const z = (Math.random() - 0.5) * 50;
      temp.push(x, y, z);
    }
    return new Float32Array(temp);
  }, []);

  // Animate particles
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta * 0.05;
      ref.current.rotation.y -= delta * 0.075;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={particles} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color="#6c5ce7"
          size={0.15}
          sizeAttenuation={true}
          depthWrite={false}
          opacity={0.6}
        />
      </Points>
    </group>
  );
}

interface BannerMovie {
  name: string;
  slug: string;
  poster_url: string;
  description?: string;
  year?: number;
  rating?: number;
}

interface Banner3DProps {
  movies: BannerMovie[];
  autoPlayInterval?: number;
}

const Banner3D: React.FC<Banner3DProps> = ({ 
  movies, 
  autoPlayInterval = 5000 
}) => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [direction, setDirection] = useState(0);
  const currentMovie = movies[currentIndex] || null;
  const progressRef = useRef<number | null>(null);

  // Enhanced auto-play với pause on hover
  useEffect(() => {
    if (!isAutoPlay || isPaused || movies.length <= 1) return;

    progressRef.current = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % movies.length);
    }, autoPlayInterval);

    return () => {
      if (progressRef.current) {
        clearInterval(progressRef.current);
      }
    };
  }, [isAutoPlay, isPaused, movies.length, autoPlayInterval, currentIndex]);

  // Enhanced navigation handlers với direction tracking
  const handlePrev = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + movies.length) % movies.length);
    setIsAutoPlay(false);
  };

  const handleNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % movies.length);
    setIsAutoPlay(false);
  };

  const handleDotClick = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
    setIsAutoPlay(false);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  if (!currentMovie || movies.length === 0) {
    return (
      <div className="banner-3d banner-loading">
        <div className="loading-spinner">Loading amazing content...</div>
      </div>
    );
  }

  // Slide animation variants
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.8,
      rotateY: direction > 0 ? 45 : -45,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
      rotateY: 0,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.8,
      rotateY: direction < 0 ? 45 : -45,
    }),
  };

  return (
    <div 
      className="banner-3d"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* 3D Particle Background với reduced particles for performance */}
      <div className="banner-3d-canvas">
        <Canvas 
          camera={{ position: [0, 0, 30], fov: 75 }}
          gl={{ 
            antialias: false, 
            alpha: true,
            powerPreference: 'high-performance',
            preserveDrawingBuffer: false 
          }}
          dpr={[1, 1.5]}
        >
          <ParticleField />
          <OrbitControls 
            enableZoom={false} 
            enablePan={false}
            autoRotate
            autoRotateSpeed={0.5}
          />
        </Canvas>
      </div>

      {/* Enhanced carousel content với thumbnail preview */}
      <div className="banner-content">
        {/* Thumbnail strip cho preview */}
        <div className="banner-thumbnails">
          {movies.map((movie, index) => (
            <motion.div
              key={index}
              className={`thumbnail-item ${index === currentIndex ? 'active' : ''}`}
              onClick={() => handleDotClick(index)}
              whileHover={{ scale: 1.05 }}
              animate={{ 
                opacity: index === currentIndex ? 1 : 0.5,
                scale: index === currentIndex ? 1.1 : 1
              }}
            >
              <img 
                src={movie.poster_url} 
                alt={movie.name}
                loading="lazy"
              />
              <div className="thumbnail-overlay">
                <span>{index + 1}</span>
              </div>
            </motion.div>
          ))}
        </div>

        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentIndex}
            className="banner-slide"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.3 },
              scale: { duration: 0.3 },
              rotateY: { duration: 0.4 },
            }}
          >
            {/* Background poster với blur effect - images already optimized */}
            <motion.div
              className="banner-bg"
              style={{
                backgroundImage: currentMovie.poster_url 
                  ? `url(${currentMovie.poster_url})`
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              }}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              transition={{ duration: 10, ease: 'linear' }}
            />

            <div className="banner-info">
              {/* Movie title với 3D text effect */}
              <motion.h1
                className="banner-title"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
              >
                {currentMovie.name}
              </motion.h1>

              {/* Movie meta info */}
              <motion.div
                className="banner-meta"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {currentMovie.year && (
                  <span className="meta-item">
                    <span className="icon">📅</span>
                    {currentMovie.year}
                  </span>
                )}
                {currentMovie.rating && (
                  <span className="meta-item">
                    <span className="icon">⭐</span>
                    {currentMovie.rating.toFixed(1)}
                  </span>
                )}
              </motion.div>

              {/* Description */}
              {currentMovie.description && (
                <motion.p
                  className="banner-description"
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  {currentMovie.description}
                </motion.p>
              )}

              {/* Action buttons */}
              <motion.div
                className="banner-actions"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <motion.button
                  className="btn btn-primary"
                  onClick={() => navigate(`/watch/${currentMovie.slug}`)}
                  whileHover={{ scale: 1.05, boxShadow: '0 10px 40px rgba(108, 92, 231, 0.4)' }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="icon">▶️</span>
                  Xem ngay
                </motion.button>
                
                <motion.button
                  className="btn btn-secondary"
                  onClick={() => navigate(`/movie/${currentMovie.slug}`)}
                  whileHover={{ scale: 1.05, boxShadow: '0 10px 40px rgba(255, 255, 255, 0.2)' }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="icon">ℹ️</span>
                  Chi tiết
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation controls */}
        {movies.length > 1 && (
          <>
            {/* Previous/Next buttons */}
            <div className="banner-nav">
              <motion.button
                className="nav-btn nav-prev"
                onClick={handlePrev}
                whileHover={{ scale: 1.1, x: -5 }}
                whileTap={{ scale: 0.9 }}
              >
                ‹
              </motion.button>
              
              <motion.button
                className="nav-btn nav-next"
                onClick={handleNext}
                whileHover={{ scale: 1.1, x: 5 }}
                whileTap={{ scale: 0.9 }}
              >
                ›
              </motion.button>
            </div>

            {/* Dot indicators */}
            <div className="banner-dots">
              {movies.map((_, index) => (
                <motion.button
                  key={index}
                  className={`dot ${index === currentIndex ? 'active' : ''}`}
                  onClick={() => handleDotClick(index)}
                  whileHover={{ scale: 1.3 }}
                  whileTap={{ scale: 0.9 }}
                  animate={{
                    scale: index === currentIndex ? 1.2 : 1,
                  }}
                />
              ))}
            </div>

            {/* Auto-play toggle */}
            <motion.button
              className="autoplay-toggle"
              onClick={() => setIsAutoPlay(!isAutoPlay)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title={isAutoPlay ? 'Tạm dừng' : 'Tự động chơi'}
            >
              {isAutoPlay ? '⏸️' : '▶️'}
            </motion.button>
          </>
        )}
      </div>

      {/* Progress bar cho auto-play */}
      {isAutoPlay && movies.length > 1 && (
        <motion.div
          className="progress-bar"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: autoPlayInterval / 1000, ease: 'linear' }}
          key={currentIndex}
        />
      )}
    </div>
  );
};

export default Banner3D;

