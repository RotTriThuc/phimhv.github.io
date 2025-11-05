/**
 * Main App Component
 * 
 * Root component với React Router và animated page transitions
 * Sử dụng Framer Motion để tạo smooth transitions giữa các pages
 * 
 * Features:
 * - Animated route transitions
 * - Responsive layout
 * - Firebase integration
 * - Global state management
 * - Performance optimization
 */

import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { FirebaseProvider } from './contexts/FirebaseContext';
import { NotificationProvider } from './components/NotificationToast';
import { AnimatePresence } from 'framer-motion';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import MovieDetailPage from './pages/MovieDetailPage';
import SavedMoviesPage from './pages/SavedMoviesPage';
import WatchPage from './pages/WatchPage';
import CategoryPage from './pages/CategoryPage';
import CountryPage from './pages/CountryPage';
import FilterPage from './pages/FilterPage';
import TypePage from './pages/TypePage';
import AnimeListPage from './pages/AnimeListPage';
import './App.css';

// Animated routes wrapper
function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/filter" element={<FilterPage />} />
        <Route path="/movie/:slug" element={<MovieDetailPage />} />
        <Route path="/saved" element={<SavedMoviesPage />} />
        <Route path="/watch/:slug" element={<WatchPage />} />
        <Route path="/category/:slug" element={<CategoryPage />} />
        <Route path="/country/:slug" element={<CountryPage />} />
        <Route path="/danh-sach/hoat-hinh" element={<AnimeListPage />} />
        <Route path="/danh-sach/:type" element={<TypePage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <NotificationProvider>
      <FirebaseProvider>
        <BrowserRouter>
          <div className="app">
            <Header />
            <main className="app-main">
              <AnimatedRoutes />
            </main>
            <footer className="app-footer">
              <div className="container">
                <p>
                  Made with ❤️ by{' '}
                  <a 
                    href="https://www.facebook.com/hoai.vu.492770/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    Hoài Vũ
                  </a>
                  {' '}| Powered by React + Three.js + Framer Motion
                </p>
              </div>
            </footer>
          </div>
        </BrowserRouter>
      </FirebaseProvider>
    </NotificationProvider>
  );
}

export default App;
