"use client"

import { useEffect, useState } from "react"

export default function BackgroundEffects() {
  const [reducedMotion, setReducedMotion] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // 检查用户是否偏好减少动画和设备类型
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const isSmallScreen = window.matchMedia("(max-width: 768px)").matches
    
    setReducedMotion(prefersReducedMotion)
    setIsMobile(isSmallScreen)
    
    // 监听屏幕尺寸变化
    const screenMediaQuery = window.matchMedia("(max-width: 768px)")
    const handleScreenChange = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    screenMediaQuery.addEventListener("change", handleScreenChange)
    
    // 添加减少动画偏好的监听器
    const motionMediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    const handleReduceMotion = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches)
    }

    motionMediaQuery.addEventListener("change", handleReduceMotion)
    
    return () => {
      motionMediaQuery.removeEventListener("change", handleReduceMotion)
      screenMediaQuery.removeEventListener("change", handleScreenChange)
    }
  }, [])

  // 不添加额外的背景效果，只返回空的片段
  // 百叶窗效果已在globals.css中处理
  return <></>;
}
