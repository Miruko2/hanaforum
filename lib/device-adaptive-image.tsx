"use client"

import { useState, useEffect } from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import ProgressiveImage from "@/components/progressive-image"

interface AdaptiveImageProps {
  src: string
  alt: string
  className?: string
  width?: number
  height?: number
  aspectRatio?: number
  priority?: boolean
}

export function DeviceAdaptiveImage({
  src,
  alt,
  className,
  width,
  height,
  aspectRatio,
  priority = false,
}: AdaptiveImageProps) {
  const isMobile = useIsMobile()
  const [networkType, setNetworkType] = useState<'slow'|'medium'|'fast'>('fast')
  
  // 检测网络状况
  useEffect(() => {
    const connection = (navigator as any).connection
    if (!connection) return
    
    const updateNetworkInfo = () => {
      if (connection.saveData) {
        setNetworkType('slow')
      } else if (connection.effectiveType === '4g') {
        setNetworkType('fast')
      } else if (connection.effectiveType === '3g') {
        setNetworkType('medium')
      } else {
        setNetworkType('slow')
      }
    }
    
    updateNetworkInfo()
    connection.addEventListener('change', updateNetworkInfo)
    return () => connection.removeEventListener('change', updateNetworkInfo)
  }, [])

  // 根据设备和网络状况选择配置
  const getAdaptiveConfig = () => {
    // 基础配置
    const config = {
      quality: 75,
      blurLevel: 8,
      lowQualityInBackground: false,
      fitMode: 'cover' as 'cover' | 'contain' | 'fill',
      loadingIndicator: 'pulse' as 'pulse' | 'skeleton' | 'spinner' | 'none',
    }
    
    // 移动端配置
    if (isMobile) {
      config.quality = 60
      config.blurLevel = 12
      config.lowQualityInBackground = true
    }
    
    // 根据网络状况进一步调整
    if (networkType === 'slow') {
      config.quality = isMobile ? 50 : 60  // 移动端更激进
      config.lowQualityInBackground = true
      config.loadingIndicator = 'skeleton'
    } else if (networkType === 'medium') {
      config.quality = isMobile ? 60 : 70
    }
    
    return config
  }
  
  const adaptiveConfig = getAdaptiveConfig()
  
  return (
    <ProgressiveImage
      src={src}
      alt={alt}
      className={className}
      width={width}
      height={height}
      aspectRatio={aspectRatio}
      priority={priority}
      quality={adaptiveConfig.quality}
      blurLevel={adaptiveConfig.blurLevel}
      lowQualityInBackground={adaptiveConfig.lowQualityInBackground}
      loadingIndicator={adaptiveConfig.loadingIndicator}
      fitMode={adaptiveConfig.fitMode}
    />
  )
}

// 图像内存缓存实现
const imageCache = new Map<string, string>()

export function CachedAdaptiveImage(props: AdaptiveImageProps) {
  const [cachedSrc, setCachedSrc] = useState<string | null>(null)
  const isMobile = useIsMobile()
  
  useEffect(() => {
    // 不缓存优先级图像
    if (props.priority) {
      return
    }
    
    // 已经缓存过的图像直接使用
    if (imageCache.has(props.src)) {
      setCachedSrc(imageCache.get(props.src) || null)
      return
    }
    
    // 尝试加载并缓存
    const img = new Image()
    img.onload = () => {
      try {
        // 创建低质量版本放入缓存
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        // 移动设备使用更低分辨率
        const scale = isMobile ? 0.4 : 0.6
        
        canvas.width = img.width * scale
        canvas.height = img.height * scale
        
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          // 移动设备使用更低质量
          const quality = isMobile ? 0.5 : 0.7
          const dataUrl = canvas.toDataURL('image/jpeg', quality)
          
          imageCache.set(props.src, dataUrl)
          setCachedSrc(dataUrl)
        }
      } catch (e) {
        console.error("图像处理失败:", e)
      }
    }
    img.src = props.src
  }, [props.src, props.priority, isMobile])
  
  return <DeviceAdaptiveImage {...props} src={cachedSrc || props.src} />
}

// 清理图像缓存的帮助函数
export function clearImageCache() {
  imageCache.clear()
}

// 预加载图像的帮助函数 
export function preloadAndCache(src: string) {
  if (imageCache.has(src)) return Promise.resolve()
  
  return new Promise<void>((resolve) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = () => resolve()
    img.src = src
  })
}

export default DeviceAdaptiveImage 