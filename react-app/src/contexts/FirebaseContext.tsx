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
import { getAuth, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import type { Auth, User } from 'firebase/auth';

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
  auth: Auth | null;
  currentUser: User | null;
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
  const [auth, setAuth] = useState<Auth | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
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
        
        // Initialize Firebase Auth
        const firebaseAuth = getAuth(firebaseApp);
        setAuth(firebaseAuth);
        
        // Setup auth state listener
        const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
          console.log('🔄 Auth state changed:', user ? user.email || user.uid : 'No user');
          
          // Store previous user info for migration
          const previousUser = firebaseAuth.currentUser;
          
          setCurrentUser(user);
          
          if (user) {
            // Check if this is anonymous → email/google upgrade
            const isUpgrade = previousUser?.isAnonymous && !user.isAnonymous;
            
            if (isUpgrade && previousUser) {
              // Save anonymous UID before migration
              sessionStorage.setItem('anonymous_uid_before_signin', previousUser.uid);
              console.log('🔑 Detected account upgrade: Anonymous → Email/Google');
            }
            
            // User is signed in - use Firebase Auth UID
            setUserId(user.uid);
            
            // Get display name
            const displayName = user.displayName || user.email || 'Người dùng';
            setUserNameState(displayName);
            
            console.log('✅ User authenticated:', user.uid, user.isAnonymous ? '(Anonymous)' : '(Email/Google)');
            
            // Migrate old localStorage data or anonymous data if exists
            await migrateOldUserData(user.uid, firestore);
          } else {
            // No user signed in - sign in anonymously để có auth token
            console.log('📝 No user, signing in anonymously...');
            try {
              const result = await signInAnonymously(firebaseAuth);
              console.log('✅ Anonymous sign in successful:', result.user.uid);
            } catch (error) {
              console.error('❌ Anonymous sign in failed:', error);
            }
          }
        });
        
        setIsInitialized(true);
        console.log('✅ Firebase initialized successfully');
        
        // Cleanup
        return () => unsubscribe();
      } catch (error) {
        console.error('❌ Firebase initialization failed:', error);
      }
    };

    initFirebase();
  }, []);

  // Migrate data from localStorage OR anonymous user to authenticated user
  const migrateOldUserData = async (newUserId: string, firestore: Firestore) => {
    try {
      // 1. Check for localStorage migration (legacy support)
      const oldLocalStorageId = localStorage.getItem('movie_commenter_id');
      
      if (oldLocalStorageId && oldLocalStorageId !== newUserId) {
        console.log('🔄 [Migration] localStorage → Firebase Auth UID');
        await migrateUserData(oldLocalStorageId, newUserId, firestore, 'localStorage');
        localStorage.removeItem('movie_commenter_id');
        sessionStorage.removeItem('movie_commenter_id');
      }
      
      // 2. Check for anonymous → email/google migration
      const previousAnonymousId = sessionStorage.getItem('anonymous_uid_before_signin');
      
      if (previousAnonymousId && previousAnonymousId !== newUserId) {
        console.log('🔄 [Migration] Anonymous → Email/Google');
        await migrateUserData(previousAnonymousId, newUserId, firestore, 'anonymous');
        sessionStorage.removeItem('anonymous_uid_before_signin');
      }
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
    }
  };
  
  // Helper: Migrate user data from old UID to new UID
  const migrateUserData = async (
    oldUserId: string, 
    newUserId: string, 
    firestore: Firestore,
    migrationType: 'localStorage' | 'anonymous'
  ) => {
    console.log(`Old ID: ${oldUserId}`);
    console.log(`New ID: ${newUserId}`);
    
    let totalMigrated = 0;
    
    // Migrate saved movies
    const savedMoviesQuery = query(
      collection(firestore, 'savedMovies'),
      where('userId', '==', oldUserId)
    );
    
    const moviesSnapshot = await getDocs(savedMoviesQuery);
    console.log(`🎬 Found ${moviesSnapshot.size} movies to migrate`);
    
    for (const document of moviesSnapshot.docs) {
      const data = document.data();
      const newDocId = `${newUserId}_${data.slug}`;
      
      // Check if movie already exists for new user (avoid duplicates)
      const existingDoc = await getDoc(doc(firestore, 'savedMovies', newDocId));
      
      if (!existingDoc.exists()) {
        await setDoc(doc(firestore, 'savedMovies', newDocId), {
          ...data,
          userId: newUserId,
          migratedAt: serverTimestamp(),
          migrationType: migrationType,
          oldUserId: oldUserId
        });
        totalMigrated++;
      }
      
      // Delete old document
      await deleteDoc(doc(firestore, 'savedMovies', document.id));
    }
    
    // Migrate watch progress
    const watchProgressQuery = query(
      collection(firestore, 'watchProgress'),
      where('userId', '==', oldUserId)
    );
    
    const progressSnapshot = await getDocs(watchProgressQuery);
    console.log(`📺 Found ${progressSnapshot.size} watch progress to migrate`);
    
    for (const document of progressSnapshot.docs) {
      const data = document.data();
      const newDocId = `${newUserId}_${data.movieSlug}`;
      
      // Check if progress already exists
      const existingDoc = await getDoc(doc(firestore, 'watchProgress', newDocId));
      
      if (!existingDoc.exists()) {
        await setDoc(doc(firestore, 'watchProgress', newDocId), {
          ...data,
          userId: newUserId,
          migratedAt: serverTimestamp(),
          migrationType: migrationType,
          oldUserId: oldUserId
        });
      } else {
        // Keep the most recent progress
        const existingData = existingDoc.data();
        const oldUpdatedAt = data.updatedAt?.toMillis?.() || 0;
        const existingUpdatedAt = existingData.updatedAt?.toMillis?.() || 0;
        
        if (oldUpdatedAt > existingUpdatedAt) {
          await setDoc(doc(firestore, 'watchProgress', newDocId), {
            ...data,
            userId: newUserId,
            migratedAt: serverTimestamp(),
            migrationType: migrationType,
            oldUserId: oldUserId
          });
        }
      }
      
      // Delete old document
      await deleteDoc(doc(firestore, 'watchProgress', document.id));
    }
    
    if (totalMigrated > 0 || progressSnapshot.size > 0) {
      console.log(`✅ Migration complete:`);
      console.log(`   - ${totalMigrated} movies migrated`);
      console.log(`   - ${progressSnapshot.size} watch progress migrated`);
    } else {
      console.log('ℹ️ No data to migrate');
    }
  };

  // User methods
  const getUserId = async (): Promise<string> => {
    // Always use Firebase Auth UID
    if (currentUser) {
      return currentUser.uid;
    }
    
    // Wait for auth to initialize
    if (!auth) {
      throw new Error('Firebase Auth not initialized');
    }
    
    // If no user, this shouldn't happen (auto sign in anonymously)
    throw new Error('No authenticated user');
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
    auth,
    currentUser,
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

