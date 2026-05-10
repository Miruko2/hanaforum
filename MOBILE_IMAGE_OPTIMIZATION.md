# 移动端图片优化方案

## 概述

为了解决移动端应用中图片加载性能问题，我们实现了一套基于设备自适应的图片优化系统。该系统能够根据设备类型和网络状况动态调整图片质量、尺寸，并提供高效缓存机制。

## 主要功能

- **设备自适应**: 自动检测是否为移动设备，并应用更激进的优化
- **网络感知**: 根据网络状况（快/中/慢）调整图片质量
- **内存缓存**: 客户端图片缓存，减少重复请求
- **动态质量**: 移动端低至50%质量，桌面端75%质量
- **动态尺寸**: 移动设备缩放0.4倍，桌面端0.6倍
- **加载优化**: 根据网络状况选择加载动画
- **客户端处理**: 使用Canvas进行客户端压缩，不依赖服务端

## 如何使用

### 基础使用

```jsx
import { DeviceAdaptiveImage } from "@/lib/device-adaptive-image"

<DeviceAdaptiveImage 
  src="/path/to/image.jpg"
  alt="图片描述"
  className="rounded-lg"
  aspectRatio={16/9}
/>
```

### 启用缓存优化

```jsx
import { CachedAdaptiveImage } from "@/lib/device-adaptive-image"

<CachedAdaptiveImage 
  src="/path/to/image.jpg"
  alt="图片描述"
  className="rounded-lg"
/>
```

### 在帖子组件中使用

```jsx
import AdaptivePostImage from "@/components/adaptive-post-image"

<AdaptivePostImage 
  post={post}
  useCache={true}
  aspectRatio={16/9}
/>
```

## 优化参数详解

### 不同设备的质量参数

| 设备类型 | 网络状况 | 图片质量 | 缩放比例 |
|---------|--------|----------|--------|
| 移动端   | 快速    | 60%      | 0.4x   |
| 移动端   | 中速    | 60%      | 0.4x   |
| 移动端   | 慢速    | 50%      | 0.4x   |
| 桌面端   | 快速    | 75%      | 0.6x   |
| 桌面端   | 中速    | 70%      | 0.6x   |
| 桌面端   | 慢速    | 60%      | 0.6x   |

### 网络检测逻辑

```javascript
if (connection.saveData) {
  // 用户开启了数据节省模式
  setNetworkType('slow')
} else if (connection.effectiveType === '4g') {
  setNetworkType('fast')
} else if (connection.effectiveType === '3g') {
  setNetworkType('medium')
} else {
  // 2g或更慢
  setNetworkType('slow')
}
```

## 性能提升

使用该方案后，我们预计以下性能指标会有显著提升：

- **图片数据传输**: 减少 60-75%
- **图片加载时间**: 减少 50-70%
- **内存占用**: 减少 40-60% 
- **重复请求**: 减少 90% (因为内存缓存)
- **电池使用**: 减少 30% (因为减少解码工作)

## 实现原理

### 1. 设备检测

使用 `useIsMobile` hook 检测当前设备类型。

### 2. 网络检测

使用 `navigator.connection` API 检测网络状况。

### 3. 图像处理

使用 HTML5 Canvas API 进行客户端图像处理：

```javascript
const canvas = document.createElement('canvas')
const ctx = canvas.getContext('2d')
canvas.width = img.width * scale
canvas.height = img.height * scale
ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
const dataUrl = canvas.toDataURL('image/jpeg', quality)
```

### 4. 内存缓存

使用 JavaScript Map 对象实现内存缓存：

```javascript
const imageCache = new Map<string, string>()
```

## 兼容性说明

本优化方案在以下平台经过测试：

- Android 5.0+
- iOS 12.0+
- 现代浏览器 (Chrome, Firefox, Safari)

## 注意事项

1. 该优化主要针对移动端设计，特别是在Capacitor应用中
2. 优化会牺牲一定的图片质量换取更快的加载速度
3. 优先级图片(priority=true)不会使用缓存机制
4. 对于大量图片加载，请考虑使用虚拟列表技术配合本方案

## 未来改进

- 添加持久化缓存 (使用IndexedDB或localStorage)
- 添加图片预加载API
- 实现自适应图像文件格式检测 (WebP/AVIF支持)
- 添加图片压缩级别自定义选项 