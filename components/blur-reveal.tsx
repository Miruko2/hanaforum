"use client"

import { useRef, useEffect, useState } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface BlurRevealProps {
  children: React.ReactNode
  isVisible: boolean
  delay?: number
  className?: string
  skipBlur?: boolean
}

/**
 * 高斯模糊渐入效果组件
 * 当元素从不可见变为可见时，应用高斯模糊渐入动画
 */
const BlurReveal = ({ 
  children, 
  isVisible, 
  delay = 0,
  className,
  skipBlur = false
}: BlurRevealProps) => {
  const [hasAppeared, setHasAppeared] = useState(false)
  const prevVisible = useRef(isVisible)
  
  // 跟踪元素是否已显示过
  useEffect(() => {
    if (isVisible && !prevVisible.current) {
      // 元素首次进入可视区域
      prevVisible.current = true
    } else if (!isVisible && prevVisible.current) {
      // 元素离开可视区域
    }
    
    if (isVisible) {
      const timer = setTimeout(() => {
        setHasAppeared(true)
      }, 1000) // 确保动画完成后标记为已显示
      
      return () => clearTimeout(timer)
    }
  }, [isVisible])

  // 如果跳过模糊效果或已经显示过，不再应用模糊效果
  if (skipBlur || hasAppeared) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={cn(
        "relative overflow-hidden will-change-auto", 
        className
      )}
      initial={{ 
        opacity: 0,
        filter: skipBlur ? "blur(0px)" : "blur(10px)" 
      }}
      animate={{ 
        opacity: isVisible ? 1 : 0,
        filter: isVisible || skipBlur ? "blur(0px)" : "blur(10px)",
        y: isVisible ? 0 : 20
      }}
      transition={{
        opacity: { duration: 0.6, delay },
        filter: { 
          duration: 0.7,
          delay: delay + 0.1,
          ease: "easeOut"
        },
        y: {
          duration: 0.5,
          delay,
          ease: "easeOut"
        }
      }}
    >
      {children}
      
      {/* 模糊叠加层，随内容逐渐消失 */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-b from-transparent to-background/80 backdrop-blur-sm pointer-events-none"
        initial={{ opacity: 0.8 }}
        animate={{ opacity: isVisible ? 0 : 0.8 }}
        transition={{ duration: 0.8, delay: delay + 0.2 }}
      />
    </motion.div>
  )
}

export default BlurReveal 