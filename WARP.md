# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

PhimHV is a dual-architecture web application for streaming anime and movies:
1. **Legacy SPA**: Vanilla JavaScript modular architecture (`app-modular.js`, `modules/`, `index.html`)
2. **Modern React App**: TypeScript + Vite application (`react-app/`)

The project integrates with a movie API ("Serect API") with 23,969+ movies and uses Firebase for comments, user data, and cross-device sync.

## Common Commands

### React App (Primary Development)
```powershell
# Start development server (from root)
.\run_localhost.bat

# Or manually (from react-app/)
cd react-app
npm install
npm run dev        # Start Vite dev server on http://localhost:5173
npm run build      # TypeScript compile + production build
npm run lint       # ESLint
npm run preview    # Preview production build
```

### Legacy SPA (Webpack-based)
```powershell
# Development
npm run dev        # Webpack dev server

# Production
npm run build      # Webpack production build
npm run preview    # Build and serve

# Quality & Testing
npm run test              # Run all Jest tests
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests only
npm run test:e2e          # Playwright E2E tests
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report

# Code Quality
npm run lint              # ESLint
npm run format            # Prettier
npm run type-check        # TypeScript checking (tsc --noEmit)
npm run typescript-coverage  # TypeScript coverage report

# Performance & Analysis
npm run analyze           # Webpack bundle analyzer
npm run size-limit        # Check bundle size limits
npm run lighthouse        # Lighthouse audit

# Security
npm run audit             # npm audit
npm run security          # Snyk test

# Deployment
npm run deploy:staging    # Deploy to Vercel staging
npm run deploy:prod       # Deploy to Vercel production

# Docker
npm run docker:build      # Build Docker image
npm run docker:run        # Run Docker container
```

### Auto-Update Scripts
```powershell
# Auto-update movie catalog (from scripts/)
.\auto-update.bat         # Windows batch script
node auto-update.js       # Direct Node.js execution

# Sync catalog
.\sync-catalog.bat
node sync-catalog.js

# Download movies
.\download-movies.bat
node download-movies.js
```

### GitHub Deployment
```powershell
# Push to GitHub Pages
.\PUSH.bat
.\push-to-github.ps1

# Production deployment
.\deploy-production.ps1   # PowerShell
.\deploy-production.sh    # Bash
```

## Architecture

### Dual-Architecture System

**React App (`react-app/`)**: Modern TypeScript/React/Vite application with:
- **Entry Point**: `react-app/src/main.tsx` → `App.tsx`
- **Pages**: `react-app/src/pages/` (page components)
- **Components**: `react-app/src/components/` (reusable UI)
- **Services**: `react-app/src/services/` (API integration)
- **Contexts**: `react-app/src/contexts/` (React Context API)
- **Stack**: React 19, React Router 7, Framer Motion, Three.js, Firebase 12, Vite 7

**Legacy SPA (`app-modular.js`, `modules/`)**: Vanilla JS modular architecture:
- **Entry Point**: `app-modular.js` (XemPhimApp class)
- **Core Modules** (`modules/`):
  - `api.js`: API integration, caching, memory management
  - `router.js`: SPA routing
  - `pages.js`: Page renderers (home, search, filters, categories)
  - `ui-components.js`: UI building blocks (cards, pagination, errors)
  - `utils.js`: Helpers (theme, notifications, storage)
  
- **Performance Modules**:
  - `performance-monitor.js`, `performance-monitor-enhanced.js`: Metrics tracking
  - `core-web-vitals-optimizer.js`: Web vitals optimization
  - `network-monitor.js`: Network quality monitoring
  - `video-cache.js`: Video caching strategies
  - `video-player.js`: Custom video player
  - `image-loader.js`: Lazy loading, progressive images

- **Advanced Features**:
  - `error-boundaries.js`: Global error handling
  - `notifications.js`, `notification-ui.js`, `notification-*.js`: Notification system
  - `monitoring.js`: Application monitoring
  - `seo-optimizer.js`: SEO enhancements
  - `sitemap-generator.js`: Dynamic sitemap generation
  - `testing.js`: Testing framework utilities
  - `bundle-optimizer.js`: Bundle optimization
  - `component-library.js`: Component library

### Firebase Integration

**Primary Storage System** (cross-device sync):
- `firebase-config.js`: Base Firebase configuration
- `firebase-config-enhanced.js`: Enhanced user ID system (deterministic, persistent)
- `auto-recovery.js`: Automatic data recovery on storage clear
- `recovery-ui.js`: UI for manual data recovery
- `migration-tool.js`: Migrate existing users to enhanced system
- `firebase-primary-*.js`: Primary storage implementation
- `firebase-security-rules.js`: Security rule templates

**Key Features**:
- Comment system with user authentication
- Saved movies sync across devices
- Auto-recovery when cookies/localStorage cleared
- Deterministic user IDs (same device = same ID after reset)

### Build System

**Webpack** (Legacy SPA):
- Entry: `main` (app-modular.js), `vendor` (firebase), `service-worker`
- Code splitting: Automatic vendor/chunk splitting
- Plugins: Bundle analyzer, Terser, CSS minimizer, Workbox (PWA)
- Target: Modern ES2020+ modules

**Vite** (React App):
- Lightning-fast HMR
- Optimized production builds
- Asset handling, PostCSS, TypeScript

