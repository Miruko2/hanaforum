"use client"

import { useState, useEffect, useRef } from "react"
import { getOptimalImageSize, supportsWebP } from "@/lib/image-optimization"

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  onLoad?: () => void
  style?: React.CSSProperties
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = "",
  priority = false,
  onLoad,
  style = {},
}: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const imageRef = useRef<HTMLImageElement>(null)
  const [supportsWebPFormat, setSupportsWebPFormat] = useState(false)
  const [optimizedSrc, setOptimizedSrc] = useState(src)

  // 检测WebP支持
  useEffect(() => {
    setSupportsWebPFormat(supportsWebP())
  }, [])

  // 优化图片源
  useEffect(() => {
    if (!src) return

    // 获取优化后的图片URL
    const optimalSrc = getOptimalImageSize(src, width, height)
    
    // 如果支持WebP并且原始URL不是WebP，尝试转换为WebP格式
    if (supportsWebPFormat && !src.includes('.webp') && 
        (src.includes('.jpg') || src.includes('.jpeg') || src.includes('.png'))) {
      // 如果URL已经包含查询参数
      if (optimalSrc.includes('?')) {
        setOptimizedSrc(`${optimalSrc}&format=webp`)
      } else {
        setOptimizedSrc(`${optimalSrc}?format=webp`)
      }
    } else {
      setOptimizedSrc(optimalSrc)
    }
  }, [src, width, height, supportsWebPFormat])

  // 处理图片加载完成事件
  const handleLoad = () => {
    setLoaded(true)
    if (onLoad) onLoad()
  }

  // 处理图片加载失败事件
  const handleError = () => {
    setError(true)
    // 如果优化的URL加载失败，回退到原始URL
    if (optimizedSrc !== src) {
      setOptimizedSrc(src)
    }
  }

  // 使用IntersectionObserver实现懒加载
  useEffect(() => {
    if (!imageRef.current || priority) return

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement
          if (img.dataset.src) {
            img.src = img.dataset.src
            delete img.dataset.src
          }
          observer.unobserve(img)
        }
      })
    })

    observer.observe(imageRef.current)

    return () => {
      if (imageRef.current) observer.unobserve(imageRef.current)
    }
  }, [priority])

  return (
    <div 
      className={`relative ${className}`} 
      style={{ 
        width: width ? `${width}px` : 'auto', 
        height: height ? `${height}px` : 'auto',
        ...style
      }}
    >
      {/* 加载中的占位符 */}
      {!loaded && !error && (
        <div 
          className="absolute inset-0 bg-gray-800/20 animate-pulse rounded"
          style={{ 
            width: width ? `${width}px` : '100%', 
            height: height ? `${height}px` : '100%' 
          }}
        />
      )}
      
      {/* 图片元素 */}
      <img
        ref={imageRef}
        src={priority ? optimizedSrc : undefined}
        data-src={!priority ? optimizedSrc : undefined}
        alt={alt}
        className={`${!loaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300 ${error ? 'hidden' : ''}`}
        onLoad={handleLoad}
        onError={handleError}
        width={width}
        height={height}
        loading={priority ? "eager" : "lazy"}
        style={{ 
          objectFit: 'cover',
          width: width ? `${width}px` : '100%', 
          height: height ? `${height}px` : 'auto' 
        }}
      />
      
      {/* 错误占位符 */}
      {error && (
        <div 
          className="flex items-center justify-center bg-gray-800/30 rounded text-gray-400 text-xs"
          style={{ 
            width: width ? `${width}px` : '100%', 
            height: height ? `${height}px` : '200px' 
          }}
        >
          图片加载失败
        </div>
      )}
    </div>
  )
} 