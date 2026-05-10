"use client"

import { useState, useRef, ReactNode, useEffect } from "react"
import { motion } from "framer-motion"

interface HoverCardEffectProps {
  children: ReactNode
  className?: string
  intensity?: number
  glareEnabled?: boolean
  glareColor?: string
  perspective?: number
  disabled?: boolean
}

export default function HoverCardEffect({
  children,
  className = "",
  intensity = 15,
  glareEnabled = true,
  glareColor = "rgba(255, 255, 255, 0.25)",
  perspective = 1000,
  disabled = false,
}: HoverCardEffectProps) {
  const [rotateX, setRotateX] = useState(0)
  const [rotateY, setRotateY] = useState(0)
  const [mouseX, setMouseX] = useState(0)
  const [mouseY, setMouseY] = useState(0)
  const [isHovering, setIsHovering] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const [isTouchDevice, setIsTouchDevice] = useState(false)

  // 检测是否为触摸设备
  useEffect(() => {
    setIsTouchDevice(
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      (navigator as any).msMaxTouchPoints > 0
    )
  }, [])

  // 如果是触摸设备或禁用状态，不应用悬浮效果
  if (isTouchDevice || disabled) {
    return <div className={className}>{children}</div>
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    
    // 获取卡片位置
    const rect = cardRef.current.getBoundingClientRect()
    
    // 计算鼠标在卡片内的相对位置 (0 到 1)
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    
    // 设置旋转值 (-intensity/2 到 intensity/2)
    setRotateY((x - 0.5) * intensity)
    setRotateX((0.5 - y) * intensity)
    
    // 保存鼠标位置用于光晕效果
    setMouseX(x)
    setMouseY(y)
  }

  const handleMouseEnter = () => {
    setIsHovering(true)
  }

  const handleMouseLeave = () => {
    setIsHovering(false)
    setRotateX(0)
    setRotateY(0)
  }

  return (
    <motion.div
      ref={cardRef}
      className={`${className} relative overflow-hidden`}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective: `${perspective}px`,
        transformStyle: "preserve-3d",
      }}
      animate={{
        rotateX: rotateX,
        rotateY: rotateY,
        transition: {
          rotateX: { duration: 0.1, ease: "easeOut" },
          rotateY: { duration: 0.1, ease: "easeOut" },
        },
      }}
    >
      {children}
      
      {/* 光晕效果 */}
      {glareEnabled && isHovering && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at ${mouseX * 100}% ${mouseY * 100}%, ${glareColor}, transparent 40%)`,
            opacity: isHovering ? 1 : 0,
            transition: "opacity 300ms ease",
          }}
        />
      )}
    </motion.div>
  )
} 