/**
 * MovieCard3D Component
 * 
 * Component hiển thị movie card với hiệu ứng 3D đẹp mắt
 * Sử dụng framer-motion để tạo animations mượt mà
 * 
 * Features:
 * - 3D flip animation khi hover
 * - Parallax effect với mouse movement
 * - Smooth transitions
 * - Optimized performance
 */

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import './MovieCard3D.css';

interface MovieCardProps {
  movie: {
    slug: string;
    name: string;
    poster_url: string;
    thumb_url?: string;
    year?: number;
    quality?: string;
    episode_current?: string;
    lang?: string;
  };
  onSave?: () => void | Promise<void>;
  onWatch?: () => void;
}

const MovieCard3D: React.FC<MovieCardProps> = ({ movie }) => {
  const navigate = useNavigate();
  
  // Motion values cho 3D transforms
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Spring animations cho smooth movement
  const mouseXSpring = useSpring(x, { damping: 20, stiffness: 300 });
  const mouseYSpring = useSpring(y, { damping: 20, stiffness: 300 });

  // Transform values cho 3D rotation
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['15deg', '-15deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-15deg', '15deg']);

  // Handle mouse move để tạo parallax effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  // Reset position khi mouse leave
  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  // Inline fallback image as data URL (no file needed)
  const NO_POSTER_FALLBACK = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 450"%3E%3Cdefs%3E%3ClinearGradient id="g" x1="0" y1="0" x2="0" y2="1"%3E%3Cstop offset="0" stop-color="%231a1b21"/%3E%3Cstop offset="1" stop-color="%230f0f12"/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="300" height="450" fill="url(%23g)"/%3E%3Crect x="2" y="2" width="296" height="446" fill="none" stroke="%236c5ce7" stroke-width="2" stroke-dasharray="5,5" opacity=".3"/%3E%3Cg transform="translate(150,180)"%3E%3Crect x="-60" y="-40" width="120" height="80" rx="8" fill="%232a2c35" stroke="%236c5ce7" stroke-width="2"/%3E%3Crect x="-50" y="-30" width="100" height="60" rx="4" fill="%2315161a"/%3E%3Ccircle cx="-55" cy="-20" r="3" fill="%236c5ce7"/%3E%3Ccircle cx="-55" cy="0" r="3" fill="%236c5ce7"/%3E%3Ccircle cx="-55" cy="20" r="3" fill="%236c5ce7"/%3E%3Ccircle cx="55" cy="-20" r="3" fill="%236c5ce7"/%3E%3Ccircle cx="55" cy="0" r="3" fill="%236c5ce7"/%3E%3Ccircle cx="55" cy="20" r="3" fill="%236c5ce7"/%3E%3Cpolygon points="0,-15 20,0 0,15" fill="%236c5ce7" opacity=".6"/%3E%3C/g%3E%3Ctext x="150" y="280" font-family="Arial" font-size="16" fill="%23a0a0a8" text-anchor="middle"%3ENo Poster%3C/text%3E%3Ctext x="150" y="305" font-family="Arial" font-size="14" fill="%236c5ce7" text-anchor="middle"%3EAvailable%3C/text%3E%3C/svg%3E';
  
  // Poster URL với fallback - images already optimized in HomePage
  const posterUrl = movie.poster_url || movie.thumb_url || NO_POSTER_FALLBACK;

  // Handle card click to view movie details
  const handleCardClick = () => {
    navigate(`/movie/${movie.slug}`);
  };

  return (
    <motion.div
      className="movie-card-3d"
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      initial={{ opacity: 0, scale: 0.8, y: 50 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      whileHover={{ scale: 1.05, z: 50 }}
      transition={{
        type: 'spring',
        stiffness: 260,
        damping: 20,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleCardClick}
    >
      {/* Card content */}
      <div className="card-inner">
        {/* Poster image với loading effect */}
        <motion.div
          className="card-poster"
          style={{
            transformStyle: 'preserve-3d',
            transform: 'translateZ(20px)',
          }}
        >
          <img
            src={posterUrl}
            alt={movie.name}
            loading="lazy"
            crossOrigin="anonymous"
            onError={(e) => {
              const target = e.currentTarget;
              // Prevent infinite loop - use inline fallback
              if (!target.src.startsWith('data:image')) {
                target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 450"%3E%3Cdefs%3E%3ClinearGradient id="g" x1="0" y1="0" x2="0" y2="1"%3E%3Cstop offset="0" stop-color="%231a1b21"/%3E%3Cstop offset="1" stop-color="%230f0f12"/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="300" height="450" fill="url(%23g)"/%3E%3Crect x="2" y="2" width="296" height="446" fill="none" stroke="%236c5ce7" stroke-width="2" stroke-dasharray="5,5" opacity=".3"/%3E%3Cg transform="translate(150,180)"%3E%3Crect x="-60" y="-40" width="120" height="80" rx="8" fill="%232a2c35" stroke="%236c5ce7" stroke-width="2"/%3E%3Crect x="-50" y="-30" width="100" height="60" rx="4" fill="%2315161a"/%3E%3Ccircle cx="-55" cy="-20" r="3" fill="%236c5ce7"/%3E%3Ccircle cx="-55" cy="0" r="3" fill="%236c5ce7"/%3E%3Ccircle cx="-55" cy="20" r="3" fill="%236c5ce7"/%3E%3Ccircle cx="55" cy="-20" r="3" fill="%236c5ce7"/%3E%3Ccircle cx="55" cy="0" r="3" fill="%236c5ce7"/%3E%3Ccircle cx="55" cy="20" r="3" fill="%236c5ce7"/%3E%3Cpolygon points="0,-15 20,0 0,15" fill="%236c5ce7" opacity=".6"/%3E%3C/g%3E%3Ctext x="150" y="280" font-family="Arial" font-size="16" fill="%23a0a0a8" text-anchor="middle"%3ENo Poster%3C/text%3E%3Ctext x="150" y="305" font-family="Arial" font-size="14" fill="%236c5ce7" text-anchor="middle"%3EAvailable%3C/text%3E%3C/svg%3E';
              }
            }}
          />
          
          {/* Quality badge với 3D effect */}
          {movie.quality && (
            <motion.div
              className="quality-badge"
              style={{
                transform: 'translateZ(30px)',
              }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              {movie.quality}
            </motion.div>
          )}

          {/* Episode info */}
          {movie.episode_current && (
            <motion.div
              className="episode-badge"
              style={{
                transform: 'translateZ(30px)',
              }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.25 }}
            >
              {movie.episode_current}
            </motion.div>
          )}
        </motion.div>

        {/* Movie info với slide animation */}
        <motion.div
          className="card-info"
          style={{
            transform: 'translateZ(40px)',
          }}
        >
          <h3 className="movie-title">{movie.name}</h3>
          <div className="movie-meta">
            {movie.year && <span className="year">{movie.year}</span>}
            {movie.lang && <span className="lang">{movie.lang}</span>}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default MovieCard3D;

