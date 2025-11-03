/**
 * Firebase Context
 * 
 * React Context để quản lý Firebase services
 * Cung cấp hooks để access Firebase functionality
 * 
 * Features:
 * - Authentication với cross-browser persistence
 * - Saved movies management
 * - Watch progress tracking
 * - Comments system
 * - Notifications system
 * - Sync across devices
 */

import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { initializeApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  deleteDoc,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC9GgPO41b0hmVVn5D-5LdGGSLnBsQWlPc",
  authDomain: "phim-comments.firebaseapp.com",
  projectId: "phim-comments",
  storageBucket: "phim-comments.firebasestorage.app",
  messagingSenderId: "338411994257",
  appId: "1:338411994257:web:870b6a7cd166a50bc75330"
};

// Types
interface Movie {
  slug: string;
  name: string;
  poster_url?: string;
  thumb_url?: string;
  year?: number;
  quality?: string;
  episode_current?: string;
  lang?: string;
}

interface SavedMovie extends Movie {
  savedAt: number;
  userId: string;
  userName: string;
}

interface Comment {
  id: string;
  movieSlug: string;
  content: string;
  authorId: string;
  authorName: string;
  timestamp: Date;
  likes: number;
  likedBy: string[];
  status: 'approved' | 'pending';
}

interface FirebaseContextType {
  db: Firestore | null;
  app: FirebaseApp | null;
  userId: string | null;
  userName: string;
  isInitialized: boolean;
  
  // User methods
  getUserId: () => Promise<string>;
  setUserName: (name: string) => void;
  generateSyncCode: () => Promise<string>;
  useSyncCode: (code: string) => Promise<{ userId: string; userName: string }>;
  
  // Movie methods
  saveMovie: (movie: Movie) => Promise<boolean>;
  removeSavedMovie: (slug: string) => Promise<boolean>;
  getSavedMovies: () => Promise<SavedMovie[]>;
  isMovieSaved: (slug: string) => Promise<boolean>;
  
  // Comment methods
  addComment: (movieSlug: string, content: string) => Promise<string>;
  getComments: (movieSlug: string) => Promise<Comment[]>;
  toggleLike: (commentId: string) => Promise<boolean>;
  
  // Watch progress
  setWatchProgress: (movieSlug: string, episodeInfo: any) => Promise<void>;
  getWatchProgress: (movieSlug: string) => Promise<any>;
}

const FirebaseContext = createContext<FirebaseContextType | null>(null);

