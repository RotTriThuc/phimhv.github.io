/**
 * Series Navigator Component
 * 
 * Tự động phát hiện và hiển thị các phần của series phim
 * Dựa trên pattern matching tên phim: "Tên Phim (Phần X)" hoặc "(Season X)"
 */

import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { movieApi } from '../services/movieApi';
import type { Movie } from '../services/movieApi';

interface SeriesInfo {
  seriesName: string;
  season: number;
}

interface Props {
  movie: Movie;
  compact?: boolean; // For watch page
}

const SeriesNavigator = ({ movie, compact = false }: Props) => {
  const navigate = useNavigate();
  const [relatedSeasons, setRelatedSeasons] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRelatedSeasons = async () => {
      try {
        // Try detect từ cả Vietnamese name và English origin_name
        let seriesInfo = detectSeries(movie) || detectSeriesFromOrigin(movie);
        
        // Nếu không detect được, thử reverse lookup
        // Search xem có phim nào có tên giống + số không (VD: "Movie 2", "Movie 3")
        if (!seriesInfo) {
          seriesInfo = await reverseDetectSeries(movie);
        }
        
        if (!seriesInfo) {
          setLoading(false);
          return;
        }

        console.log('🎬 Detected series:', seriesInfo);

        // Search for other seasons
        const response = await movieApi.searchMovies({
          keyword: seriesInfo.seriesName,
          limit: 20,
        });

        // Filter và sort seasons
        const seasons = (response.data?.items || [])
          .map(item => {
            // Try detect từ cả 2 nguồn
            const itemSeriesInfo = detectSeries(item) || detectSeriesFromOrigin(item);
            // Nếu item có seriesInfo, dùng nó
            if (itemSeriesInfo) {
              return { ...item, seriesInfo: itemSeriesInfo };
            }
            // Nếu không, check xem có phải là phần 1 (tên giống base name)
            // VD: "The Legend Of Hei" là phần 1 của "The Legend Of Hei 2"
            const itemNameLower = item.name.toLowerCase().trim();
            const itemOriginLower = item.origin_name?.toLowerCase().trim() || '';
            const seriesNameLower = seriesInfo.seriesName.toLowerCase().trim();
            
            if (itemNameLower === seriesNameLower || itemOriginLower === seriesNameLower) {
              return { 
                ...item, 
                seriesInfo: { seriesName: seriesInfo.seriesName, season: 1 } 
              };
            }
            return { ...item, seriesInfo: null };
          })
          .filter(item => {
            if (!item.seriesInfo) return false;
            // Cùng series name (case-insensitive)
            return item.seriesInfo.seriesName.toLowerCase() === seriesInfo.seriesName.toLowerCase();
          })
          .sort((a, b) => (a.seriesInfo?.season || 0) - (b.seriesInfo?.season || 0));

        console.log('📚 Found seasons:', seasons.length);

        // Only show if có ít nhất 2 phần
        if (seasons.length >= 2) {
          setRelatedSeasons(seasons);
        }
      } catch (error) {
        console.error('❌ Failed to fetch related seasons:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRelatedSeasons();
  }, [movie]);

  // Không hiển thị nếu đang loading hoặc không có related seasons
  if (loading || relatedSeasons.length < 2) {
    return null;
  }

  const currentSeason = detectSeries(movie)?.season || 1;

  if (compact) {
    // Compact mode cho watch page - chỉ hiển thị các phần khác
    const otherSeasons = relatedSeasons.filter(s => s.slug !== movie.slug);
    
    if (otherSeasons.length === 0) return null;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          background: 'rgba(108, 92, 231, 0.1)',
          border: '1px solid rgba(108, 92, 231, 0.3)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ color: '#6c5ce7', fontWeight: 600 }}>🎬 Các phần khác:</span>
          {otherSeasons.map(season => {
            const seasonInfo = detectSeries(season);
            return (
              <motion.button
                key={season.slug}
                className="btn btn-ghost"
                onClick={() => navigate(`/movie/${season.slug}`)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  borderRadius: '8px',
                  background: 'rgba(108, 92, 231, 0.2)',
                }}
              >
                Phần {seasonInfo?.season || '?'}
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    );
  }

  // Full mode cho detail page
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ marginBottom: '40px' }}
    >
      <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        🎬 Series Navigator
        <span style={{ fontSize: '18px', color: '#a0a0a8', fontWeight: 400 }}>
          {relatedSeasons[0]?.name.replace(/\(Phần \d+\)|\(Season \d+\)/i, '').trim()}
        </span>
      </h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '16px',
        }}
      >
        {relatedSeasons.map(season => {
          const seasonInfo = detectSeries(season);
          const isCurrent = season.slug === movie.slug;

          return (
            <motion.div
              key={season.slug}
              whileHover={!isCurrent ? { scale: 1.05, y: -5 } : {}}
              whileTap={!isCurrent ? { scale: 0.98 } : {}}
              onClick={() => !isCurrent && navigate(`/movie/${season.slug}`)}
              style={{
                background: isCurrent
                  ? 'linear-gradient(135deg, rgba(108, 92, 231, 0.3), rgba(108, 92, 231, 0.1))'
                  : 'rgba(45, 52, 54, 0.5)',
                border: isCurrent ? '2px solid #6c5ce7' : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '16px',
                cursor: isCurrent ? 'default' : 'pointer',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {isCurrent && (
                <div
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: '#6c5ce7',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  ● Đang xem
                </div>
              )}

              <div style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px', color: '#6c5ce7' }}>
                Phần {seasonInfo?.season || '?'}
              </div>

              {season.origin_name && (
                <div style={{ fontSize: '13px', color: '#a0a0a8', marginBottom: '8px', fontStyle: 'italic' }}>
                  {season.origin_name}
                </div>
              )}

              <div style={{ fontSize: '14px', color: '#e8e8ea', marginBottom: '8px' }}>
                {season.episode_current}
              </div>

              {season.year && (
                <div style={{ fontSize: '12px', color: '#a0a0a8' }}>
                  📅 {season.year}
                </div>
              )}

              <div style={{ marginTop: '12px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {season.quality && (
                  <span
                    style={{
                      background: 'rgba(108, 92, 231, 0.3)',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                    }}
                  >
                    {season.quality}
                  </span>
                )}
                {season.lang && (
                  <span
                    style={{
                      background: 'rgba(0, 184, 148, 0.3)',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                    }}
                  >
                    {season.lang}
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

/**
 * Reverse detect - Tìm xem có phim nào có tên tương tự + số không
 * VD: "The Legend Of Hei" -> Tìm "The Legend Of Hei 2", "The Legend Of Hei 3"
 * Nếu tìm thấy -> Coi phim hiện tại là phần 1
 */
async function reverseDetectSeries(movie: Movie): Promise<SeriesInfo | null> {
  try {
    // Search với tên phim + "2" hoặc "II"
    const searchTerms = [
      `${movie.name} 2`,
      `${movie.origin_name} 2`,
      `${movie.name} II`,
      `${movie.origin_name} II`,
    ].filter(term => term && !term.startsWith('undefined'));

    for (const searchTerm of searchTerms) {
      const response = await movieApi.searchMovies({
        keyword: searchTerm,
        limit: 5,
      });

      const items = response.data?.items || [];
      
      // Check xem có phim nào match pattern không
      for (const item of items) {
        const itemSeriesInfo = detectSeries(item) || detectSeriesFromOrigin(item);
        if (itemSeriesInfo && itemSeriesInfo.season >= 2) {
          // Tìm thấy phần 2+, verify xem base name có match không
          const movieNameLower = movie.name.toLowerCase().trim();
          const movieOriginLower = movie.origin_name?.toLowerCase().trim() || '';
          const seriesNameLower = itemSeriesInfo.seriesName.toLowerCase().trim();
          
          if (movieNameLower === seriesNameLower || movieOriginLower === seriesNameLower) {
            console.log('🔍 Reverse detected: This is Part 1 of', itemSeriesInfo.seriesName);
            return {
              seriesName: itemSeriesInfo.seriesName,
              season: 1,
            };
          }
        }
      }
    }
  } catch (error) {
    console.warn('⚠️ Reverse detect failed:', error);
  }
  
  return null;
}

/**
 * Detect series info từ origin_name (English name)
 */
function detectSeriesFromOrigin(movie: Movie): SeriesInfo | null {
  if (!movie.origin_name) return null;
  return detectSeriesFromName(movie.origin_name);
}

/**
 * Detect series info từ tên phim (Vietnamese name)
 */
function detectSeries(movie: Movie): SeriesInfo | null {
  return detectSeriesFromName(movie.name);
}

/**
 * Core detection logic cho series patterns
 * Patterns: 
 * - "Tên Phim (Phần 1)", "Movie Name (Season 2)"
 * - "Movie Name 2", "Movie Name 3" (số ở cuối)
 * - "Movie Name II", "Movie Name III" (Roman numerals)
 */
function detectSeriesFromName(name: string): SeriesInfo | null {

  // Pattern 1: (Phần X) hoặc (phần X)
  const vietnameseMatch = name.match(/^(.+?)\s*\(Phần\s+(\d+)\)/i);
  if (vietnameseMatch) {
    return {
      seriesName: vietnameseMatch[1].trim(),
      season: parseInt(vietnameseMatch[2]),
    };
  }

  // Pattern 2: (Season X) hoặc (season X)
  const englishMatch = name.match(/^(.+?)\s*\(Season\s+(\d+)\)/i);
  if (englishMatch) {
    return {
      seriesName: englishMatch[1].trim(),
      season: parseInt(englishMatch[2]),
    };
  }

  // Pattern 3: Season X (không có ngoặc)
  const seasonMatch = name.match(/^(.+?)\s+Season\s+(\d+)/i);
  if (seasonMatch) {
    return {
      seriesName: seasonMatch[1].trim(),
      season: parseInt(seasonMatch[2]),
    };
  }

  // Pattern 4: Số ở cuối (VD: "The Legend Of Hei 2", "John Wick 3")
  // Chỉ match nếu số từ 2-9 để tránh false positive (không match năm như "Movie 2024")
  const numberSuffixMatch = name.match(/^(.+?)\s+([2-9])$/i);
  if (numberSuffixMatch) {
    const baseName = numberSuffixMatch[1].trim();
    const number = parseInt(numberSuffixMatch[2]);
    
    // Filter: Tên phải >= 3 từ để tránh match "Movie 2"
    const wordCount = baseName.split(/\s+/).length;
    if (wordCount >= 2) {
      return {
        seriesName: baseName,
        season: number,
      };
    }
  }

  // Pattern 5: Roman numerals (II, III, IV, V)
  const romanMatch = name.match(/^(.+?)\s+(II|III|IV|V|VI|VII|VIII|IX|X)$/i);
  if (romanMatch) {
    const baseName = romanMatch[1].trim();
    const roman = romanMatch[2].toUpperCase();
    const romanToNumber: { [key: string]: number } = {
      'II': 2, 'III': 3, 'IV': 4, 'V': 5,
      'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10
    };
    
    return {
      seriesName: baseName,
      season: romanToNumber[roman] || 2,
    };
  }

  // Pattern 6: "Part X" hoặc "Phần X" (không có ngoặc)
  const partMatch = name.match(/^(.+?)\s+(?:Part|Phần)\s+(\d+)$/i);
  if (partMatch) {
    return {
      seriesName: partMatch[1].trim(),
      season: parseInt(partMatch[2]),
    };
  }

  return null;
}

export default SeriesNavigator;
