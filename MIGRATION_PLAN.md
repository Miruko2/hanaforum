# 萤火虫之国 — Flutter 重构迁移计划

## 第一部分：当前 Next.js 项目首次加载慢的诊断

### 实测数据

```
首屏 JS 总大小：~18MB (gzip 前)
├── app/page.js        6.8MB  ← 首页单 chunk
├── main-app.js        6.2MB  ← 框架运行时
├── app/layout.js      5.5MB  ← 全局布局
└── login/page.js      4.0MB  ← 登录页

vendor 依赖体积：
├── @supabase          1.3MB
├── framer-motion      1.2MB
├── @radix-ui            931KB
├── @floating-ui         309KB
└── ws.js (WebSocket)   443KB  ← 本应在服务端，也被打入客户端
```

### 根因分析

| 问题 | 原因 | 影响 |
|------|------|------|
| 所有 JS 打包为单个大 chunk | `output: 'export'` 静态导出模式不做动态代码分割 | 用户首次访问需下载 ~18MB JS |
| 无懒加载 | 所有组件（帖子网格、登录、通知、管理后台）全部在主包 | 即使用户只看首页，也要下载所有页面代码 |
| 重型依赖全量引入 | framer-motion + radix-ui(20+组件) + floating-ui 一起打进 bundle | 累计 ~3.5MB 纯 UI 库开销 |
| ws.js 被打入客户端 | WebSocket 库被 webpack 误判为客户端依赖 | 白白增加 443KB |
| globals.css 1446 行 | 大量未使用的动画关键帧和玻璃拟态变体 | CSS 解析阻塞渲染 |
| 缓存目录混入输出 | `out/cache/` 含 69MB webpack 缓存文件 | 增加构建产物体积 |
| 无 Suspense 流式渲染 | 静态导出不支持 React 18 流式 SSR | 首屏完全阻塞等待整页 JS |

### 可在当前项目做的短期优化

1. **动态 import 拆分路由** — 用 `next/dynamic` 懒加载非首屏组件
2. **移除 ws.js 客户端引用** — 确保 WebSocket 仅服务端导入
3. **framer-motion tree-shaking** — 只导入使用的动画组件，不用 `import *`
4. **Radix UI 按需导入** — 只引入实际用的 Dialog/DropdownMenu/Toast 等
5. **清理 globals.css** — 移除未使用的动画 @keyframes
6. **排除 cache 目录** — 在 `.gitignore` 和 next.config 中排除

> 注意：由于 `output: 'export'`，这些优化有上限。彻底解决仍需迁移。

---

## 第二部分：Flutter 重构完整计划

### 2.1 技术选型

| 层次 | 选择 | 说明 |
|------|------|------|
| 框架 | Flutter 3.x (stable channel) | 跨 Android/iOS，Impeller 引擎 |
| 语言 | Dart 3.x | 强类型，async/await 原生支持 |
| 后端 | Supabase (不变) | supabase_flutter SDK |
| 状态管理 | Riverpod 2.x | 类型安全，Provider 体系的继承者 |
| 路由 | go_router | 声明式路由，支持深度链接 |
| 动画 | Flutter 原生 Animation + flutter_animate | 对标 Framer Motion 的声明式动画 |
| 瀑布流 | flutter_staggered_grid_view | 对标 react-window 虚拟化 |
| 图片 | cached_network_image + flutter_image_compress | 渐进加载 + 压缩 |
| 本地存储 | flutter_secure_storage | Token 安全存储 |
| 通知 | flutter_local_notifications | 本地推送 |

### 2.2 视觉特效迁移映射

