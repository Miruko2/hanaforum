"use client"

import { useState } from "react"
import { DeviceAdaptiveImage, CachedAdaptiveImage } from "@/lib/device-adaptive-image"
import type { Post } from "@/lib/types"

interface AdaptivePostImageProps {
  post: Post
  useCache?: boolean
  className?: string
  aspectRatio?: number
  priority?: boolean
}

/**
 * 自适应的帖子图片组件
 * 根据设备类型、网络状况自动优化图片显示
 */
export default function AdaptivePostImage({
  post,
  useCache = true,
  className = "",
  aspectRatio = 16/9,
  priority = false,
}: AdaptivePostImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  
  // 图片加载完成处理
  const handleImageLoad = () => {
    setIsLoaded(true)
  }
  
  // 确保图片URL存在，使用默认图片作为备选
  const imageUrl = post.image_url || "/default-post-image.jpg"
  
  const imageProps = {
    src: imageUrl,
    alt: post.title || "帖子图片",
    className,
    aspectRatio,
    priority,
    onImageLoad: handleImageLoad
  }
  
  // 根据配置选择是否使用缓存版本
  return useCache ? (
    <CachedAdaptiveImage {...imageProps} />
  ) : (
    <DeviceAdaptiveImage {...imageProps} />
  )
} 