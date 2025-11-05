/**
 * LoadingSpinner Component
 * 
 * Animated loading spinner với 3D effects
 */

import { motion } from 'framer-motion';
import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'medium', 
  text = 'Đang tải...' 
}) => {
  const sizeClasses = {
    small: 'spinner-small',
    medium: 'spinner-medium',
    large: 'spinner-large'
  };

  return (
    <div className={`loading-spinner-container ${sizeClasses[size]}`}>
      <motion.div
        className="spinner-wrapper"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
      >
        <div className="spinner">
          <motion.div
            className="spinner-ring"
            animate={{
              rotate: 360
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'linear'
            }}
          />
          <motion.div
            className="spinner-ring spinner-ring-2"
            animate={{
              rotate: -360
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear'
            }}
          />
          <motion.div
            className="spinner-ring spinner-ring-3"
            animate={{
              rotate: 360
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: 'linear'
            }}
          />
        </div>
        {text && (
          <motion.p
            className="spinner-text"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {text}
          </motion.p>
        )}
      </motion.div>
    </div>
  );
};

export default LoadingSpinner;