```
Next.js (Framer Motion + CSS)          →  Flutter 等价方案
──────────────────────────────────────────────────────────
backdrop-filter: blur(20px)            →  BackdropFilter + ImageFilter.blur()
fadeIn / AnimatePresence               →  FadeTransition / flutter_animate .fadeIn()
3D card rotateX/rotateY                →  Transform + GestureDetector 追踪鼠标
scroll-triggered animations            →  ScrollController + flutter_animate
spring physics                         →  SpringSimulation (Flutter 原生)
glassmorphism multi-layer shadow       →  BoxDecoration 多层 boxShadow
radial gradient glow                   →  RadialGradient + shader mask
floating particles                     →  CustomPainter + AnimationController
blur-reveal on scroll                  →  ClipRect + BackdropFilter + opacity tween
progressive image (LQIP → full)        →  cached_network_image placeholder
page transition (slide up/down)        →  go_router + CustomTransitionPage
notification bell with badge           →  Badge widget + AnimationController
FAB with ping animation                →  ScaleTransition + repeat(reverse)
smart navbar (hide on scroll)          →  SliverAppBar (Flutter 原生!)
window blinds overlay                  →  CustomClipper + shader
```

### 2.3 目录结构

```
firefly_forum/
├── lib/
│   ├── main.dart                    # 入口，Supabase 初始化
│   ├── app.dart                     # MaterialApp + 主题 + 路由
│   ├── config/
│   │   ├── theme.dart               # 暗色主题 Token (HSL → ColorScheme)
│   │   ├── constants.dart           # API 地址、分页参数
│   │   └── supabase_config.dart     # Supabase 连接配置
│   ├── core/
│   │   ├── router.dart              # go_router 路由表
│   │   ├── providers.dart           # Riverpod Provider 注册
│   │   └── extensions.dart          # Dart 扩展方法
│   ├── models/
│   │   ├── post.dart                # Post 数据模型 (freezed)
│   │   ├── comment.dart
│   │   ├── user.dart
│   │   └── notification.dart
│   ├── services/
│   │   ├── supabase_service.dart    # Supabase CRUD 封装
│   │   ├── auth_service.dart        # 认证逻辑
│   │   ├── storage_service.dart     # 图片上传
│   │   └── notification_service.dart
│   ├── providers/
│   │   ├── auth_provider.dart       # Riverpod AuthProvider
│   │   ├── posts_provider.dart      # 帖子列表 + 分页
│   │   └── notification_provider.dart
│   ├── ui/
│   │   ├── effects/
│   │   │   ├── glass_morphism.dart      # 玻璃拟态容器
│   │   │   ├── blur_reveal.dart         # 渐进模糊揭示
│   │   │   ├── hover_card_effect.dart   # 3D 卡片倾斜
│   │   │   ├── particle_background.dart # 粒子背景
│   │   │   ├── shimmer.dart             # 闪光扫过
│   │   │   └── page_transition.dart     # 页面转场动画
│   │   ├── components/
│   │   │   ├── post_card.dart           # 帖子卡片
│   │   │   ├── post_grid.dart           # 瀑布流网格
│   │   │   ├── create_post_dialog.dart  # 发帖/编辑弹窗
│   │   │   ├── post_detail_page.dart    # 帖子详情
│   │   │   ├── comment_tile.dart        # 评论组件
│   │   │   ├── like_button.dart         # 点赞按钮
│   │   │   ├── notification_bell.dart   # 通知铃铛
│   │   │   ├── floating_action_button.dart
│   │   │   ├── progressive_image.dart   # 渐进加载图片
│   │   │   └── smart_app_bar.dart       # 智能导航栏
│   │   └── pages/
│   │       ├── home_page.dart           # 首页
│   │       ├── login_page.dart
│   │       ├── register_page.dart
│   │       ├── profile_page.dart
│   │       ├── notifications_page.dart
│   │       └── admin_page.dart          # 可选
│   └── utils/
│       ├── debouncer.dart
│       ├── date_formatter.dart
│       └── platform_utils.dart          # Android/iOS 平台判断
├── assets/
│   ├── images/
│   │   └── background.jpg
│   └── fonts/
├── android/                            # Capacitor → Flutter Android
├── ios/                                # 新增 iOS 配置
├── pubspec.yaml
└── README.md
```

### 2.4 分阶段执行计划

