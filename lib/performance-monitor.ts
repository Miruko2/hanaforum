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
  private isProduction = process.env.NODE_ENV === 'production'
  private isMonitoringEnabled = false
  private isMobile = false
  private isInitialized = false

  constructor() {
    // 只在客户端初始化，且不在生产环境中启用完整监控
    if (typeof window !== "undefined") {
      // 默认在开发环境启用，生产环境禁用
      this.enabled = !this.isProduction
      
      // 检查URL参数是否强制启用性能监控
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        this.isMonitoringEnabled = urlParams.has('perf_monitor');
        
        // 检测是否为移动设备
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(window.navigator.userAgent);
        
        // 如果是移动端且没有强制启用监控，则禁用性能监控
        if (this.isMobile && !this.isMonitoringEnabled) {
          this.enabled = false;
        } else if (this.isMonitoringEnabled) {
          // 如果URL中包含perf_monitor参数，则覆盖默认设置
          this.enabled = true;
        }
      }
    }
  }

  // 延迟初始化方法，减少启动时的资源占用
  public initialize() {
    if (this.isInitialized || !this.enabled || typeof window === "undefined") return;
    
    this.isInitialized = true;
    this.initObservers();
  }

  private initObservers() {
    if (!this.enabled || !window.PerformanceObserver) return

    try {
      // 监控关键性能指标 - 只在非移动端或明确启用监控时收集
      if (!this.isMobile || this.isMonitoringEnabled) {
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
      }

      // 监控资源加载时间 - 仅在明确启用监控时收集详细资源信息
      if (this.isMonitoringEnabled) {
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
      }

      // 记录基本指标 - 仅在非移动端或明确启用监控时执行
      if (!this.isMobile || this.isMonitoringEnabled) {
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
          }, 1000)
        })
      }
    } catch (e) {
      // 静默处理错误，不影响用户体验
    }
  }

  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  public logMetrics() {
    if (!this.enabled) return
    // 使用console.info减少控制台干扰
    console.info(this.metrics)
  }

  public trackImageLoad(imageId: string, startTime: number) {
    if (!this.enabled || this.isMobile) return
    
    // 确保性能监控已初始化
    if (!this.isInitialized) {
      this.initialize();
    }
    
    const endTime = performance.now()
    const duration = endTime - startTime
    this.metrics.resourceLoadTimes[`img_${imageId}`] = duration
  }

  public cleanup() {
    if (this.observer) {
      this.observer.disconnect()
      this.observer = null
    }
  }
  
  // 新增方法：检查是否启用了性能监控
  public isEnabled(): boolean {
    return this.enabled;
  }
  
  // 判断是否为移动设备
  public isMobileDevice(): boolean {
    return this.isMobile;
  }
}

// 创建单例实例
export const performanceMonitor = new PerformanceMonitor()

// 添加到窗口对象以便在控制台访问，但仅在非生产环境或明确启用时
if (typeof window !== "undefined" && (process.env.NODE_ENV !== 'production' || new URLSearchParams(window.location.search).has('perf_monitor'))) {
  ;(window as any).performanceMonitor = performanceMonitor
}
