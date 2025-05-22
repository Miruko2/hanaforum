"use client"

import { useState, useEffect } from "react"
import Image from "next/image"

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  sizes?: string
  quality?: number
  placeholder?: "blur" | "empty"
  blurDataURL?: string
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = "",
  priority = false,
  sizes = "100vw",
  quality = 75,
  placeholder = "empty",
  blurDataURL,
}: OptimizedImageProps) {
  const [loading, setLoading] = useState(!priority)
  const [error, setError] = useState(false)
  const [imageSrc, setImageSrc] = useState(src)

  // 生成优化的图片URL
  useEffect(() => {
    // 如果是相对URL，不进行优化
    if (src.startsWith("/")) {
      setImageSrc(src)
      return
    }

    // 如果已经是优化过的URL，不再优化
    if (src.includes("/api/image?")) {
      setImageSrc(src)
      return
    }

    // 构建优化的URL
    const optimizedSrc = `/api/image?url=${encodeURIComponent(src)}${
      width ? `&width=${width}` : ""
    }${height ? `&height=${height}` : ""}&quality=${quality}&format=webp`

    setImageSrc(optimizedSrc)
  }, [src, width, height, quality])

  // 处理加载完成
  const handleLoadingComplete = () => {
    setLoading(false)
  }

  // 处理加载错误
  const handleError = () => {
    setError(true)
    setImageSrc(src) // 回退到原始图片
  }

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ aspectRatio: width && height ? width / height : undefined }}
    >
      {loading && !priority && <div className="absolute inset-0 bg-gray-200 animate-pulse" />}

      {error ? (
        // 错误回退
        <div className="flex items-center justify-center w-full h-full bg-gray-100 text-gray-500">
          <span>{alt || "图片加载失败"}</span>
        </div>
      ) : (
        <Image
          src={imageSrc || "/placeholder.svg"}
          alt={alt}
          width={width}
          height={height}
          className={`${loading ? "opacity-0" : "opacity-100"} transition-opacity duration-300 ${className}`}
          onLoadingComplete={handleLoadingComplete}
          onError={handleError}
          priority={priority}
          sizes={sizes}
          quality={quality}
          placeholder={placeholder}
          blurDataURL={blurDataURL}
        />
      )}
    </div>
  )
}
