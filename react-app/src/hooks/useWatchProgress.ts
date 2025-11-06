/**
 * Custom Hook: useWatchProgress
 * 
 * Hook để quản lý watch progress của phim
 * Tích hợp với Firebase Context để lưu/lấy tiến trình xem
 * 
 * Features:
 * - Get watch progress của 1 phim
 * - Get danh sách tất cả phim đang xem
 * - Check xem phim có progress không
 * - Auto-refresh khi có thay đổi
 * 
 * Usage:
 * ```tsx
 * const { progress, loading } = useWatchProgress('phim-slug');
 * 
 * if (progress) {
 *   console.log('Đang xem:', progress.episodeName);
 * }
 * ```
 */

import { useState, useEffect } from 'react';
import { useFirebase } from '../contexts/FirebaseContext';

// Types
export interface WatchProgress {
  movieSlug: string;
  movieName?: string;
  episodeName: string;
  episodeSlug: string;
  serverIndex: number;
  timestamp: number;
  updatedAt: number;
  // Optional movie metadata for display
  posterUrl?: string;
  thumbUrl?: string;
  year?: number;
  quality?: string;
}

export interface WatchProgressWithMovie extends WatchProgress {
  movieName: string;
  posterUrl: string;
}

/**
 * Hook để lấy watch progress của 1 phim cụ thể
 */
export const useWatchProgress = (movieSlug?: string) => {
  const { getWatchProgress, isInitialized } = useFirebase();
  const [progress, setProgress] = useState<WatchProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProgress = async () => {
      if (!movieSlug || !isInitialized) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await getWatchProgress(movieSlug);
        setProgress(data);
      } catch (err) {
        console.error('Failed to fetch watch progress:', err);
        setError('Không thể tải tiến trình xem');
        setProgress(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [movieSlug, getWatchProgress, isInitialized]);

  return {
    progress,
    loading,
    error,
    hasProgress: !!progress,
  };
};

/**
 * Hook để lấy danh sách tất cả phim đang xem
 * Dùng cho ContinueWatching section
 */
export const useWatchProgressList = () => {
  const { db, userId, isInitialized } = useFirebase();
  const [progressList, setProgressList] = useState<WatchProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProgressList = async () => {
      if (!db || !userId || !isInitialized) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Import Firestore functions dynamically to avoid circular deps
        const { collection, query, where, orderBy, getDocs, limit } = await import('firebase/firestore');

        // Query watch progress for current user, sorted by most recent
        const q = query(
          collection(db, 'watchProgress'),
          where('userId', '==', userId),
          orderBy('updatedAt', 'desc'),
          limit(20) // Giới hạn 20 phim gần nhất
        );

        const snapshot = await getDocs(q);
        const progress: WatchProgress[] = [];

        snapshot.forEach((doc) => {
          const data = doc.data();
          progress.push({
            movieSlug: data.movieSlug,
            movieName: data.movieName,
            episodeName: data.episodeName,
            episodeSlug: data.episodeSlug,
            serverIndex: data.serverIndex || 0,
            timestamp: data.timestamp || Date.now(),
            updatedAt: data.updatedAt?.toMillis() || Date.now(),
            posterUrl: data.posterUrl,
            thumbUrl: data.thumbUrl,
            year: data.year,
            quality: data.quality,
          });
        });

        setProgressList(progress);
        console.log(`✅ Loaded ${progress.length} watch progress items`);
      } catch (err) {
        console.error('Failed to fetch watch progress list:', err);
        setError('Không thể tải danh sách phim đang xem');
        setProgressList([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProgressList();
  }, [db, userId, isInitialized]);

  return {
    progressList,
    loading,
    error,
    hasProgress: progressList.length > 0,
  };
};

/**
 * Helper: Check if a movie has watch progress
 * Lightweight version - chỉ check có/không, không load full data
 */
export const useHasWatchProgress = (movieSlug?: string) => {
  const { progress, loading } = useWatchProgress(movieSlug);
  
  return {
    hasProgress: !!progress,
    loading,
  };
};

export default useWatchProgress;
