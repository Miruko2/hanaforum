# Capacitor 移动应用设置指南

本项目已经配置为支持 Capacitor，可以将 Next.js 应用打包为原生移动应用。

## 📋 前置要求

### Android 开发
- **Java Development Kit (JDK) 17+**
- **Android Studio** (推荐最新版本)
- **Android SDK** (通过 Android Studio 安装)

### 系统要求
- Node.js 18+
- npm 或 yarn

## 🚀 快速开始

### 1. 自动设置 (推荐)
```bash
npm run setup:capacitor
```

这个命令会自动：
- 构建 Next.js 静态文件
- 添加 Android 平台（如果尚未添加）
- 同步项目到原生平台

### 2. 手动设置
```bash
# 构建项目
npm run build

# 添加 Android 平台（首次）
npx cap add android

# 同步项目
npx cap sync
```

## 📱 运行应用

### 开发模式
```bash
npm run android:dev
```

### 生产构建
```bash
npm run android:build
```

### 在 Android Studio 中打开
```bash
npm run android:open
```

## 🔧 配置说明

### 路由处理
项目已配置为支持静态导出，解决了原生应用中的路由问题：

1. **静态导出**: 使用 `output: 'export'` 配置
2. **路由组件**: 创建了专门的 `CapacitorRouter` 和 `AuthLink` 组件
3. **自动路由**: 在 Capacitor 环境中自动处理静态路由跳转

### 图片优化
- 禁用了 Next.js 图片优化 (`unoptimized: true`) 以支持静态导出
- 保持了响应式图片支持

### 安全配置
- 配置了适当的 CORS 头部
- 允许混合内容以支持开发环境

## 📂 文件结构

```
├── capacitor.config.ts          # Capacitor 配置
├── next.config.mjs              # Next.js 配置（已修改支持静态导出）
├── components/
│   └── capacitor-router.tsx     # 路由处理组件
├── scripts/
│   └── setup-capacitor.js       # 自动设置脚本
└── android/                     # Android 项目文件（运行后生成）
```

## 🐛 常见问题

### 路由跳转失败
- **问题**: 在原生应用中无法跳转到登录/注册页面
- **解决**: 已通过 `AuthLink` 组件和静态路由处理解决

### 图片无法显示
- **问题**: 静态导出后图片路径错误
- **解决**: 使用相对路径，避免绝对路径引用

### 构建失败
- **问题**: Android 构建时找不到 JDK
- **解决**: 确保安装了 JDK 17+ 并配置了 `JAVA_HOME` 环境变量

### 首次运行慢
- **问题**: 首次运行 Android 应用很慢
- **解决**: 这是正常的，Android Studio 需要下载依赖和配置 SDK

## 🔄 更新流程

当你修改了代码后：

```bash
# 重新构建并同步
npm run build:capacitor

# 或者单独同步
npm run cap:sync
```

## 📋 可用脚本

| 脚本 | 描述 |
|------|------|
| `npm run setup:capacitor` | 自动设置 Capacitor 项目 |
| `npm run build:capacitor` | 构建并同步到原生平台 |
| `npm run android:dev` | 开发模式运行 Android 应用 |
| `npm run android:build` | 生产模式运行 Android 应用 |
| `npm run android:open` | 在 Android Studio 中打开 |
| `npm run cap:sync` | 同步更改到原生项目 |
| `npm run cap:add` | 添加新的原生平台 |

## 📝 注意事项

1. **首次运行**: 可能需要在 Android Studio 中接受许可协议
2. **设备调试**: 确保启用了 USB 调试或使用模拟器
3. **网络权限**: 应用需要网络权限来访问 API
4. **存储权限**: 根据需要可能需要配置额外权限

## 🆘 获取帮助

如果遇到问题：
1. 检查 Android Studio 和 JDK 是否正确安装
2. 确保设备已连接并启用调试模式
3. 查看 `npx cap doctor` 输出的诊断信息
4. 参考 [Capacitor 官方文档](https://capacitorjs.com/docs) 