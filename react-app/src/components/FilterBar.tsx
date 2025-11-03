/**
 * FilterBar Component
 * 
 * Advanced filtering UI for movies
 * Multi-select filters with smooth animations
 * 
 * Features:
 * - Category filter
 * - Country filter
 * - Year filter
 * - Sort options
 * - Clear all filters
 */

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { movieApi } from '../services/movieApi';
import './FilterBar.css';

interface FilterBarProps {
  onFilterChange: (filters: FilterState) => void;
}

export interface FilterState {
  category?: string;
  country?: string;
  year?: number;
  sortField?: 'modified.time' | '_id' | 'year';
  sortType?: 'asc' | 'desc';
}

const FilterBar: React.FC<FilterBarProps> = ({ onFilterChange }) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [countries, setCountries] = useState<any[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    sortField: 'modified.time',
    sortType: 'desc',
  });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [categoriesRes, countriesRes] = await Promise.all([
          movieApi.getCategories(),
          movieApi.getCountries(),
        ]);
        
        if (categoriesRes.status && categoriesRes.data?.items) {
          setCategories(categoriesRes.data.items);
        }
        
        if (countriesRes.status && countriesRes.data?.items) {
          setCountries(countriesRes.data.items);
        }
      } catch (error) {
        console.error('Failed to fetch filters:', error);
      }
    };

    fetchFilters();
  }, []);

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    onFilterChange(updated);
  };

  const clearFilters = () => {
    const defaultFilters: FilterState = {
      sortField: 'modified.time',
      sortType: 'desc',
    };
    setFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="filter-bar">
      <motion.button
        className="filter-toggle"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        🔍 {isOpen ? 'Ẩn bộ lọc' : 'Hiện bộ lọc'}
      </motion.button>

      <motion.div
        className="filter-content"
        initial={false}
        animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="filter-grid">
          {/* Category Filter */}
          <div className="filter-group">
            <label className="filter-label">🎭 Thể loại</label>
            <select
              className="filter-select"
              value={filters.category || ''}
              onChange={(e) => handleFilterChange({ category: e.target.value || undefined })}
            >
              <option value="">Tất cả</option>
              {categories.map((cat) => (
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
              value={filters.country || ''}
              onChange={(e) => handleFilterChange({ country: e.target.value || undefined })}
            >
              <option value="">Tất cả</option>
              {countries.map((country) => (
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
              value={filters.year || ''}
              onChange={(e) => handleFilterChange({ year: e.target.value ? parseInt(e.target.value) : undefined })}
            >
              <option value="">Tất cả</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Field */}
          <div className="filter-group">
            <label className="filter-label">📊 Sắp xếp</label>
            <select
              className="filter-select"
              value={filters.sortField || 'modified.time'}
              onChange={(e) => handleFilterChange({ sortField: e.target.value as any })}
            >
              <option value="modified.time">Mới cập nhật</option>
              <option value="year">Năm sản xuất</option>
              <option value="_id">Mới thêm</option>
            </select>
          </div>

          {/* Sort Type */}
          <div className="filter-group">
            <label className="filter-label">🔽 Thứ tự</label>
            <select
              className="filter-select"
              value={filters.sortType || 'desc'}
              onChange={(e) => handleFilterChange({ sortType: e.target.value as 'asc' | 'desc' })}
            >
              <option value="desc">Giảm dần</option>
              <option value="asc">Tăng dần</option>
            </select>
          </div>

          {/* Clear Button */}
          <div className="filter-group">
            <label className="filter-label">&nbsp;</label>
            <motion.button
              className="btn btn-secondary filter-clear"
              onClick={clearFilters}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              🗑️ Xóa bộ lọc
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default FilterBar;

