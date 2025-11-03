/**
 * FilterPage Component
 * 
 * Trang lọc phim với filters:
 * - Thể loại (Category)
 * - Quốc gia (Country)
 * - Năm (Year)
 * 
 * Features:
 * - Multiple filters combination
 * - Real-time filtering
 * - Pagination support
 * - Modern UI với animations
 */

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import MovieCard3D from '../components/MovieCard3D';
import { movieApi } from '../services/movieApi';
import type { Movie } from '../services/movieApi';
import './FilterPage.css';

// Categories data (sync with Header)
const CATEGORIES = [
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
];

// Countries data (sync with Header)
const COUNTRIES = [
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
];

// Years (2015 - 2025)
const YEARS = Array.from({ length: 11 }, (_, i) => 2025 - i);

const FilterPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [totalFetched, setTotalFetched] = useState(0); // Track total movies fetched before filtering
  const [pagesFetched, setPagesFetched] = useState(0); // Track number of pages fetched
  const [cachedFilteredMovies, setCachedFilteredMovies] = useState<Movie[]>([]); // Cache for combined filters
  const [lastFilterKey, setLastFilterKey] = useState(''); // Track filter changes
  const [usedCategoryFirst, setUsedCategoryFirst] = useState(false); // Track which strategy was used
  
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedCountry, setSelectedCountry] = useState(searchParams.get('country') || '');
  const [selectedYear, setSelectedYear] = useState(searchParams.get('year') || '');
  const page = parseInt(searchParams.get('page') || '1');

  // Fetch movies based on filters with client-side combined filtering
  useEffect(() => {
    const fetchMovies = async () => {
      // Determine primary filter (API supports only one at a time)
      // Smart Priority: Year > Category > Country (Year has fewer movies, easier to filter)
      const hasCombinedFilters = 
        (selectedCategory ? 1 : 0) + (selectedCountry ? 1 : 0) + (selectedYear ? 1 : 0) > 1;
      
      // Create filter key to detect changes
      const currentFilterKey = `${selectedCategory}-${selectedCountry}-${selectedYear}`;
      
      // If combined filters and only page changed (filters same), use cache
      if (hasCombinedFilters && currentFilterKey === lastFilterKey && cachedFilteredMovies.length > 0) {
        console.log('Using cached results for page:', page);
        const itemsPerPage = 24;
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedMovies = cachedFilteredMovies.slice(startIndex, endIndex);
        setMovies(paginatedMovies);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      
      setLoading(true);
      try {
        let items: Movie[] = [];
        let pagination: any = null;
        
        // Fetch based on primary filter
        // For combined filters: fetch multiple pages to get enough results
        
        // SMART STRATEGY: Recent years (2024-2025) have fewer horror movies scattered across many pages
        // Better to fetch from category first, then filter by year
        const isRecentYear = selectedYear && parseInt(selectedYear) >= 2024;
        const shouldUseCategoryFirst = selectedCategory && isRecentYear && hasCombinedFilters;
        
        // Save strategy to state for info display (convert to boolean)
        setUsedCategoryFirst(!!shouldUseCategoryFirst);
        
        if (shouldUseCategoryFirst) {
          // CATEGORY-FIRST for recent years (better coverage for scattered categories like horror)
          // Fetch 10 pages from category (240 movies), then filter by year
          const promises = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(pageNum => 
            movieApi.getMoviesByCategory(selectedCategory, {
              page: pageNum,
              limit: 24,
            })
          );
          const responses = await Promise.all(promises);
          responses.forEach(response => {
            if (response.status && response.data?.items) {
              items.push(...response.data.items);
              if (!pagination) pagination = response.data.params?.pagination;
            }
          });
        } else if (selectedYear && hasCombinedFilters) {
          // YEAR-FIRST for older years (2015-2023)
          // Fetch 20 pages for better coverage (increased from 10 to capture more scattered movies)
          const promises = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map(pageNum => 
            movieApi.getMoviesByYear(parseInt(selectedYear), {
              page: pageNum,
              limit: 24,
            })
          );
          const responses = await Promise.all(promises);
          responses.forEach(response => {
            if (response.status && response.data?.items) {
              items.push(...response.data.items);
              if (!pagination) pagination = response.data.params?.pagination;
            }
          });
        } else if (selectedCategory) {
          if (hasCombinedFilters) {
            // BATCHED FETCHING: Fetch pages in small batches to avoid CORS/rate limiting
            // Example: 100 pages = 5 batches × 20 pages each (safe and complete)
            console.log(`🔄 Fetching ${selectedCategory} with batched approach...`);
            
            // Step 1: Fetch first page to get totalPages
            const firstResponse = await movieApi.getMoviesByCategory(selectedCategory, {
              page: 1,
              limit: 24,
            });
            
            if (firstResponse.status && firstResponse.data?.items) {
              items.push(...firstResponse.data.items);
              pagination = firstResponse.data.params?.pagination;
              
              const totalPages = pagination?.totalPages || 1;
              const maxPages = Math.min(totalPages, 150); // Max 150 pages (99.9% coverage)
              const BATCH_SIZE = 20; // Fetch 20 pages per batch (safe for CORS)
              
              console.log(`📊 Total ${totalPages} pages, fetching ${maxPages} pages in batches of ${BATCH_SIZE}`);
              
              setPagesFetched(maxPages);
              
              // Step 2: Fetch remaining pages in BATCHES
              if (maxPages > 1) {
                // Calculate number of batches needed
                const numBatches = Math.ceil((maxPages - 1) / BATCH_SIZE);
                
                for (let batchIndex = 0; batchIndex < numBatches; batchIndex++) {
                  const startPage = 2 + (batchIndex * BATCH_SIZE);
                  const endPage = Math.min(startPage + BATCH_SIZE - 1, maxPages);
                  
                  console.log(`  📦 Batch ${batchIndex + 1}/${numBatches}: Pages ${startPage}-${endPage}`);
                  
                  // Fetch this batch in parallel
                  const batchPromises = [];
                  for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
                    batchPromises.push(
                      movieApi.getMoviesByCategory(selectedCategory, {
                        page: pageNum,
                        limit: 24,
                      })
                    );
                  }
                  
                  try {
                    const batchResponses = await Promise.all(batchPromises);
                    batchResponses.forEach(response => {
                      if (response.status && response.data?.items) {
                        items.push(...response.data.items);
                      }
                    });
                    console.log(`  ✅ Batch ${batchIndex + 1} complete: ${items.length} total movies`);
                  } catch (error) {
                    console.error(`  ⚠️ Batch ${batchIndex + 1} had errors, continuing...`);
                  }
                  
                  // Small delay between batches to avoid rate limiting
                  if (batchIndex < numBatches - 1) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                  }
                }
                
                console.log(`✅ All batches complete! Total: ${items.length} movies from ${maxPages} pages`);
              }
            }
          } else {
            const response = await movieApi.getMoviesByCategory(selectedCategory, {
              page,
              limit: 24,
            });
            if (response.status && response.data?.items) {
              items = response.data.items;
              pagination = response.data.params?.pagination;
            }
          }
        } else if (selectedCountry) {
          if (hasCombinedFilters) {
            // BATCHED FETCHING for Country: Same strategy as Category
            console.log(`🔄 Fetching ${selectedCountry} with batched approach...`);
            
            // Step 1: Fetch first page to get totalPages
            const firstResponse = await movieApi.getMoviesByCountry(selectedCountry, {
              page: 1,
              limit: 24,
            });
            
            if (firstResponse.status && firstResponse.data?.items) {
              items.push(...firstResponse.data.items);
              pagination = firstResponse.data.params?.pagination;
              
              const totalPages = pagination?.totalPages || 1;
              const maxPages = Math.min(totalPages, 150); // Max 150 pages (same as category)
              const BATCH_SIZE = 20;
              
              console.log(`📊 Total ${totalPages} pages, fetching ${maxPages} pages in batches of ${BATCH_SIZE}`);
              
              setPagesFetched(maxPages);
              
              // Step 2: Fetch remaining pages in BATCHES
              if (maxPages > 1) {
                const numBatches = Math.ceil((maxPages - 1) / BATCH_SIZE);
                
                for (let batchIndex = 0; batchIndex < numBatches; batchIndex++) {
                  const startPage = 2 + (batchIndex * BATCH_SIZE);
                  const endPage = Math.min(startPage + BATCH_SIZE - 1, maxPages);
                  
                  console.log(`  📦 Batch ${batchIndex + 1}/${numBatches}: Pages ${startPage}-${endPage}`);
                  
                  const batchPromises = [];
                  for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
                    batchPromises.push(
                      movieApi.getMoviesByCountry(selectedCountry, {
                        page: pageNum,
                        limit: 24,
                      })
                    );
                  }
                  
                  try {
                    const batchResponses = await Promise.all(batchPromises);
                    batchResponses.forEach(response => {
                      if (response.status && response.data?.items) {
                        items.push(...response.data.items);
                      }
                    });
                    console.log(`  ✅ Batch ${batchIndex + 1} complete: ${items.length} total movies`);
                  } catch (error) {
                    console.error(`  ⚠️ Batch ${batchIndex + 1} had errors, continuing...`);
                  }
                  
                  // Small delay between batches
                  if (batchIndex < numBatches - 1) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                  }
                }
                
                console.log(`✅ All batches complete! Total: ${items.length} movies from ${maxPages} pages`);
              }
            }
          } else {
            // Single country filter (no combined filters)
            const response = await movieApi.getMoviesByCountry(selectedCountry, {
              page,
              limit: 24,
            });
            if (response.status && response.data?.items) {
              items = response.data.items;
              pagination = response.data.params?.pagination;
            }
          }
        } else if (selectedYear) {
          const response = await movieApi.getMoviesByYear(parseInt(selectedYear), {
            page,
            limit: 24,
          });
          if (response.status && response.data?.items) {
            items = response.data.items;
            pagination = response.data.params?.pagination;
          }
        } else {
          // Default: latest movies
          const response = await movieApi.getNewMovies(page);
          if (response.status && response.items) {
            items = response.items;
            pagination = response.pagination;
          }
        }

        // Remove duplicates (by slug)
        const uniqueItems = Array.from(
          new Map(items.map(item => [item.slug, item])).values()
        );
        
        // Track total fetched for info display
        if (hasCombinedFilters) {
          setTotalFetched(uniqueItems.length);
        } else {
          setTotalFetched(0);
        }

        // Client-side filtering for combined filters
        let filteredItems = uniqueItems;
        
        // Apply category filter (if year was primary OR category-first strategy)
        if (selectedCategory && selectedYear && hasCombinedFilters && !shouldUseCategoryFirst) {
          // YEAR-FIRST: Filter by category
          const targetCategory = CATEGORIES.find(c => c.slug === selectedCategory);
          console.log('🔍 TARGET CATEGORY:', selectedCategory, targetCategory);
          
          // Analyze ALL categories from fetched movies
          const allCategories = new Set<string>();
          const categorySlugs = new Set<string>();
          uniqueItems.forEach(m => {
            m.category?.forEach(cat => {
              allCategories.add(cat.name);
              categorySlugs.add(cat.slug);
            });
          });
          
          console.log('📊 ALL UNIQUE CATEGORIES FROM 240 MOVIES:', {
            totalMovies: uniqueItems.length,
            uniqueCategoryNames: Array.from(allCategories).sort(),
            uniqueCategorySlugs: Array.from(categorySlugs).sort()
          });
          
          // Sample movies with categories
          console.log('📋 SAMPLE 20 MOVIES:', uniqueItems.slice(0, 20).map(m => ({
            name: m.name,
            categories: m.category?.map(c => `${c.name} (${c.slug})`)
          })));
          
          filteredItems = filteredItems.filter(movie => 
            movie.category?.some(cat => 
              cat.slug === selectedCategory ||
              cat.name.toLowerCase().includes(targetCategory?.name.toLowerCase() || '') ||
              targetCategory?.name.toLowerCase().includes(cat.name.toLowerCase())
            )
          );
          
          console.log(`✅ FILTER RESULT for "${selectedCategory}":`, {
            beforeFilter: uniqueItems.length,
            afterFilter: filteredItems.length,
            matchedMovies: filteredItems.map(m => ({
              name: m.name,
              categories: m.category?.map(c => `${c.name} (${c.slug})`)
            }))
          });
        } else if (selectedYear && selectedCategory && hasCombinedFilters && shouldUseCategoryFirst) {
          // CATEGORY-FIRST: Filter by year
          const targetYear = parseInt(selectedYear);
          filteredItems = filteredItems.filter(movie => 
            movie.year === targetYear || movie.year?.toString() === selectedYear
          );
          
          console.log(`✅ CATEGORY-FIRST FILTER for year ${selectedYear}:`, {
            beforeFilter: uniqueItems.length,
            afterFilter: filteredItems.length,
            strategy: 'category-first (better for recent years)'
          });
        }
        
        // Apply country filter (if category/year was primary)
        if (selectedCountry && (selectedCategory || selectedYear)) {
          filteredItems = filteredItems.filter(movie => 
            movie.country?.some(c => 
              c.slug === selectedCountry || 
              c.name.toLowerCase().includes(COUNTRIES.find(ct => ct.slug === selectedCountry)?.name.toLowerCase() || '')
            )
          );
          
          console.log(`✅ COUNTRY FILTER applied:`, {
            beforeFilter: uniqueItems.length,
            afterFilter: filteredItems.length,
            country: selectedCountry
          });
        }
        
        // Apply year filter (if category/country was primary)
        if (selectedYear && !hasCombinedFilters) {
          // Single year filter - already fetched from year endpoint
        } else if (selectedYear && selectedCategory && !hasCombinedFilters) {
          // This case is now handled by year-first fetching
        }

        // Optimize images
        const optimizedMovies = filteredItems.map((movie: Movie) => ({
          ...movie,
          poster_url: movieApi.optimizeImage(movie.poster_url),
          thumb_url: movieApi.optimizeImage(movie.thumb_url),
        }));
        
        // Client-side pagination for combined filters
        if (hasCombinedFilters) {
          const itemsPerPage = 24;
          const totalFilteredPages = Math.ceil(optimizedMovies.length / itemsPerPage);
          setTotalPages(totalFilteredPages);
          
          // Cache all filtered results
          setCachedFilteredMovies(optimizedMovies);
          setLastFilterKey(currentFilterKey);
          
          // Slice results for current page
          const startIndex = (page - 1) * itemsPerPage;
          const endIndex = startIndex + itemsPerPage;
          const paginatedMovies = optimizedMovies.slice(startIndex, endIndex);
          
          setMovies(paginatedMovies);
          
          console.log('Client-side pagination (cached):', {
            totalResults: optimizedMovies.length,
            totalPages: totalFilteredPages,
            currentPage: page,
            showing: paginatedMovies.length
          });
        } else {
          setMovies(optimizedMovies);
          
          // Clear cache for single filter
          setCachedFilteredMovies([]);
          setLastFilterKey('');
          
          if (pagination) {
            setTotalPages(pagination.totalPages || 1);
          }
        }
      } catch (error) {
        console.error('Failed to fetch filtered movies:', error);
        setMovies([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, [selectedCategory, selectedCountry, selectedYear, page]);

  // Update URL params when filters change (supports combined filters)
  const handleFilterChange = (type: 'category' | 'country' | 'year', value: string) => {
    const newParams = new URLSearchParams(searchParams);
    
    if (type === 'category') {
      setSelectedCategory(value);
      if (value) {
        newParams.set('category', value);
      } else {
        newParams.delete('category');
      }
    } else if (type === 'country') {
      setSelectedCountry(value);
      if (value) {
        newParams.set('country', value);
      } else {
        newParams.delete('country');
      }
    } else if (type === 'year') {
      setSelectedYear(value);
      if (value) {
        newParams.set('year', value);
      } else {
        newParams.delete('year');
      }
    }
    
    newParams.delete('page'); // Reset to page 1
    setSearchParams(newParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSelectedCategory('');
    setSelectedCountry('');
    setSelectedYear('');
    setSearchParams({});
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', newPage.toString());
    setSearchParams(newParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Get active filter label (supports combined filters)
  const getActiveFilterLabel = () => {
    const filters: string[] = [];
    
    if (selectedCategory) {
      filters.push(CATEGORIES.find(c => c.slug === selectedCategory)?.name || 'Thể loại');
    }
    if (selectedCountry) {
      filters.push(COUNTRIES.find(c => c.slug === selectedCountry)?.name || 'Quốc gia');
    }
    if (selectedYear) {
      filters.push(`Năm ${selectedYear}`);
    }
    
    return filters.length > 0 ? filters.join(' + ') : 'Tất cả phim';
  };

  return (
    <motion.div
      className="filter-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="container">
        {/* Header */}
        <motion.div
          className="filter-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1>🎬 Lọc Phim</h1>
          <p className="filter-subtitle">
            Tìm phim yêu thích với bộ lọc thông minh
          </p>
        </motion.div>

        {/* Filter Controls */}
        <motion.div
          className="filter-controls"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* Category Filter */}
          <div className="filter-group">
            <label className="filter-label">🎭 Thể loại</label>
            <select
              className="filter-select"
              value={selectedCategory}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <option value="">Tất cả thể loại</option>
              {CATEGORIES.map(cat => (
                <option key={cat.slug} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Country Filter */}
          <div className="filter-group">
            <label className="filter-label">🌍 Quốc gia</label>
            <select
              className="filter-select"
              value={selectedCountry}
              onChange={(e) => handleFilterChange('country', e.target.value)}
            >
              <option value="">Tất cả quốc gia</option>
              {COUNTRIES.map(country => (
                <option key={country.slug} value={country.slug}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>

          {/* Year Filter */}
          <div className="filter-group">
            <label className="filter-label">📅 Năm</label>
            <select
              className="filter-select"
              value={selectedYear}
              onChange={(e) => handleFilterChange('year', e.target.value)}
            >
              <option value="">Tất cả năm</option>
              {YEARS.map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Button */}
          {(selectedCategory || selectedCountry || selectedYear) && (
            <motion.button
              className="btn btn-clear"
              onClick={handleClearFilters}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              ✖️ Xóa bộ lọc
            </motion.button>
          )}
        </motion.div>

        {/* Active Filter Badge */}
        <motion.div
          className="active-filter-badge"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <span className="badge-text">{getActiveFilterLabel()}</span>
          <span className="badge-count">{movies.length} phim</span>
        </motion.div>

        {/* Combined Filter Info */}
        {((selectedCategory ? 1 : 0) + (selectedCountry ? 1 : 0) + (selectedYear ? 1 : 0)) > 1 && (
          <motion.div
            className="filter-info-note"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            ℹ️ Đang lọc kết hợp - Đã tải {totalFetched} phim từ {
              usedCategoryFirst 
                ? `Thể loại ${CATEGORIES.find(c => c.slug === selectedCategory)?.name} (10 pages, ưu tiên cho năm gần)` 
                : selectedYear 
                  ? `Năm ${selectedYear} (20 pages)` 
                  : selectedCategory 
                    ? `Thể loại ${CATEGORIES.find(c => c.slug === selectedCategory)?.name} (${pagesFetched} pages - tất cả pages có sẵn)` 
                    : `Quốc gia ${COUNTRIES.find(c => c.slug === selectedCountry)?.name} (${pagesFetched} pages - tất cả pages có sẵn)`
            }, sau đó lọc theo các tiêu chí còn lại → Tổng {cachedFilteredMovies.length || movies.length} kết quả{totalPages > 1 ? ` (${totalPages} trang)` : ''}
          </motion.div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Đang tải phim...</p>
          </div>
        ) : (
          <>
            {/* Movies Grid */}
            {movies.length > 0 ? (
              <>
                <div className="movies-grid">
                  {movies.map((movie, index) => (
                    <motion.div
                      key={movie.slug}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <MovieCard3D movie={movie} />
                    </motion.div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <motion.div
                    className="pagination"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    {page > 1 && (
                      <motion.button
                        className="btn btn-secondary"
                        onClick={() => handlePageChange(page - 1)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        ← Trang trước
                      </motion.button>
                    )}
                    
                    <span className="pagination-info">
                      Trang {page} / {totalPages}
                    </span>

                    {page < totalPages && (
                      <motion.button
                        className="btn btn-secondary"
                        onClick={() => handlePageChange(page + 1)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Trang sau →
                      </motion.button>
                    )}
                  </motion.div>
                )}
              </>
            ) : (
              <motion.div
                className="no-results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="no-results-icon">🎭</div>
                <h2>Không tìm thấy phim</h2>
                <p>Thử thay đổi bộ lọc để tìm phim khác</p>
              </motion.div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};

export default FilterPage;
