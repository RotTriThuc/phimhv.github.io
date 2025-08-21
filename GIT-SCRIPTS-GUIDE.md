# 🚀 Git Batch Scripts Guide

## 📋 Tổng quan

Bộ 3 batch scripts để quản lý Git và GitHub một cách dễ dàng:

1. **`push-to-github.bat`** - Script chính với UI đẹp
2. **`git-helper.bat`** - Tool đa năng với menu
3. **`daily-push.bat`** - Push nhanh hàng ngày

## 🔧 Cách sử dụng

### **1. 🚀 push-to-github.bat (Khuyến nghị)**

**Tính năng:**
- ✅ UI đẹp với màu sắc
- ✅ Kiểm tra Git status trước khi push
- ✅ Nhập commit message tùy chỉnh
- ✅ Error handling đầy đủ
- ✅ Mở GitHub/Website sau khi push

**Cách dùng:**
```cmd
# Double-click hoặc
push-to-github.bat
```

**Workflow:**
1. Kiểm tra có thay đổi không
2. Nhập commit message (hoặc dùng mặc định)
3. Add → Commit → Push
4. Mở GitHub/Website (tùy chọn)

### **2. 🔧 git-helper.bat (Advanced)**

**Tính năng:**
- 📊 **Git Status** - Xem chi tiết thay đổi
- 🚀 **Quick Push** - Push nhanh với message tự động
- ✍️ **Custom Push** - Push với message tùy chỉnh
- 📥 **Pull** - Lấy updates từ GitHub
- 📝 **View Log** - Xem commit history
- 🌐 **Open Links** - Mở GitHub, Website, Actions, Settings
- 🔄 **Sync All** - Pull + Push (full sync)

**Cách dùng:**
```cmd
git-helper.bat
```

**Menu Interface:**
```
╔══════════════════════════════════════╗
║        🔧 GIT HELPER TOOL 🔧        ║
╠══════════════════════════════════════╣
║  📦 Repository: web-xem-anime       ║
║  👤 Author: RotTriThuc               ║
╚══════════════════════════════════════╝

🎯 Chọn hành động:
[1] 📊 Git Status
[2] 🚀 Quick Push  
[3] ✍️ Custom Push
[4] 📥 Pull
[5] 📝 View Log
[6] 🌐 Open Links
[7] 🔄 Sync All
[0] ❌ Exit
```

### **3. 📅 daily-push.bat (Simple)**

**Tính năng:**
- ⚡ **Super fast** - Không cần interaction
- 📅 **Auto message** - "Daily update: [date]"
- ✅ **Smart check** - Chỉ push khi có thay đổi
- ⏰ **Auto close** - Tự đóng sau 5 giây

**Cách dùng:**
```cmd
daily-push.bat
```

**Perfect cho:**
- Daily updates
- Scheduled tasks
- Quick commits

## 🎯 Khi nào dùng script nào?

### **🚀 push-to-github.bat**
- ✅ **Cập nhật quan trọng** cần commit message rõ ràng
- ✅ **First time users** - UI thân thiện
- ✅ **Manual deployment** - Muốn kiểm soát hoàn toàn

### **🔧 git-helper.bat**
- ✅ **Power users** - Cần nhiều Git operations
- ✅ **Debugging** - Xem logs, status, pull updates
- ✅ **Project management** - Full Git workflow

### **📅 daily-push.bat**
- ✅ **Routine updates** - Backup hàng ngày
- ✅ **Automated workflows** - Scheduled tasks
- ✅ **Quick saves** - Không cần custom message

## 📊 Workflow Examples

### **Scenario 1: Feature Development**
```cmd
# 1. Check current status
git-helper.bat → [1] Git Status

# 2. Work on features...

# 3. Custom push with descriptive message
git-helper.bat → [3] Custom Push
→ "✨ Add new movie search filters"
```

### **Scenario 2: Bug Fixes**
```cmd
# 1. Fix bugs...

# 2. Push with clear message
push-to-github.bat
→ "🐛 Fix mobile responsive issues"
```

### **Scenario 3: Daily Backup**
```cmd
# Simple daily save
daily-push.bat
→ Auto: "📅 Daily update: 21/08/2025"
```

## 🔄 Auto-Deployment Flow

Sau mỗi lần push:

1. **GitHub receives push** ⚡
2. **GitHub Actions triggers** 🤖
3. **Build & Deploy** 🚀 (1-2 minutes)
4. **Website updates** 🌐

**URLs:**
- 📦 **Repository**: https://github.com/RotTriThuc/web-xem-anime
- 🎬 **Live Site**: https://rottriThuc.github.io/web-xem-anime/
- ⚡ **Actions**: https://github.com/RotTriThuc/web-xem-anime/actions

## 💡 Pro Tips

### **Commit Message Best Practices:**
```
🎨 Improve UI/UX design
🐛 Fix bug in movie search  
✨ Add new feature
📱 Improve mobile responsiveness
🚀 Performance improvements
📝 Update documentation
🔧 Configuration changes
🔒 Security improvements
♻️ Refactor code
🗃️ Database changes
```

### **Quick Commands:**
```cmd
# Status check
git status

# Quick view changes
git diff --stat

# View recent commits
git log --oneline -5

# Undo last commit (keep changes)
git reset --soft HEAD~1
```

## 🐛 Troubleshooting

### **"Git not found"**
- Install Git: https://git-scm.com/
- Add to PATH environment variable

### **"Push failed"**
- Check internet connection
- Verify GitHub credentials
- Run: `git remote -v` to check repository URL

### **"No changes to commit"**
- Normal - no files were modified
- Check with: `git status`

### **Authentication Issues**
```cmd
# Setup GitHub credentials
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# For HTTPS (recommended)
Use GitHub Personal Access Token
```

## 📈 Performance

### **Script Execution Times:**
- **daily-push.bat**: ~3-5 seconds
- **push-to-github.bat**: ~10-15 seconds (with user input)
- **git-helper.bat**: Variable (depends on operation)

### **Network Usage:**
- **Small changes**: ~1-10 KB
- **Medium updates**: ~50-200 KB  
- **Large updates**: ~1-5 MB

---

**🎯 Happy Git-ing! Made with ❤️ by RotTriThuc** 