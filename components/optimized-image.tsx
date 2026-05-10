"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Image from "next/image"
import { ImageOff, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  fill?: boolean
  priority?: boolean
  onLoad?: () => void
  onError?: () => void
  placeholder?: string
  quality?: number
  sizes?: string
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  fill = false,
  priority = false,
  onLoad,
  onError,
  placeholder,
  quality = 75,
  sizes,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isInView, setIsInView] = useState(priority) // 如果是优先级图片，立即加载
  const imgRef = useRef<HTMLDivElement>(null)
  const retryCountRef = useRef(0)
  const maxRetries = 2
  const isMobile = useIsMobile()
  
  // 根据设备类型调整质量
  const adjustedQuality = isMobile ? Math.min(quality, 60) : quality

  // 交叉观察器用于懒加载
  useEffect(() => {
    if (priority || isInView) return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      {
        threshold: 0.1,
        rootMargin: "50px", // 提前50px开始加载
      }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [priority, isInView])

  const handleLoad = useCallback(() => {
    setIsLoading(false)
    setHasError(false)
    retryCountRef.current = 0
    onLoad?.()
  }, [onLoad])

  const handleError = useCallback(() => {
    setIsLoading(false)
    
    // 重试机制
    if (retryCountRef.current < maxRetries) {
      retryCountRef.current++
      setTimeout(() => {
        setIsLoading(true)
        setHasError(false)
      }, 1000 * retryCountRef.current) // 递增延迟
    } else {
      setHasError(true)
      onError?.()
    }
  }, [onError])

  // 确保填充模式或提供尺寸
  const shouldUseFill = fill || (!width && !height)
  const containerStyle = shouldUseFill
    ? { position: "relative" as const, width: "100%", height: "100%" }
    : { width: width || "auto", height: height || "auto" }

  return (
    <div 
      ref={imgRef} 
      className={cn("relative overflow-hidden", className)}
      style={containerStyle}
    >
      {/* 占位符或加载状态 */}
      {(!isInView || isLoading) && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800/60">
          {isLoading && isInView ? (
            <Loader2 className="h-6 w-6 animate-spin text-lime-500" />
          ) : (
            <div className="text-2xl text-gray-400">
              {placeholder || "📷"}
            </div>
          )}
        </div>
      )}

      {/* 错误状态 */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800/60 text-gray-400">
          <ImageOff className="h-6 w-6 mb-2" />
          <span className="text-xs">加载失败</span>
        </div>
      )}

      {/* 实际图片 */}
      {isInView && !hasError && (
        <Image
          src={src}
          alt={alt}
          fill={shouldUseFill}
          width={shouldUseFill ? 0 : (width || 100)}
          height={shouldUseFill ? 0 : (height || 100)}
          priority={priority}
          quality={adjustedQuality}
          sizes={sizes || "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"}
          className={cn(
            "transition-opacity duration-300",
            isLoading ? "opacity-0" : "opacity-100",
            shouldUseFill ? "object-cover" : ""
          )}
          onLoad={handleLoad}
          onError={handleError}
          placeholder={placeholder ? "blur" : "empty"}
          blurDataURL={placeholder}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
        />
      )}
    </div>
  )
}
