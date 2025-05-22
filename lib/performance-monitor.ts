"use client"

export interface PerformanceMetrics {
  timeToFirstByte?: number
  firstContentfulPaint?: number
  largestContentfulPaint?: number
  firstInputDelay?: number
  cumulativeLayoutShift?: number
  timeToInteractive?: number
  domContentLoaded?: number
  loadComplete?: number
  resourceLoadTimes: Record<string, number>
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    resourceLoadTimes: {},
  }
  private enabled = false
  private observer: PerformanceObserver | null = null

  constructor() {
    // 只在客户端初始化
    if (typeof window !== "undefined") {
      this.enabled = true
      this.initObservers()
    }
  }

  private initObservers() {
    if (!this.enabled || !window.PerformanceObserver) return

    try {
      // 监控关键性能指标
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()
        const lastEntry = entries[entries.length - 1]
        this.metrics.largestContentfulPaint = lastEntry.startTime
      })
      lcpObserver.observe({ type: "largest-contentful-paint", buffered: true })

      // 监控布局偏移
      const clsObserver = new PerformanceObserver((entryList) => {
        let clsValue = 0
        for (const entry of entryList.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value
          }
        }
        this.metrics.cumulativeLayoutShift = clsValue
      })
      clsObserver.observe({ type: "layout-shift", buffered: true })

      // 监控首次输入延迟
      const fidObserver = new PerformanceObserver((entryList) => {
        const firstInput = entryList.getEntries()[0]
        this.metrics.firstInputDelay = (firstInput as any).processingStart - firstInput.startTime
      })
      fidObserver.observe({ type: "first-input", buffered: true })

      // 监控资源加载时间
      const resourceObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (entry.entryType === "resource") {
            const resource = entry as PerformanceResourceTiming
            const url = resource.name.split("/").pop() || resource.name
            this.metrics.resourceLoadTimes[url] = resource.duration
          }
        }
      })
      resourceObserver.observe({ type: "resource", buffered: true })

      // 保存观察器引用以便清理
      this.observer = resourceObserver

      // 记录基本指标
      window.addEventListener("load", () => {
        setTimeout(() => {
          const navEntry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming
          if (navEntry) {
            this.metrics.timeToFirstByte = navEntry.responseStart
            this.metrics.domContentLoaded = navEntry.domContentLoadedEventEnd
            this.metrics.loadComplete = navEntry.loadEventEnd
          }

          const paintEntries = performance.getEntriesByType("paint")
          for (const entry of paintEntries) {
            if (entry.name === "first-contentful-paint") {
              this.metrics.firstContentfulPaint = entry.startTime
            }
          }

          console.log("Performance metrics:", this.metrics)
        }, 1000)
      })
    } catch (e) {
      console.error("Failed to initialize performance observers:", e)
    }
  }

  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  public logMetrics() {
    if (!this.enabled) return
    console.table(this.metrics)
  }

  public trackImageLoad(imageId: string, startTime: number) {
    if (!this.enabled) return
    const endTime = performance.now()
    const duration = endTime - startTime
    this.metrics.resourceLoadTimes[`img_${imageId}`] = duration
  }

  public cleanup() {
    if (this.observer) {
      this.observer.disconnect()
    }
  }
}

// 创建单例实例
export const performanceMonitor = new PerformanceMonitor()

// 添加到窗口对象以便在控制台访问
if (typeof window !== "undefined") {
  ;(window as any).performanceMonitor = performanceMonitor
}
