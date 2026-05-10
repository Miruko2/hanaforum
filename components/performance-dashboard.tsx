"use client"

import { useState, useEffect } from "react"
import { performanceMonitor, type PerformanceMetrics } from "@/lib/performance-monitor"
import { Activity, Clock, Zap, Gauge, Image, Database } from "lucide-react"

interface PerformanceDashboardProps {
  className?: string
}

export default function PerformanceDashboard({ 
  className = ""
}: PerformanceDashboardProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({ resourceLoadTimes: {} })
  const [isVisible, setIsVisible] = useState(false)
  const [isEnabled, setIsEnabled] = useState(false)

  useEffect(() => {
    // 检查性能监控是否启用
    setIsEnabled(performanceMonitor.isEnabled())
    
    // 如果未启用，不需要继续执行
    if (!performanceMonitor.isEnabled()) return
    
    // 初始加载指标
    setMetrics(performanceMonitor.getMetrics())

    // 定期更新指标 - 降低更新频率以减少性能开销
    const interval = setInterval(() => {
      setMetrics(performanceMonitor.getMetrics())
    }, 5000) // 从2000ms增加到5000ms

    return () => clearInterval(interval)
  }, [])

  // 键盘快捷键切换显示
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        setIsVisible(!isVisible)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isVisible])

  const formatTime = (time?: number): string => {
    if (!time) return 'N/A'
    return `${Math.round(time)}ms`
  }

  const getPerformanceGrade = (metric: number, thresholds: number[]): string => {
    if (metric <= thresholds[0]) return 'text-green-500'
    if (metric <= thresholds[1]) return 'text-yellow-500'
    return 'text-red-500'
  }

  // 如果性能监控未启用或不可见，则不渲染任何内容
  if (!isEnabled || !isVisible) return null

  return (
    <div className={`fixed top-4 right-4 z-50 bg-black/90 text-white p-4 rounded-lg border border-lime-500/30 backdrop-blur-sm max-w-xs ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold flex items-center gap-2">
          <Activity className="h-4 w-4 text-lime-500" />
          性能监控
        </h3>
        <button 
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white"
        >
          ×
        </button>
      </div>

      <div className="space-y-3 text-xs">
        {/* Core Web Vitals */}
        <div>
          <h4 className="font-semibold mb-1 text-lime-400">Core Web Vitals</h4>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                LCP:
              </span>
              <span className={getPerformanceGrade(metrics.largestContentfulPaint || 0, [2500, 4000])}>
                {formatTime(metrics.largestContentfulPaint)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                FID:
              </span>
              <span className={getPerformanceGrade(metrics.firstInputDelay || 0, [100, 300])}>
                {formatTime(metrics.firstInputDelay)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="flex items-center gap-1">
                <Gauge className="h-3 w-3" />
                CLS:
              </span>
              <span className={getPerformanceGrade((metrics.cumulativeLayoutShift || 0) * 1000, [100, 250])}>
                {metrics.cumulativeLayoutShift?.toFixed(3) || 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* 加载时间 */}
        <div>
          <h4 className="font-semibold mb-1 text-lime-400">加载时间</h4>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>TTFB:</span>
              <span>{formatTime(metrics.timeToFirstByte)}</span>
            </div>
            <div className="flex justify-between">
              <span>FCP:</span>
              <span>{formatTime(metrics.firstContentfulPaint)}</span>
            </div>
            <div className="flex justify-between">
              <span>DCL:</span>
              <span>{formatTime(metrics.domContentLoaded)}</span>
            </div>
            <div className="flex justify-between">
              <span>Load:</span>
              <span>{formatTime(metrics.loadComplete)}</span>
            </div>
          </div>
        </div>

        {/* 资源加载 - 仅在有数据时显示 */}
        {Object.keys(metrics.resourceLoadTimes).length > 0 && (
          <div>
            <h4 className="font-semibold mb-1 text-lime-400 flex items-center gap-1">
              <Image className="h-3 w-3" />
              资源加载
            </h4>
            <div className="space-y-1 max-h-20 overflow-y-auto">
              {Object.entries(metrics.resourceLoadTimes)
                .sort((a, b) => b[1] - a[1]) // 按加载时间降序排序
                .slice(0, 5) // 只显示最慢的5个
                .map(([resource, time]) => (
                <div key={resource} className="flex justify-between text-xs">
                  <span className="truncate max-w-20" title={resource}>
                    {resource.length > 15 ? `...${resource.slice(-12)}` : resource}
                  </span>
                  <span>{formatTime(time)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-2 pt-2 border-t border-gray-700">
          <button
            onClick={() => performanceMonitor.logMetrics()}
            className="flex-1 bg-lime-500/20 hover:bg-lime-500/30 px-2 py-1 rounded text-xs"
          >
            记录日志
          </button>
          <button
            onClick={() => setMetrics({ resourceLoadTimes: {} })}
            className="flex-1 bg-red-500/20 hover:bg-red-500/30 px-2 py-1 rounded text-xs"
          >
            清除
          </button>
        </div>
      </div>

      {/* 键盘提示 */}
      <div className="mt-2 pt-2 border-t border-gray-700 text-xs text-gray-400">
        按 Ctrl+Shift+P 切换显示
      </div>
    </div>
  )
} 