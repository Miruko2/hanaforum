# 建议的命令

## 开发命令

```bash
# 启动开发服务器
npm run dev

# 启动带有调试配置的开发服务器
npm run dev:debug

# 构建项目
npm run build

# 启动生产服务器
npm run start

# 代码检查
npm run lint
```

## Capacitor 移动开发命令

```bash
# 构建项目并同步到Capacitor
npm run build:capacitor

# 添加平台
npm run cap:add [platform]  # 例如: npm run cap:add android

# 同步到Capacitor
npm run cap:sync

# 运行Android应用(开发版)
npm run android:dev

# 构建Android应用(生产版)
npm run android:build

# 打开Android Studio
npm run android:open

# 运行Capacitor项目
npm run cap:run [platform]  # 例如: npm run cap:run android

# 打开Capacitor项目
npm run cap:open [platform]  # 例如: npm run cap:open android

# 设置Capacitor
npm run setup:capacitor
```

## 性能分析命令

```bash
# 分析构建
npm run analyze

# 构建并分析
npm run build:analyze
```

## 常用Windows工具命令

```bash
# 列出当前目录文件
dir

# 列出带详细信息的文件
dir /a

# 切换目录
cd [directory]

# 返回上一级目录
cd ..

# 创建目录
mkdir [directory]

# 删除文件
del [filename]

# 删除目录及其内容
rmdir /s /q [directory]

# 复制文件
copy [source] [destination]

# 移动文件
move [source] [destination]

# 查找文件内容
findstr "search-term" [filename]

# Git 命令
git status
git add .
git commit -m "message"
git push
git pull
```

## 数据库/Supabase命令
(通过工具访问Supabase，没有直接的CLI命令)