// Provider component
export const FirebaseProvider = ({ children }: { children: ReactNode }) => {
  const [app, setApp] = useState<FirebaseApp | null>(null);
  const [db, setDb] = useState<Firestore | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserNameState] = useState<string>('Khách');
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize Firebase
  useEffect(() => {
    const initFirebase = async () => {
      try {
        console.log('🔥 Initializing Firebase...');
        
        // Initialize app
        const firebaseApp = initializeApp(firebaseConfig);
        setApp(firebaseApp);
        
        // Initialize Firestore
        const firestore = getFirestore(firebaseApp);
        setDb(firestore);
        
        // Get or create user ID
        const id = await getUserIdFromStorage();
        setUserId(id);
        
        // Get user name
        const name = localStorage.getItem('movie_commenter_name') || 'Khách';
        setUserNameState(name);
        
        setIsInitialized(true);
        console.log('✅ Firebase initialized successfully');
      } catch (error) {
        console.error('❌ Firebase initialization failed:', error);
      }
    };

    initFirebase();
  }, []);

  // Get user ID với cross-browser persistence
  const getUserIdFromStorage = async (): Promise<string> => {
    // Try localStorage first
    let id = localStorage.getItem('movie_commenter_id');
    if (id) return id;

    // Try sessionStorage
    id = sessionStorage.getItem('movie_commenter_id');
    if (id) {
      localStorage.setItem('movie_commenter_id', id);
      return id;
    }

    // Generate new ID với browser fingerprint
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    const fingerprint = getBrowserFingerprint();
    const newId = `user_${fingerprint}_${random}_${timestamp}`;
    
    // Save to all storage methods
    localStorage.setItem('movie_commenter_id', newId);
    sessionStorage.setItem('movie_commenter_id', newId);
    
    console.log('🆔 Generated new user ID:', newId);
    return newId;
  };

  const getBrowserFingerprint = (): string => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Browser fingerprint', 2, 2);
    }

    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      `${screen.width}x${screen.height}`,
      new Date().getTimezoneOffset(),
      canvas.toDataURL(),
    ].join('|');

    // Create hash
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }

    return Math.abs(hash).toString(36).substring(0, 8);
  };

  // User methods
  const getUserId = async (): Promise<string> => {
    if (userId) return userId;
    const id = await getUserIdFromStorage();
    setUserId(id);
    return id;
  };

  const setUserName = (name: string) => {
    const sanitized = name.trim().substring(0, 30).replace(/[<>]/g, '');
    localStorage.setItem('movie_commenter_name', sanitized);
    sessionStorage.setItem('movie_commenter_name', sanitized);
    setUserNameState(sanitized);
  };

  const generateSyncCode = async (): Promise<string> => {
    if (!db) throw new Error('Firebase not initialized');
    
    const id = await getUserId();
    const syncCode = Math.random().toString().substring(2, 8);

    await setDoc(doc(db, 'syncCodes', syncCode), {
      userId: id,
      userName: userName,
      createdAt: serverTimestamp(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    console.log('🔑 Sync code generated:', syncCode);
    return syncCode;
  };

  const useSyncCode = async (syncCode: string): Promise<{ userId: string; userName: string }> => {
    if (!db) throw new Error('Firebase not initialized');

    const docRef = doc(db, 'syncCodes', syncCode);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('Mã sync không tồn tại hoặc đã hết hạn');
    }

    const data = docSnap.data();
    const now = new Date();
    const expiresAt = data.expiresAt.toDate();

    if (now > expiresAt) {
      throw new Error('Mã sync đã hết hạn');
    }

    // Apply synced data
    localStorage.setItem('movie_commenter_id', data.userId);
    localStorage.setItem('movie_commenter_name', data.userName);
    sessionStorage.setItem('movie_commenter_id', data.userId);
    sessionStorage.setItem('movie_commenter_name', data.userName);

    setUserId(data.userId);
    setUserNameState(data.userName);

    // Delete sync code
    await deleteDoc(docRef);

    console.log('✅ Synced with user:', data.userName);
    return { userId: data.userId, userName: data.userName };
  };

  // Movie methods
  const saveMovie = async (movie: Movie): Promise<boolean> => {
    if (!db) throw new Error('Firebase not initialized');

    const id = await getUserId();
    
    // Check if already saved
    const q = query(
      collection(db, 'savedMovies'),
      where('userId', '==', id),
      where('slug', '==', movie.slug),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      console.log('Movie already saved');
      return false;
    }

    // Save movie
    await addDoc(collection(db, 'savedMovies'), {
      ...movie,
      poster_url: movie.poster_url || movie.thumb_url,
      userId: id,
      userName: userName,
      savedAt: serverTimestamp(),
    });

    console.log('✅ Movie saved:', movie.name);
    return true;
  };

  const removeSavedMovie = async (slug: string): Promise<boolean> => {
    if (!db) throw new Error('Firebase not initialized');

    const id = await getUserId();
    const q = query(
      collection(db, 'savedMovies'),
      where('userId', '==', id),
      where('slug', '==', slug)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return false;
    }

    // Delete all matching documents
    const deletePromises = snapshot.docs.map(document => 
      deleteDoc(doc(db, 'savedMovies', document.id))
    );
    await Promise.all(deletePromises);

    console.log('✅ Movie removed:', slug);
    return true;
  };

  const getSavedMovies = async (): Promise<SavedMovie[]> => {
    if (!db) throw new Error('Firebase not initialized');

    const id = await getUserId();
    const q = query(
      collection(db, 'savedMovies'),
      where('userId', '==', id),
      orderBy('savedAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const movies: SavedMovie[] = [];

    snapshot.forEach((document) => {
      const data = document.data();
      movies.push({
        slug: data.slug,
        name: data.name,
        poster_url: data.poster_url,
        thumb_url: data.thumb_url,
        year: data.year,
        quality: data.quality,
        episode_current: data.episode_current,
        lang: data.lang,
        savedAt: data.savedAt?.toMillis() || Date.now(),
        userId: data.userId,
        userName: data.userName,
      });
    });

    console.log(`📚 Loaded ${movies.length} saved movies`);
    return movies;
  };

  const isMovieSaved = async (slug: string): Promise<boolean> => {
    if (!db) throw new Error('Firebase not initialized');

    const id = await getUserId();
    const q = query(
      collection(db, 'savedMovies'),
      where('userId', '==', id),
      where('slug', '==', slug),
      limit(1)
    );

    const snapshot = await getDocs(q);
    return !snapshot.empty;
  };

  // Comment methods
  const addComment = async (movieSlug: string, content: string): Promise<string> => {
    if (!db) throw new Error('Firebase not initialized');
    if (!content || content.trim().length < 3) {
      throw new Error('Vui lòng nhập nội dung bình luận (tối thiểu 3 ký tự)');
    }

    const id = await getUserId();
    
    const docRef = await addDoc(collection(db, 'movieComments'), {
      movieSlug,
      content: content.trim().substring(0, 500),
      authorId: id,
      authorName: userName,
      timestamp: serverTimestamp(),
      likes: 0,
      likedBy: [],
      status: 'approved',
      reports: 0,
    });

    console.log('✅ Comment added');
    return docRef.id;
  };

  const getComments = async (movieSlug: string): Promise<Comment[]> => {
    if (!db) throw new Error('Firebase not initialized');

    const q = query(
      collection(db, 'movieComments'),
      where('movieSlug', '==', movieSlug),
      where('status', '==', 'approved'),
      orderBy('timestamp', 'desc'),
      limit(30)
    );

    const snapshot = await getDocs(q);
    const comments: Comment[] = [];

    snapshot.forEach((document) => {
      const data = document.data();
      comments.push({
        id: document.id,
        movieSlug: data.movieSlug,
        content: data.content,
        authorId: data.authorId,
        authorName: data.authorName,
        timestamp: data.timestamp?.toDate() || new Date(),
        likes: data.likes || 0,
        likedBy: data.likedBy || [],
        status: data.status,
      });
    });

    return comments;
  };

  const toggleLike = async (commentId: string): Promise<boolean> => {
    if (!db) throw new Error('Firebase not initialized');

    const id = await getUserId();
    const commentRef = doc(db, 'movieComments', commentId);
    const commentSnap = await getDoc(commentRef);

    if (!commentSnap.exists()) {
      return false;
    }

    const data = commentSnap.data();
    const likedBy = data.likedBy || [];
    const hasLiked = likedBy.includes(id);

    if (hasLiked) {
      await setDoc(commentRef, {
        ...data,
        likes: Math.max(0, (data.likes || 0) - 1),
        likedBy: likedBy.filter((uid: string) => uid !== id),
      }, { merge: true });
    } else {
      await setDoc(commentRef, {
        ...data,
        likes: (data.likes || 0) + 1,
        likedBy: [...likedBy, id],
      }, { merge: true });
    }

    return true;
  };

  // Watch progress methods
  const setWatchProgress = async (movieSlug: string, episodeInfo: any): Promise<void> => {
    if (!db) throw new Error('Firebase not initialized');

    const id = await getUserId();
    const docId = `${id}_${movieSlug}`;

    await setDoc(doc(db, 'watchProgress', docId), {
      movieSlug,
      userId: id,
      ...episodeInfo,
      updatedAt: serverTimestamp(),
    }, { merge: true });

    console.log('✅ Watch progress saved');
  };

  const getWatchProgress = async (movieSlug: string): Promise<any> => {
    if (!db) throw new Error('Firebase not initialized');

    const id = await getUserId();
    const docId = `${id}_${movieSlug}`;
    const docRef = doc(db, 'watchProgress', docId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
      ...data,
      updatedAt: data.updatedAt?.toMillis() || Date.now(),
    };
  };

  const value: FirebaseContextType = {
    db,
    app,
    userId,
    userName,
    isInitialized,
    getUserId,
    setUserName,
    generateSyncCode,
    useSyncCode,
    saveMovie,
    removeSavedMovie,
    getSavedMovies,
    isMovieSaved,
    addComment,
    getComments,
    toggleLike,
    setWatchProgress,
    getWatchProgress,
  };

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
};

// Custom hook
export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within FirebaseProvider');
  }
  return context;
};

export default FirebaseContext;

