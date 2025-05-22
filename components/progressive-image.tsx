"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface ProgressiveImageProps {
  src: string
  alt: string
  className?: string
  aspectRatio?: number
  priority?: boolean
  width?: number
  height?: number
}

export default function ProgressiveImage({
  src,
  alt,
  className,
  aspectRatio,
  priority = false,
  width,
  height,
}: ProgressiveImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [currentSrc, setCurrentSrc] = useState(src)
  const [error, setError] = useState(false)

  useEffect(() => {
    // 当src变化时重置状态
    setCurrentSrc(src)
    setIsLoading(true)
    setError(false)
  }, [src])

  // 处理图片加载完成
  const handleImageLoad = () => {
    setIsLoading(false)
  }

  // 处理图片加载错误
  const handleImageError = () => {
    setError(true)
    setIsLoading(false)
    // 设置为占位图
    setCurrentSrc(`/placeholder.svg?height=400&width=600&query=图片加载失败`)
  }

  return (
    <div className={cn("relative overflow-hidden", isLoading && "animate-pulse bg-gray-700/50", className)}>
      <Image
        src={currentSrc || "/placeholder.svg"}
        alt={alt}
        fill={!width || !height}
        width={width}
        height={height}
        className={cn("object-cover transition-all duration-300", isLoading ? "scale-110 blur-sm" : "scale-100 blur-0")}
        onLoad={handleImageLoad}
        onError={handleImageError}
        priority={priority}
      />
    </div>
  )
}
