/**
 * HomePage Component
 * 
 * Main landing page với Banner 3D và Movie Grid
 * Hiển thị phim mới nhất, trending, và categories
 * 
 * Features:
 * - 3D Banner slider
 * - Animated movie cards
 * - Infinite scroll
 * - Category filtering
 * - Performance optimized
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Banner3D from '../components/Banner3D';
import MovieCard3D from '../components/MovieCard3D';
import { useFirebase } from '../contexts/FirebaseContext';
import { movieApi } from '../services/movieApi';
import type { Movie } from '../services/movieApi';
import './HomePage.css';

// Movie type imported from movieApi service

const HomePage = () => {
  const [bannerMovies, setBannerMovies] = useState<Movie[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { saveMovie, isMovieSaved } = useFirebase();

  // Fetch movies from API using new service
  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true);
        console.log('🎬 Fetching movies from API...');
        
        // Fetch phim mới cập nhật (theo API docs: https://kkphim.com/tai-lieu-api)
        // Endpoint: GET https://phimapi.com/danh-sach/phim-moi-cap-nhat?page=1
        // Returns DirectApiResponse: { status, items: [...], pagination: {...} }
        const response = await movieApi.getNewMovies(1);
        console.log('📦 API Response:', response);
        console.log('🔍 Response structure:', {
          hasStatus: 'status' in response,
          status: response.status,
          hasItems: 'items' in response && response.items ? 'YES' : 'NO',
          itemsLength: response.items?.length || 0,
          hasPagination: 'pagination' in response,
        });

        // DirectApiResponse structure: items at root level
        let movieList: Movie[] = [];
        
        if (response.status && response.items) {
          // DirectApiResponse structure
          movieList = response.items;
          console.log(`✅ Found ${movieList.length} movies in response.items`);
          
          // Check pagination (at root level)
          if (response.pagination) {
            const { currentPage, totalPages } = response.pagination;
            setHasMore(currentPage < totalPages);
            console.log(`📄 Pagination: page ${currentPage}/${totalPages}`);
          }
        } else {
          console.warn('⚠️ API returned no items or invalid response:', response);
          console.log('Response keys:', Object.keys(response as any));
          setError('Không có dữ liệu phim. API có thể đang bảo trì.');
          setLoading(false);
          return;
        }

        if (movieList.length > 0) {
          // Optimize images to WebP
          const optimizedMovies = movieList.map(movie => ({
            ...movie,
            poster_url: movieApi.optimizeImage(movie.poster_url),
            thumb_url: movieApi.optimizeImage(movie.thumb_url),
          }));
          
          setMovies(optimizedMovies);
          
          // Set top 5 movies for banner
          setBannerMovies(optimizedMovies.slice(0, 5));
          console.log(`🎯 Banner: ${optimizedMovies.slice(0, 5).length} movies`);
          console.log(`🎬 Total movies loaded: ${optimizedMovies.length}`);
        } else {
          console.warn('⚠️ Movie list is empty');
          setError('Không tìm thấy phim nào.');
        }

        setLoading(false);
      } catch (err) {
        console.error('❌ Failed to fetch movies:', err);
        setError('Không thể tải danh sách phim. Vui lòng thử lại sau.');
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  // Load more movies
  const loadMoreMovies = async () => {
    if (loadingMore || !hasMore) {
      console.log('⚠️ Load more blocked:', { loadingMore, hasMore });
      return;
    }
    
    try {
      setLoadingMore(true);
      const nextPage = currentPage + 1;
      console.log(`📄 Loading page ${nextPage}...`);
      console.log(`📊 Current movies count: ${movies.length}`);
      
      const response = await movieApi.getNewMovies(nextPage);
      console.log(`📦 Page ${nextPage} response:`, response);
      
      let movieList: Movie[] = [];
      if (response.status && response.items) {
        movieList = response.items;
        console.log(`📥 Received ${movieList.length} movies for page ${nextPage}`);
        
        // Check pagination (at root level for DirectApiResponse)
        if (response.pagination) {
          const { currentPage: apiPage, totalPages } = response.pagination;
          setHasMore(apiPage < totalPages);
          console.log(`📄 Load More Pagination: page ${apiPage}/${totalPages}`);
        }
      } else {
        console.error('❌ Invalid response structure:', response);
        alert('Không thể tải thêm phim. Vui lòng thử lại!');
        setLoadingMore(false);
        return;
      }

      if (movieList.length > 0) {
        // Optimize images
        const optimizedMovies = movieList.map(movie => ({
          ...movie,
          poster_url: movieApi.optimizeImage(movie.poster_url),
          thumb_url: movieApi.optimizeImage(movie.thumb_url),
        }));
        
        // Append to existing movies
        setMovies(prev => {
          console.log(`🔄 Updating movies: ${prev.length} + ${optimizedMovies.length} = ${prev.length + optimizedMovies.length}`);
          return [...prev, ...optimizedMovies];
        });
        setCurrentPage(nextPage);
        console.log(`✅ Loaded ${optimizedMovies.length} more movies. Total: ${movies.length + optimizedMovies.length}`);
        
        // Scroll to first new movie
        setTimeout(() => {
          const firstNewMovie = document.querySelectorAll('.movie-grid > div')[movies.length];
          if (firstNewMovie) {
            firstNewMovie.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      } else {
        console.warn('⚠️ No movies received from API');
        setHasMore(false);
        alert('Không còn phim để tải!');
      }
    } catch (err) {
      console.error('❌ Failed to load more movies:', err);
      alert(`Lỗi khi tải thêm phim: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoadingMore(false);
    }
  };

  // Handle save movie
  const handleSaveMovie = async (movie: Movie) => {
    try {
      const saved = await isMovieSaved(movie.slug);
      if (saved) {
        alert('Phim đã có trong danh sách!');
        return;
      }

      await saveMovie(movie);
      alert(`Đã lưu "${movie.name}" vào danh sách yêu thích!`);
    } catch (error) {
      console.error('Failed to save movie:', error);
      alert('Không thể lưu phim. Vui lòng thử lại.');
    }
  };

  // Handle watch movie
  const handleWatchMovie = (slug: string) => {
    window.location.href = `/watch/${slug}`;
  };

  // Loading state
  if (loading) {
    return (
      <motion.div
        className="loading-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="loading-spinner"></div>
        <p className="loading-text">Đang tải nội dung tuyệt vời...</p>
      </motion.div>
    );
  }

  // Error state
  if (error) {
    return (
      <motion.div
        className="error-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="error-icon">❌</div>
        <h2 className="error-title">Oops! Đã có lỗi xảy ra</h2>
        <p className="error-message">{error}</p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          Tải lại trang
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="home-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Hero Banner với 3D effects */}
      {bannerMovies.length > 0 && (
        <Banner3D 
          movies={bannerMovies} 
          autoPlayInterval={5000}
        />
      )}

      {/* Main content */}
      <div className="container">
        {/* Section header */}
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="section-title">
            <span className="title-icon">🔥</span>
            Anime Hot Nhất
          </h2>
          <p className="section-subtitle">
            Khám phá những bộ anime đỉnh cao được yêu thích nhất
          </p>
        </motion.div>

        {/* Movie grid với staggered animation */}
        <div className="movie-grid">
          {movies.map((movie, index) => (
            <motion.div
              key={`${movie.slug}-${index}`}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ 
                opacity: 1, 
                y: 0, 
                scale: 1,
              }}
              transition={{
                type: 'spring',
                stiffness: 100,
                damping: 15,
                delay: index < 10 ? index * 0.05 : 0, // Only stagger first page
              }}
              layout
            >
              <MovieCard3D
                movie={movie}
                onSave={() => handleSaveMovie(movie)}
                onWatch={() => handleWatchMovie(movie.slug)}
              />
            </motion.div>
          ))}
        </div>


        {/* Load more section */}
        {hasMore && (
          <motion.div
            className="load-more-section"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <motion.button
              className="btn btn-primary btn-lg"
              whileHover={!loadingMore ? { scale: 1.05 } : {}}
              whileTap={!loadingMore ? { scale: 0.95 } : {}}
              onClick={(e) => {
                e.preventDefault();
                console.log('🎯 Load More button clicked!');
                loadMoreMovies();
              }}
              disabled={loadingMore}
              style={{
                opacity: loadingMore ? 0.7 : 1,
                cursor: loadingMore ? 'not-allowed' : 'pointer',
              }}
            >
              {loadingMore ? (
                <>
                  <span className="loading-spinner" style={{ marginRight: '10px', width: '20px', height: '20px' }}></span>
                  Đang tải...
                </>
              ) : (
                <>
                  <span>🎬</span>
                  Xem thêm phim (Trang {currentPage + 1})
                </>
              )}
            </motion.button>
          </motion.div>
        )}

        {/* Categories preview */}
        <motion.div
          className="categories-section"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h3 className="categories-title">Thể loại phổ biến</h3>
          <div className="categories-grid">
            {[
              { name: 'Hành động', icon: '⚔️', slug: 'hanh-dong' },
              { name: 'Phiêu lưu', icon: '🗺️', slug: 'phieu-luu' },
              { name: 'Hài hước', icon: '😄', slug: 'hai-huoc' },
              { name: 'Học đường', icon: '🎓', slug: 'hoc-duong' },
              { name: 'Lãng mạn', icon: '💕', slug: 'lang-man' },
              { name: 'Siêu nhiên', icon: '✨', slug: 'sieu-nhien' },
            ].map((category) => (
              <motion.a
                key={category.slug}
                href={`/category/${category.slug}`}
                className="category-card"
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="category-icon">{category.icon}</span>
                <span className="category-name">{category.name}</span>
              </motion.a>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default HomePage;

