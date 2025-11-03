/**
 * Header Component
 * 
 * Sticky header với search, navigation, và user actions
 * Animated và responsive design
 * 
 * Features:
 * - Sticky scroll behavior
 * - Search functionality
 * - Theme toggle
 * - Mobile menu
 * - Smooth animations
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import './Header.css';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [showCountryMenu, setShowCountryMenu] = useState(false);
  const { scrollY } = useScroll();
  const navigate = useNavigate();

  // Handle scroll to add/remove header shadow
  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 50);
  });

  // Handle search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setIsMobileMenuOpen(false);
    }
  };

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <motion.header
      className={`header ${isScrolled ? 'scrolled' : ''}`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
    >
      <div className="container header-container">
        {/* Logo/Brand */}
        <Link to="/" className="brand">
          <motion.div
            className="brand-logo"
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
          >
            🎬
          </motion.div>
          <span className="brand-text">PhimHV</span>
        </Link>

        {/* Search Bar */}
        <form className="search-form" onSubmit={handleSearch}>
          <motion.div
            className="search-wrapper"
            whileFocus={{ scale: 1.02 }}
          >
            <input
              type="search"
              className="search-input"
              placeholder="Tìm kiếm phim, anime... (Nhấn Enter)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoComplete="off"
            />
          </motion.div>
        </form>

        {/* Navigation */}
        <nav className={`nav ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          <Link to="/" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>
            <motion.span whileHover={{ scale: 1.05 }}>
              🏠 Trang chủ
            </motion.span>
          </Link>
          
          {/* Category Dropdown */}
          <div 
            className="nav-dropdown"
            onMouseEnter={() => setShowCategoryMenu(true)}
            onMouseLeave={() => setShowCategoryMenu(false)}
          >
            <motion.span className="nav-link" whileHover={{ scale: 1.05 }}>
              🎭 Thể loại
            </motion.span>
            {showCategoryMenu && (
              <motion.div
                className="dropdown-menu"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {[
                  { name: 'Hành động', slug: 'hanh-dong' },
                  { name: 'Hài hước', slug: 'hai-huoc' },
                  { name: 'Tình cảm', slug: 'tinh-cam' },
                  { name: 'Phiêu lưu', slug: 'phieu-luu' },
                  { name: 'Hoạt hình', slug: 'hoat-hinh' },
                  { name: 'Kinh dị', slug: 'kinh-di' },
                  { name: 'Khoa học viễn tưởng', slug: 'khoa-hoc-vien-tuong' },
                  { name: 'Hình sự', slug: 'hinh-su' },
                  { name: 'Võ thuật', slug: 'vo-thuat' },
                  { name: 'Tâm lý', slug: 'tam-ly' },
                  { name: 'Chiến tranh', slug: 'chien-tranh' },
                  { name: 'Học đường', slug: 'hoc-duong' },
                  { name: 'Gia đình', slug: 'gia-dinh' },
                  { name: 'Âm nhạc', slug: 'am-nhac' },
                  { name: 'Thần thoại', slug: 'than-thoai' },
                ].map(category => (
                  <Link
                    key={category.slug}
                    to={`/category/${category.slug}`}
                    className="dropdown-item"
                    onClick={() => {
                      setShowCategoryMenu(false);
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    {category.name}
                  </Link>
                ))}
              </motion.div>
            )}
          </div>

          {/* Country Dropdown */}
          <div 
            className="nav-dropdown"
            onMouseEnter={() => setShowCountryMenu(true)}
            onMouseLeave={() => setShowCountryMenu(false)}
          >
            <motion.span className="nav-link" whileHover={{ scale: 1.05 }}>
              🌍 Quốc gia
            </motion.span>
            {showCountryMenu && (
              <motion.div
                className="dropdown-menu"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {[
                  { name: 'Việt Nam', slug: 'viet-nam' },
                  { name: 'Hàn Quốc', slug: 'han-quoc' },
                  { name: 'Trung Quốc', slug: 'trung-quoc' },
                  { name: 'Nhật Bản', slug: 'nhat-ban' },
                  { name: 'Mỹ', slug: 'my' },
                  { name: 'Thái Lan', slug: 'thai-lan' },
                  { name: 'Hồng Kông', slug: 'hong-kong' },
                  { name: 'Đài Loan', slug: 'dai-loan' },
                  { name: 'Ấn Độ', slug: 'an-do' },
                  { name: 'Anh', slug: 'anh' },
                  { name: 'Pháp', slug: 'phap' },
                  { name: 'Úc', slug: 'uc' },
                  { name: 'Canada', slug: 'canada' },
                  { name: 'Đức', slug: 'duc' },
                  { name: 'Nga', slug: 'nga' },
                ].map(country => (
                  <Link
                    key={country.slug}
                    to={`/country/${country.slug}`}
                    className="dropdown-item"
                    onClick={() => {
                      setShowCountryMenu(false);
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    {country.name}
                  </Link>
                ))}
              </motion.div>
            )}
          </div>
          
          <Link to="/filter" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>
            <motion.span whileHover={{ scale: 1.05 }}>
              🔍 Bộ lọc
            </motion.span>
          </Link>
          
          <Link to="/saved" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>
            <motion.span whileHover={{ scale: 1.05 }}>
              ❤️ Đã lưu
            </motion.span>
          </Link>

        </nav>

        {/* User actions */}
        <div className="header-actions">
          {/* Theme toggle */}
          <motion.button
            className="theme-toggle"
            whileHover={{ scale: 1.1, rotate: 15 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              document.body.classList.toggle('light-theme');
            }}
            title="Đổi giao diện"
          >
            🌙
          </motion.button>
        </div>

        {/* Mobile menu toggle */}
        <motion.button
          className="mobile-menu-toggle"
          whileTap={{ scale: 0.9 }}
          onClick={toggleMobileMenu}
        >
          <span className={`menu-icon ${isMobileMenuOpen ? 'open' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </span>
        </motion.button>
      </div>
    </motion.header>
  );
};

export default Header;

