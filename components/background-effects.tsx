"use client"

import { useEffect, useRef, useState } from "react"

export default function BackgroundEffects() {
  const particlesRef = useRef<HTMLDivElement>(null)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    // 检查用户是否偏好减少动画
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    setReducedMotion(prefersReducedMotion)

    // 创建粒子效果，但减少数量并根据偏好禁用
    if (particlesRef.current && !prefersReducedMotion) {
      const container = particlesRef.current
      // 减少粒子数量，从20减少到10
      const particleCount = 10

      // 清除现有粒子
      container.innerHTML = ""

      // 创建新粒子
      for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement("div")
        particle.className = "particle"

        // 随机位置
        particle.style.left = `${Math.random() * 100}%`
        particle.style.top = `${Math.random() * 100}%`

        // 随机大小
        const size = Math.random() * 3 + 1
        particle.style.width = `${size}px`
        particle.style.height = `${size}px`

        // 随机透明度
        particle.style.opacity = `${Math.random() * 0.5}`

        // 随机动画延迟
        particle.style.animationDelay = `${Math.random() * 15}s`

        // 随机动画持续时间，增加持续时间减少重绘频率
        particle.style.animationDuration = `${Math.random() * 15 + 15}s`

        container.appendChild(particle)
      }
    }

    // 添加减少动画偏好的监听器
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    const handleReduceMotion = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches)
    }

    mediaQuery.addEventListener("change", handleReduceMotion)
    return () => {
      mediaQuery.removeEventListener("change", handleReduceMotion)
    }
  }, [])

  // 根据减少动画偏好返回不同的背景效果
  return (
    <>
      <div className="bg-texture"></div>
      {!reducedMotion && <div className="light-effect"></div>}
      {!reducedMotion && <div className="grid-texture"></div>}
      <div ref={particlesRef} className={`particles ${reducedMotion ? "reduced-motion" : ""}`}></div>
    </>
  )
}