### Path Aliases (TypeScript)

```typescript
"@/*"           → "./modules/*"
"@types/*"      → "./types/*"
"@components/*" → "./modules/component-library/*"
"@utils/*"      → "./modules/utils/*"
```

### Testing Strategy

- **Jest**: Unit & integration tests (`tests/`, `modules/**/*.test.js`)
- **Playwright**: E2E tests
- **Coverage Thresholds**: 80% branches/functions/lines/statements
- **Test Setup**: `tests/setup.js`

### Pre-commit Hooks (Husky)

- `pre-commit`: lint-staged (ESLint + Prettier)
- `pre-push`: Type-check + unit tests
- `commit-msg`: commitlint

## Development Workflow

### Language Preference
**Always respond in Vietnamese** when communicating with users.

### Code Standards
- **TypeScript**: Strict mode enabled, 95%+ coverage target
- **ES2020+**: Modern JavaScript features
- **Modular Architecture**: Keep modules focused and single-purpose
- **Error Handling**: Use error boundaries, comprehensive logging
- **Performance**: Monitor bundle size (Main: 300KB, Core: 100KB, UI: 150KB)

### Adding New Features

1. **Legacy SPA**: Create module in `modules/`, import in `app-modular.js`
2. **React App**: Add component/page in `react-app/src/`, follow existing structure
3. **Firebase**: Update enhanced system if affecting user data
4. **Tests**: Add tests alongside implementation
5. **Documentation**: Update relevant `.md` files

### Debugging Approach

- Check Firebase console logs: `FirebaseLogger.debug/info/warn/error`
- Use performance monitors: `enhancedPerformanceMonitor`, `performanceDashboard`
- Network issues: Check `network-monitor.js` outputs
- Video playback: Verify `video-cache.js` and `video-player.js` logs
- **Root cause**: Always fix the cause, not the symptom

### File Organization

- **Root**: Main HTML, config files, deployment scripts, documentation
- **modules/**: Legacy SPA modules (30+ files)
- **react-app/**: Modern React application
- **scripts/**: Automation scripts (auto-update, sync, download)
- **tests/**: Test files
- **types/**: TypeScript type definitions
- **assets/**: Static assets
- **.cursor/rules/**: Cursor AI rules (include Vietnamese language preference, Tech Lead mindset, root cause analysis)

## API Integration

**Base URL**: Configured in API modules (placeholder: "https://Serect")

**Key Endpoints**:
- `/danh-sach/phim-moi-cap-nhat-v3`: Latest movies
- `/danh-sach/phim-bo`: TV series
- `/danh-sach/hoat-hinh`: Anime
- `/tim-kiem?keyword=...`: Search
- `/phim/[slug]`: Movie details

**Configuration**:
- Cache duration: 30 minutes
- Items per page: 24
- Memory management via `memoryManager` in `api.js`

## Important Notes

### Requirements
- Node.js: >=18.0.0
- npm: >=9.0.0

### Common Issues

**Port 5173 already in use**: Kill process or use different port in `react-app/vite.config.ts`

**Module not found**: Run `npm install` in appropriate directory (root or `react-app/`)

**Firebase errors**: Check Firebase console at https://console.firebase.google.com, verify config in `firebase-config.js`

**TypeScript errors**: Run `npm run type-check` to see all issues

**Build failures**: Clear cache with `npm run clean` then rebuild

### Security
- Firebase API keys are public (normal for client-side Firebase)
- Security enforced via Firebase Security Rules (see `firebase-security-rules.js`)
- Never commit sensitive tokens/secrets beyond Firebase public config

### Performance Targets
- Lighthouse score: 92+/100
- Bundle size reduction: 62% (achieved)
- TypeScript coverage: 95%+
- Test coverage: 80%+

### Git Workflow
- **DO NOT** auto-commit unless explicitly requested by user
- Use deployment scripts for production pushes
- Follow commitlint conventions (enforced by Husky)

## Documentation References

- `README.md`: General project overview
- `HOW-TO-RUN.md`, `HOW-TO-RUN-LOCALHOST.md`: Development setup
- `PRODUCTION-DEPLOYMENT-GUIDE.md`: Deployment instructions
- `ENHANCED_FIREBASE_GUIDE.md`: Firebase system details
- `AUTO-UPDATE-SYSTEM-DOCS.md`: Auto-update system
- `BANNER-SLIDER-DOCS.md`, `SERIES-NAVIGATOR-DOCS.md`: Feature documentation
- `COMBINED-FILTER-SYSTEM-DOCS.md`: Filter system architecture
- `NOTIFICATION_SYSTEM_GUIDE.md`: Notification implementation
- `NETWORK_OPTIMIZATION_GUIDE.md`: Network optimization strategies
- `SCALABILITY_ANALYSIS.md`: Scalability considerations
- Various `react-app/*.md`: React-specific guides

## AI Assistant Guidelines (from .cursor/rules/)

- **Confidence levels**: Provide 0-10 confidence before/after tool usage
- **Assumptions**: List all assumptions and uncertainties before completing tasks
- **Tech Lead mindset**: Find root causes, not symptoms
- **Detailed explanations**: Comprehensive code comments and summaries
- **Documentation**: Update codebase docs with all changes
- **Vietnamese**: Default language for all responses
