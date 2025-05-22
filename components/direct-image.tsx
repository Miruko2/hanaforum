"use client"

import type React from "react"

import { useState } from "react"
import { cn } from "@/lib/utils"

interface DirectImageProps {
  src: string
  alt: string
  width?: number | string
  height?: number | string
  className?: string
  fallbackSrc?: string
  aspectRatio?: number
}

export default function DirectImage({
  src,
  alt,
  width,
  height,
  className = "",
  fallbackSrc = "/system-error-screen.png",
  aspectRatio,
}: DirectImageProps) {
  const [error, setError] = useState(false)
  const [loaded, setLoaded] = useState(false)

  // 处理图片加载错误
  const handleError = () => {
    console.error("图片加载失败:", src)
    setError(true)
  }

  // 处理图片加载完成
  const handleLoad = () => {
    setLoaded(true)
  }

  // 计算样式
  const containerStyle: React.CSSProperties = {
    width: width ? (typeof width === "number" ? `${width}px` : width) : "100%",
    height: height ? (typeof height === "number" ? `${height}px` : height) : "auto",
    aspectRatio: aspectRatio ? `${aspectRatio}` : undefined,
    position: "relative",
  }

  return (
    <div style={containerStyle} className={cn("overflow-hidden", className)}>
      {/* 加载骨架屏 */}
      {!loaded && !error && <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-md" />}

      {/* 图片 */}
      <img
        src={error ? fallbackSrc : src}
        alt={alt}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-300",
          loaded && !error ? "opacity-100" : "opacity-0",
          error && "opacity-100",
        )}
        onError={handleError}
        onLoad={handleLoad}
        loading="lazy"
      />

      {/* 错误状态 */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800/50 text-white text-sm">
          <span className="px-2 py-1 bg-black/50 rounded">图片加载失败</span>
        </div>
      )}
    </div>
  )
}
