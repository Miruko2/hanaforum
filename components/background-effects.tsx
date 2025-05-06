"use client"

import { useEffect, useRef } from "react"

export default function BackgroundEffects() {
  const particlesRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // 创建粒子效果
    if (particlesRef.current) {
      const container = particlesRef.current
      const particleCount = 20

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

        // 随机动画持续时间
        particle.style.animationDuration = `${Math.random() * 10 + 10}s`

        container.appendChild(particle)
      }
    }
  }, [])

  return (
    <>
      <div className="bg-texture"></div>
      <div className="light-effect"></div>
      <div className="grid-texture"></div>
      <div ref={particlesRef} className="particles"></div>
    </>
  )
}
