const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class AutoUpdater {
  constructor() {
    this.API_BASE = 'https://phimapi.com';
    this.DATA_DIR = path.join(__dirname, '..', 'data');
    this.MAIN_FILE = path.join(this.DATA_DIR, 'kho-phim.json');
    this.UPDATES_FILE = path.join(this.DATA_DIR, 'updates-log.json');
    this.CONFIG_FILE = path.join(this.DATA_DIR, 'auto-update-config.json');
    
    this.config = {
      updateInterval: 5 * 60 * 1000, // 5 phút
      maxRetries: 3,
      batchSize: 24,
      enableNotifications: true,
      trackNewEpisodes: true,
      trackNewMovies: true,
      autoPushToGit: true, // Tự động push lên GitHub
      gitCommitMessage: 'Auto-update: {updateSummary}' // Template commit message
    };
    
    this.stats = {
      lastUpdate: null,
      newMovies: 0,
      newEpisodes: 0,
      updatedMovies: 0,
      totalChecked: 0
    };
  }

  async init() {
    try {
      // Tạo thư mục data nếu chưa có
      await fs.mkdir(this.DATA_DIR, { recursive: true });
      
      // Load config nếu có
      try {
        const configData = await fs.readFile(this.CONFIG_FILE, 'utf8');
        this.config = { ...this.config, ...JSON.parse(configData) };
      } catch (e) {
        await this.saveConfig();
      }
      
      console.log('🚀 Auto-Updater initialized');
      console.log(`📊 Config: Update every ${this.config.updateInterval / 1000 / 60} minutes`);
      
    } catch (error) {
      console.error('❌ Failed to initialize:', error.message);
      throw error;
    }
  }

  async saveConfig() {
    await fs.writeFile(this.CONFIG_FILE, JSON.stringify(this.config, null, 2));
  }

  async fetchWithRetry(url, retries = this.config.maxRetries) {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
      } catch (error) {
        console.warn(`⚠️ Attempt ${i + 1}/${retries} failed for ${url}: ${error.message}`);
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }

  async loadExistingData() {
    try {
      const data = await fs.readFile(this.MAIN_FILE, 'utf8');
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : (parsed.items || []);
    } catch (error) {
      console.log('📝 No existing data found, starting fresh');
      return [];
    }
  }

  async getLatestMovies(pages = 3) {
    const allMovies = [];
    
    for (let page = 1; page <= pages; page++) {
      try {
        console.log(`📡 Fetching page ${page}/${pages}...`);
        const url = `${this.API_BASE}/danh-sach/phim-moi-cap-nhat-v3?page=${page}`;
        const response = await this.fetchWithRetry(url);
        
        const items = response?.data?.items || response?.items || [];
        if (items.length === 0) break;
        
        allMovies.push(...items);
        this.stats.totalChecked += items.length;
        
        // Delay giữa các request
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`❌ Failed to fetch page ${page}:`, error.message);
        break;
      }
    }
    
    return allMovies;
  }

  async detectChanges(existingMovies, newMovies) {
    const existingMap = new Map();
    existingMovies.forEach(movie => {
      existingMap.set(movie.slug, movie);
    });

    const changes = {
      newMovies: [],
      newEpisodes: [],
      updatedMovies: [],
      timestamp: new Date().toISOString()
    };

    for (const movie of newMovies) {
      const existing = existingMap.get(movie.slug);
      
      if (!existing) {
        // Phim hoàn toàn mới
        changes.newMovies.push({
          ...movie,
          isNew: true,
          detectedAt: new Date().toISOString()
        });
        this.stats.newMovies++;
        
      } else {
        // Kiểm tra cập nhật
        const hasUpdates = this.compareMovies(existing, movie);
        
        if (hasUpdates.hasNewEpisode) {
          changes.newEpisodes.push({
            slug: movie.slug,
            name: movie.name,
            oldEpisode: existing.episode_current,
            newEpisode: movie.episode_current,
            updatedAt: movie.modified?.time || new Date().toISOString()
          });
          this.stats.newEpisodes++;
        }
        
        if (hasUpdates.hasOtherChanges) {
          changes.updatedMovies.push({
            slug: movie.slug,
            name: movie.name,
            changes: hasUpdates.changes,
            updatedAt: movie.modified?.time || new Date().toISOString()
          });
          this.stats.updatedMovies++;
        }
      }
    }

    return changes;
  }

  compareMovies(existing, updated) {
    const changes = [];
    let hasNewEpisode = false;
    let hasOtherChanges = false;

    // Kiểm tra tập mới
    if (existing.episode_current !== updated.episode_current) {
      if (updated.episode_current && updated.episode_current !== 'Full') {
        hasNewEpisode = true;
        changes.push(`Episode: ${existing.episode_current} → ${updated.episode_current}`);
      }
    }

    // Kiểm tra chất lượng
    if (existing.quality !== updated.quality) {
      hasOtherChanges = true;
      changes.push(`Quality: ${existing.quality} → ${updated.quality}`);
    }

    // Kiểm tra ngôn ngữ
    if (existing.lang !== updated.lang) {
      hasOtherChanges = true;
      changes.push(`Language: ${existing.lang} → ${updated.lang}`);
    }

    // Kiểm tra poster
    if (existing.poster_url !== updated.poster_url) {
      hasOtherChanges = true;
      changes.push('Poster updated');
    }

    return { hasNewEpisode, hasOtherChanges, changes };
  }

  async saveUpdatesLog(changes) {
    try {
      let existingLogs = [];
      try {
        const logData = await fs.readFile(this.UPDATES_FILE, 'utf8');
        existingLogs = JSON.parse(logData);
      } catch (e) {
        // File không tồn tại
      }

      existingLogs.unshift(changes);
      
      // Giữ lại 100 log gần nhất
      if (existingLogs.length > 100) {
        existingLogs = existingLogs.slice(0, 100);
      }

      await fs.writeFile(this.UPDATES_FILE, JSON.stringify(existingLogs, null, 2));
      
    } catch (error) {
      console.error('❌ Failed to save updates log:', error.message);
    }
  }

  async mergeAndSaveData(existingMovies, newMovies, changes) {
    const movieMap = new Map();
    
    // Add existing movies
    existingMovies.forEach(movie => {
      movieMap.set(movie.slug, movie);
    });
    
    // Update with new data
    newMovies.forEach(movie => {
      movieMap.set(movie.slug, {
        ...movie,
        lastUpdated: new Date().toISOString()
      });
    });
    
    const mergedData = Array.from(movieMap.values());
    
    // Sắp xếp theo thời gian cập nhật
    mergedData.sort((a, b) => {
      const timeA = a.modified?.time || a.lastUpdated || '0';
      const timeB = b.modified?.time || b.lastUpdated || '0';
      return new Date(timeB) - new Date(timeA);
    });

    await fs.writeFile(this.MAIN_FILE, JSON.stringify(mergedData, null, 2));
    
    // Create trackable summary file for Git (small file that can be committed)
    const hasSignificantUpdates = changes.newMovies.length > 0 || changes.newEpisodes.length > 0;
    if (hasSignificantUpdates) {
      await this.createTrackableSummary(changes, mergedData.length);
    }
    
    console.log(`💾 Saved ${mergedData.length} movies to database`);
  }

  async createTrackableSummary(changes, totalMovies) {
    const summaryFile = path.join(__dirname, '..', 'movie-updates-summary.json');

    const summary = {
      lastUpdate: new Date().toISOString(),
      totalMovies: totalMovies,
      stats: {
        newMovies: changes.newMovies.length,
        newEpisodes: changes.newEpisodes.length,
        updatedMovies: changes.updatedMovies.length
      },
      recentMovies: changes.newMovies.slice(0, 5).map(movie => ({
        name: movie.name,
        slug: movie.slug,
        year: movie.year,
        added: movie.detectedAt
      })),
      recentEpisodes: changes.newEpisodes.slice(0, 5).map(ep => ({
        name: ep.name,
        slug: ep.slug,
        episode: ep.newEpisode,
        updated: ep.updatedAt
      }))
    };

    await fs.writeFile(summaryFile, JSON.stringify(summary, null, 2));
    console.log(`📝 Created trackable summary file for Git push`);
  }

  createNotificationMessage(changes) {
    const messages = [];

    if (changes.newMovies.length > 0) {
      messages.push(`🎬 ${changes.newMovies.length} phim mới`);
    }

    if (changes.newEpisodes.length > 0) {
      messages.push(`📺 ${changes.newEpisodes.length} tập mới`);
    }

    if (changes.updatedMovies.length > 0) {
      messages.push(`🔄 ${changes.updatedMovies.length} phim cập nhật`);
    }

    return messages.length > 0 ? messages.join(' • ') : 'Không có cập nhật mới';
  }

  async performUpdate() {
    const startTime = Date.now();
    console.log(`\n🔄 Starting update at ${new Date().toLocaleString('vi-VN')}`);

    try {
      // Reset stats
      this.stats = {
        lastUpdate: new Date().toISOString(),
        newMovies: 0,
        newEpisodes: 0,
        updatedMovies: 0,
        totalChecked: 0
      };

      // Load existing data
      const existingMovies = await this.loadExistingData();
      console.log(`📊 Loaded ${existingMovies.length} existing movies`);

      // Fetch latest movies
      const newMovies = await this.getLatestMovies(3); // 3 trang đầu
      console.log(`📡 Fetched ${newMovies.length} latest movies`);

      if (newMovies.length === 0) {
        console.log('⚠️ No new data received, skipping update');
        return;
      }

      // Detect changes
      const changes = await this.detectChanges(existingMovies, newMovies);

      // Save updates log
      await this.saveUpdatesLog(changes);

      // Merge and save data
      await this.mergeAndSaveData(existingMovies, newMovies, changes);

      // Create notification
      const notification = this.createNotificationMessage(changes);

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      console.log(`\n✅ Update completed in ${duration}s`);
      console.log(`📊 Stats: ${this.stats.newMovies} new movies, ${this.stats.newEpisodes} new episodes, ${this.stats.updatedMovies} updates`);
      console.log(`🔔 ${notification}`);

      // Tạo file notification cho frontend
      await this.saveNotification({
        message: notification,
        timestamp: new Date().toISOString(),
        stats: this.stats,
        hasUpdates: changes.newMovies.length > 0 || changes.newEpisodes.length > 0 || changes.updatedMovies.length > 0
      });

      // Auto-push to GitHub if enabled and there are updates
      const hasSignificantUpdates = changes.newMovies.length > 0 || changes.newEpisodes.length > 0;
      if (hasSignificantUpdates) {
        console.log('\n🔄 Attempting to push updates to GitHub...');
        const pushSuccess = await this.pushToGitHub(notification);

        if (pushSuccess) {
          console.log('🎉 Auto-push completed successfully!');
        } else {
          console.log('⚠️ Auto-push skipped or failed (check logs above)');
        }
      } else {
        console.log('📝 No significant updates, skipping Git push');
      }

    } catch (error) {
      console.error('❌ Update failed:', error.message);
      console.error(error.stack);
    }
  }

  async saveNotification(notification) {
    try {
      const notificationFile = path.join(this.DATA_DIR, 'latest-notification.json');
      await fs.writeFile(notificationFile, JSON.stringify(notification, null, 2));
    } catch (error) {
      console.error('❌ Failed to save notification:', error.message);
    }
  }

  // Git operations
  async checkGitStatus() {
    try {
      const status = execSync('git status --porcelain', { encoding: 'utf8', cwd: path.join(__dirname, '..') });
      return status.trim().length > 0; // True if there are changes
    } catch (error) {
      console.warn('⚠️ Git status check failed:', error.message);
      return false;
    }
  }

  async pushToGitHub(updateSummary) {
    if (!this.config.autoPushToGit) {
      console.log('🚫 Auto-push disabled in config');
      return false;
    }

    try {
      console.log('🔄 Checking for Git changes...');
      const hasChanges = await this.checkGitStatus();

      if (!hasChanges) {
        console.log('📝 No Git changes detected, skipping push');
        return false;
      }

      const projectRoot = path.join(__dirname, '..');
      const commitMessage = this.config.gitCommitMessage.replace('{updateSummary}', updateSummary);

      // Try to sync with remote first to avoid conflicts
      console.log('🔄 Syncing with remote repository...');
      await this.syncWithRemote(projectRoot);

      // Preserve CNAME file to prevent GitHub Pages 404 errors
      console.log('🔧 Preserving GitHub Pages configuration...');
      await this.preserveGitHubPagesConfig(projectRoot);

      console.log('📦 Adding files to Git...');
      execSync('git add .', { cwd: projectRoot, stdio: 'inherit' });

      console.log(`💬 Committing with message: "${commitMessage}"`);
      execSync(`git commit -m "${commitMessage}"`, { cwd: projectRoot, stdio: 'inherit' });

      console.log('🚀 Pushing to GitHub...');
      execSync('git push origin main', { cwd: projectRoot, stdio: 'inherit' });

      console.log('✅ Successfully pushed to GitHub!');
      console.log('⏰ GitHub Pages will update in 1-2 minutes');
      return true;

    } catch (error) {
      console.error('❌ Failed to push to GitHub:', error.message);

      // Check specific error types
      if (error.message.includes('nothing to commit')) {
        console.log('📝 Nothing to commit, working tree clean');
        return false;
      } else if (error.message.includes('remote rejected')) {
        console.error('🚫 Push rejected by remote (check permissions/conflicts)');
      } else if (error.message.includes('not a git repository')) {
        console.error('📁 Not a Git repository or no Git installed');
      }

      return false;
    }
  }

  // Preserve GitHub Pages configuration to prevent 404 errors
  async preserveGitHubPagesConfig(projectRoot) {
    try {
      const cnameFile = path.join(projectRoot, 'CNAME');

      // Ensure CNAME file exists with correct domain
      if (await fs.access(cnameFile).then(() => true).catch(() => false)) {
        const currentContent = await fs.readFile(cnameFile, 'utf8');
        const expectedDomain = 'phimhv.site';

        if (currentContent.trim() !== expectedDomain) {
          console.log(`🔧 Fixing CNAME file: "${currentContent.trim()}" → "${expectedDomain}"`);
          await fs.writeFile(cnameFile, expectedDomain);
        } else {
          console.log('✅ CNAME file is correct');
        }
      } else {
        console.log('🔧 Creating missing CNAME file...');
        await fs.writeFile(cnameFile, 'phimhv.site');
      }

      // Ensure .nojekyll file exists (prevents Jekyll processing)
      const nojekyllFile = path.join(projectRoot, '.nojekyll');
      if (!await fs.access(nojekyllFile).then(() => true).catch(() => false)) {
        console.log('🔧 Creating .nojekyll file...');
        await fs.writeFile(nojekyllFile, '');
      }

    } catch (error) {
      console.warn('⚠️ Failed to preserve GitHub Pages config:', error.message);
    }
  }

  async syncWithRemote(projectRoot) {
    try {
      // Check if there are uncommitted changes first
      const statusOutput = execSync('git status --porcelain', {
        encoding: 'utf8',
        cwd: projectRoot
      });

      const hasUncommittedChanges = statusOutput.trim().length > 0;

      if (hasUncommittedChanges) {
        console.log('📋 Stashing local changes before sync...');
        execSync('git stash push -m "Auto-stash before sync"', { cwd: projectRoot, stdio: 'inherit' });
      }

      // Check if we need to pull
      try {
        execSync('git fetch origin', { cwd: projectRoot, stdio: 'pipe' });

        const behindCount = execSync('git rev-list HEAD..origin/main --count', {
          encoding: 'utf8',
          cwd: projectRoot
        }).trim();

        if (parseInt(behindCount) > 0) {
          console.log(`📥 Pulling ${behindCount} commits from remote...`);
          execSync('git pull origin main --no-edit', { cwd: projectRoot, stdio: 'inherit' });
        } else {
          console.log('✅ Already up to date with remote');
        }

      } catch (pullError) {
        console.warn('⚠️ Pull failed, trying to handle conflicts...');

        // If pull failed due to conflicts, try to merge automatically
        try {
          execSync('git merge --abort', { cwd: projectRoot, stdio: 'pipe' });
        } catch (e) {
          // Ignore if no merge in progress
        }

        // Force pull with rebase to avoid conflicts
        console.log('🔄 Using rebase strategy to resolve conflicts...');
        execSync('git pull origin main --rebase', { cwd: projectRoot, stdio: 'inherit' });
      }

      // Restore stashed changes if any
      if (hasUncommittedChanges) {
        try {
          console.log('📋 Restoring stashed changes...');
          execSync('git stash pop', { cwd: projectRoot, stdio: 'inherit' });
        } catch (stashError) {
          console.warn('⚠️ Could not restore stashed changes:', stashError.message);
          console.log('💡 You may need to manually resolve this later');
        }
      }

    } catch (error) {
      console.warn('⚠️ Sync with remote failed:', error.message);
      console.log('💡 Continuing with local push attempt...');
    }
  }

  async startScheduler() {
    console.log(`⏰ Starting scheduler with ${this.config.updateInterval / 1000 / 60} minute intervals`);

    // Chạy ngay lần đầu
    await this.performUpdate();

    // Lặp lại theo interval
    setInterval(async () => {
      await this.performUpdate();
    }, this.config.updateInterval);
  }

  async runOnce() {
    await this.performUpdate();
  }
}

// CLI Interface
async function main() {
  const updater = new AutoUpdater();
  await updater.init();

  const args = process.argv.slice(2);
  const command = args[0] || 'once';

  switch (command) {
    case 'start':
    case 'daemon':
      console.log('🚀 Starting auto-updater daemon...');
      await updater.startScheduler();
      break;

    case 'once':
    default:
      console.log('🔄 Running single update...');
      await updater.runOnce();
      process.exit(0);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Gracefully shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Received SIGTERM, shutting down...');
  process.exit(0);
});

if (require.main === module) {
  main().catch(error => {
    console.error('💥 Fatal error:', error.message);
    process.exit(1);
  });
}

module.exports = AutoUpdater;