#### 阶段零：项目初始化（1天）
- [ ] `flutter create firefly_forum`
- [ ] 配置 `pubspec.yaml` 依赖
- [ ] 配置 Android 包名 `com.firefly.forum`
- [ ] 连接 Supabase 项目（supabase_flutter）
- [ ] 主题系统（暗色 HSL → Flutter ColorScheme）

#### 阶段一：核心特效库（2-3天）
- [ ] `GlassMorphism` — BackdropFilter + ImageFilter.blur + 多层阴影
- [ ] `BlurReveal` — ClipRect + blur + opacity tween
- [ ] `HoverCardEffect` — Transform + GestureDetector + 眩光渐变
- [ ] `ParticleBackground` — CustomPainter + AnimationController
- [ ] `Shimmer` — LinearGradient + animation
- [ ] `PageTransition` — CustomTransitionPage 滑动/弹簧

#### 阶段二：认证系统（1-2天）
- [ ] `AuthService` — signIn/signUp/signOut
- [ ] `auth_provider.dart` — Riverpod StateNotifier
- [ ] 登录/注册页面（玻璃拟态卡片 UI）
- [ ] Token 持久化（flutter_secure_storage）
- [ ] 管理员检测

#### 阶段三：帖子核心功能（3-4天）
- [ ] `Post` 数据模型（freezed）
- [ ] `SupabaseService` — posts CRUD
- [ ] `PostGrid` — flutter_staggered_grid_view 瀑布流
- [ ] `PostCard` — 玻璃拟态卡片 + 悬停/点击效果
- [ ] `PostDetailPage` — 详情页 + 评论区
- [ ] `CreatePostDialog` — 发帖/编辑弹窗
- [ ] 图片上传 + 渐进加载
- [ ] 无限滚动分页
- [ ] Supabase Realtime 帖子同步

#### 阶段四：评论与互动（1-2天）
- [ ] 评论 CRUD + 嵌套回复
- [ ] 点赞（乐观更新）
- [ ] 通知系统 + 铃铛角标

#### 阶段五：润色与移动端优化（2-3天）
- [ ] 智能导航栏（SliverAppBar 自动隐藏）
- [ ] Android 返回键处理
- [ ] 下拉刷新
- [ ] 图片压缩（移动端上传前）
- [ ] Android APK 签名 + 构建
- [ ] iOS 自签配置（AltStore 兼容）

### 2.5 性能预期

| 指标 | Next.js 静态导出 (现状) | Flutter (目标) |
|------|------------------------|----------------|
| APK 大小 | ~50MB (WebView 壳 + HTML) | ~15-20MB (原生编译) |
| 冷启动 | 3-5s (下载 18MB JS → 解析 → 渲染) | < 1s (原生二进制) |
| 毛玻璃帧率 | 30-45fps (CSS backdrop-filter) | 60fps (Impeller GPU) |
| 图片加载 | 全量下载 → 显示 | 渐进式占位 → 模糊 → 高清 |
| 滚动流畅度 | 依赖浏览器 GC | 60fps 原生列表虚拟化 |
| iOS 分发 | 不支持 (静态 HTML 无法打包 IPA) | 支持 (flutter build ios) |

---

## 第三部分：iOS 分发策略（无开发者账户）

```
方案 A: AltStore (推荐)
  - 用户安装 AltStore → 通过 AltServer 自签 IPA
  - 7天重签周期，AltStore 后台自动续签
  - 无需越狱，无需 Apple ID 密码泄露

方案 B: SideStore
  - AltStore 的完全自托管分支
  - 不需电脑端 AltServer，手机端独立续签

方案 C: TestFlight 公开链接（需免费开发者账户）
  - 免费 Apple Developer 可发布 TestFlight
  - 最多 100 名测试用户
  - 90 天有效期，可重新邀请

方案 D: 企业证书（不推荐）
  - 成本高，吊销风险大
```

---

> 本计划文件路径: `MIGRATION_PLAN.md`
> 最后更新: 2026-04-28
