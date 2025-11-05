/**
 * MobileDrawer Component
 * 
 * Slide-in navigation drawer cho mobile
 * Smooth animations và gesture support
 */

import { motion, AnimatePresence, type PanInfo } from 'framer-motion';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './MobileDrawer.css';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Array<{ name: string; slug: string }>;
  countries: Array<{ name: string; slug: string }>;
}

const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  categories,
  countries
}) => {
  // Lock body scroll when drawer open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle swipe to close
  const handleDragEnd = (_event: any, info: PanInfo) => {
    if (info.offset.x < -100) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            transition={{ duration: 0.3 }}
          />

          {/* Drawer */}
          <motion.div
            className="mobile-drawer"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ 
              type: 'spring',
              damping: 30,
              stiffness: 300
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
          >
            {/* Drawer Header */}
            <div className="drawer-header">
              <div className="drawer-logo">
                <span className="logo-icon">🎬</span>
                <span className="logo-text">PhimHV</span>
              </div>
              <motion.button
                className="drawer-close"
                onClick={onClose}
                whileTap={{ scale: 0.9 }}
              >
                ✕
              </motion.button>
            </div>

            {/* Navigation Items */}
            <nav className="drawer-nav">
              <Link 
                to="/" 
                className="drawer-item"
                onClick={onClose}
              >
                <span className="item-icon">🏠</span>
                <span className="item-text">Trang chủ</span>
              </Link>

              {/* Categories Section */}
              <div className="drawer-section">
                <h3 className="section-title">
                  <span className="title-icon">🎭</span>
                  Thể loại
                </h3>
                <div className="section-grid">
                  {categories.slice(0, 8).map(cat => (
                    <Link
                      key={cat.slug}
                      to={`/category/${cat.slug}`}
                      className="grid-item"
                      onClick={onClose}
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Countries Section */}
              <div className="drawer-section">
                <h3 className="section-title">
                  <span className="title-icon">🌍</span>
                  Quốc gia
                </h3>
                <div className="section-grid">
                  {countries.slice(0, 8).map(country => (
                    <Link
                      key={country.slug}
                      to={`/country/${country.slug}`}
                      className="grid-item"
                      onClick={onClose}
                    >
                      {country.name}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Quick Links */}
              <div className="drawer-divider"></div>
              
              <Link 
                to="/filter" 
                className="drawer-item"
                onClick={onClose}
              >
                <span className="item-icon">🔍</span>
                <span className="item-text">Bộ lọc phim</span>
              </Link>

              <Link 
                to="/saved" 
                className="drawer-item"
                onClick={onClose}
              >
                <span className="item-icon">❤️</span>
                <span className="item-text">Phim đã lưu</span>
              </Link>
            </nav>

            {/* Drawer Footer */}
            <div className="drawer-footer">
              <motion.button
                className="theme-toggle-mobile"
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  document.body.classList.toggle('light-theme');
                }}
              >
                <span>🌙</span>
                <span>Chế độ tối</span>
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileDrawer;