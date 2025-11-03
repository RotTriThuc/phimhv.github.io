# 🎬 PhimHV - React 3D Anime Streaming Platform

> **Website xem anime online với hiệu ứng 3D đẹp mắt được xây dựng bằng React, Three.js, và Framer Motion**

![React](https://img.shields.io/badge/React-18.3-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-7.1-purple?logo=vite)
![Three.js](https://img.shields.io/badge/Three.js-Latest-black?logo=three.js)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-11.x-pink)

---

## ✨ Features Chính

### 🎨 **3D Animations & Effects**
- **3D Particle System** cho hero banner (Three.js)
- **3D Movie Cards** với parallax và hover effects
- **Smooth Page Transitions** (Framer Motion)
- **Cinematic Banner Slider** với auto-play
- **GPU-Accelerated Animations** cho performance tốt nhất

### 🔥 **Core Features**
- ✅ Xem anime/phim online miễn phí
- ✅ Tìm kiếm phim thông minh
- ✅ Lưu phim yêu thích (Firebase)
- ✅ Theo dõi tiến độ xem
- ✅ Hệ thống bình luận real-time
- ✅ Đồng bộ cross-device với sync code
- ✅ Responsive design (mobile-first)
- ✅ Dark/Light theme
- ✅ Performance optimization

### 🛠️ **Tech Stack**

**Frontend Framework:**
- React 18.3 + TypeScript
- Vite (Build tool)
- React Router DOM (Routing)

**Animation Libraries:**
- Framer Motion (2D/3D animations)
- React Spring (Physics-based animations)
- Three.js + React Three Fiber (3D graphics)
- React Three Drei (Three.js helpers)

**Backend & Database:**
- Firebase Firestore (Database)
- Firebase Auth (Authentication)
- Movie API: PhimAPI.com

**UI/UX:**
- CSS3 với Custom Properties
- CSS Grid & Flexbox
- Modern glassmorphism design
- Smooth scrolling & animations

---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/phimhv.github.io.git
cd phimhv.github.io/react-app

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 📁 Project Structure

```
react-app/
├── src/
│   ├── components/          # Reusable components
│   │   ├── Banner3D.tsx     # 3D hero banner với Three.js
│   │   ├── MovieCard3D.tsx  # 3D movie card với parallax
│   │   ├── Header.tsx       # Sticky header với search
│   │   └── *.css            # Component styles
│   │
│   ├── pages/               # Page components
│   │   ├── HomePage.tsx     # Trang chủ
│   │   ├── SearchPage.tsx   # Tìm kiếm
│   │   ├── SavedMoviesPage.tsx
│   │   ├── MovieDetailPage.tsx
│   │   └── WatchPage.tsx
│   │
│   ├── contexts/            # React Contexts
│   │   └── FirebaseContext.tsx  # Firebase integration
│   │
│   ├── App.tsx              # Main app component
│   ├── App.css              # Global styles
│   └── main.tsx             # Entry point
│
├── public/                  # Static assets
├── dist/                    # Production build
├── .github/workflows/       # GitHub Actions
│   └── deploy.yml           # Auto-deploy to GitHub Pages
│
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript config
└── package.json
```

---

## 🎯 Key Components Explained

### 1. **Banner3D Component**
Hero banner với 3D particle effects:
- Three.js particle system (2000 particles)
- Auto-rotating camera
- Cinematic transitions giữa slides
- Responsive controls

```tsx
<Banner3D 
  movies={topMovies} 
  autoPlayInterval={5000}
/>
```

### 2. **MovieCard3D Component**
Movie cards với advanced 3D effects:
- Mouse tracking parallax
- 3D rotation với spring physics
- Smooth hover animations
- Optimized performance

```tsx
<MovieCard3D
  movie={movie}
  onSave={() => handleSave(movie)}
  onWatch={() => handleWatch(movie)}
/>
```

### 3. **FirebaseContext**
Centralized Firebase management:
- User authentication
- Saved movies (cross-device)
- Watch progress tracking
- Comments system
- Device sync với sync codes

```tsx
const { saveMovie, getSavedMovies, userId } = useFirebase();
```

---

## 🎨 Animation Examples

### Framer Motion - Page Transitions
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ duration: 0.3 }}
>
  {children}
</motion.div>
```

### Three.js - Particle System
```tsx
<Canvas>
  <Points positions={particles}>
    <PointMaterial
      color="#6c5ce7"
      size={0.15}
      transparent
      opacity={0.6}
    />
  </Points>
</Canvas>
```

### 3D Card Rotation
```tsx
const rotateX = useTransform(mouseY, [-0.5, 0.5], ['15deg', '-15deg']);
const rotateY = useTransform(mouseX, [-0.5, 0.5], ['-15deg', '15deg']);

<motion.div style={{ rotateX, rotateY }} />
```

---

## 🔧 Configuration

### Firebase Setup
1. Tạo Firebase project tại [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Firestore Database
3. Copy Firebase config vào `src/contexts/FirebaseContext.tsx`

```typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### GitHub Pages Deployment
1. Update `base` trong `vite.config.ts`:
```typescript
export default defineConfig({
  base: '/your-repo-name/',
  // ...
})
```

2. Enable GitHub Pages trong repository settings
3. Push to main branch - Auto-deploy với GitHub Actions

---

## 📊 Performance Optimizations

### Code Splitting
```typescript
manualChunks: {
  'react-vendor': ['react', 'react-dom'],
  'animation-vendor': ['framer-motion'],
  'three-vendor': ['three', '@react-three/fiber'],
}
```

### Lazy Loading
- Images: `loading="lazy"`
- Components: Dynamic imports
- Routes: React.lazy()

### GPU Acceleration
```css
.gpu-accelerated {
  transform: translateZ(0);
  will-change: transform;
  backface-visibility: hidden;
}
```

---

## 🐛 Troubleshooting

### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf .vite
npm run build
```

### Three.js Performance Issues
- Reduce particle count
- Enable `frustumCulled`
- Use `PointMaterial` instead of custom shaders
- Disable shadows if not needed

---

## 📝 Scripts

```bash
npm run dev          # Start dev server (port 5173)
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

---

## 🎯 Roadmap

- [ ] Server-side rendering (SSR)
- [ ] Progressive Web App (PWA)
- [ ] Video player với HLS.js
- [ ] Advanced 3D effects (GLSL shaders)
- [ ] Real-time notifications
- [ ] User profiles & avatars
- [ ] Watch parties feature
- [ ] Mobile app (React Native)

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 👨‍💻 Author

**Hoài Vũ**
- Facebook: [@hoai.vu.492770](https://www.facebook.com/hoai.vu.492770/)
- Website: [phimhv.site](https://phimhv.site)

---

## 🙏 Acknowledgments

- [PhimAPI](https://phimapi.com) - Movie database API
- [Framer Motion](https://www.framer.com/motion/) - Animation library
- [Three.js](https://threejs.org/) - 3D graphics
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/) - React renderer for Three.js
- [Firebase](https://firebase.google.com/) - Backend services

---

## 📸 Screenshots

### Homepage với 3D Banner
![Homepage](./screenshots/homepage.png)

### 3D Movie Cards
![Movie Cards](./screenshots/movie-cards.png)

### Mobile Responsive
![Mobile](./screenshots/mobile.png)

---

⭐ **If you like this project, please give it a star!** ⭐

Made with ❤️ and lots of ☕ by Hoài Vũ
