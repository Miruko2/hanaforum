/**
 * 图像优化工具
 * 提供图像延迟加载、尺寸优化和格式转换功能
 */

// 检测浏览器WebP支持
export function supportsWebP(): boolean {
  if (typeof document === 'undefined') return false;
  
  // 尝试使用Canvas检测WebP支持
  const elem = document.createElement('canvas');
  if (elem.getContext && elem.getContext('2d')) {
    return elem.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }
  
  return false;
}

// 检测浏览器AVIF支持 - 同步检测返回最佳猜测
export function supportsAVIF(): boolean {
  if (typeof window === 'undefined') return false;
  
  // 如果用户代理包含Safari且版本<16，则可能不支持AVIF
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const safariVersion = isSafari ? 
    parseInt(navigator.userAgent.match(/Version\/(\d+)/)?.[1] || '0', 10) : 0;
  
  if (isSafari && safariVersion < 16) {
    return false;
  }
  
  // 检测AVIF支持 - 返回最佳猜测
  return true;
}

// 检测网络状况
export function getNetworkCondition(): 'slow' | 'medium' | 'fast' {
  if (typeof navigator === 'undefined') {
    return 'fast';
  }
  
  // 使用类型断言处理navigator.connection
  const connection = (navigator as any).connection;
  if (!connection) {
    return 'fast';
  }
  
  // 如果开启了省流模式
  if (connection.saveData) {
    return 'slow';
  }
  
  // 根据网络类型判断
  const effectiveType = connection.effectiveType;
  if (!effectiveType || effectiveType === 'slow-2g' || effectiveType === '2g') {
    return 'slow';
  } else if (effectiveType === '3g') {
    return 'medium';
  }
  
  // 检测设备性能 - 使用类型断言
  if (typeof (navigator as any).deviceMemory !== 'undefined' && (navigator as any).deviceMemory < 4) {
    return 'medium'; // 低内存设备降级到中等网速
  }
  
  return 'fast';
}

// 检测设备类型
export function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  
  const width = window.innerWidth;
  
  if (width < 640) {
    return 'mobile';
  } else if (width < 1024) {
    return 'tablet';
  }
  
  return 'desktop';
}

// 根据设备尺寸和网络情况选择最佳图像尺寸
export function getOptimalImageSize(
  originalUrl: string, 
  width?: number, 
  height?: number,
  networkCondition?: 'slow' | 'medium' | 'fast'
): string {
  // 如果没有提供URL或者是SVG格式，则直接返回原始URL
  if (!originalUrl || originalUrl.includes('.svg')) {
    return originalUrl;
  }

  // 检测设备像素比
  const devicePixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  
  // 获取网络连接类型（如果可用）
  const connection = 
    typeof navigator !== 'undefined' && 
    'connection' in navigator ? 
    (navigator as any).connection : null;
  
  // 确定网络状态
  const netCondition = networkCondition || getNetworkCondition();
  
  // 确定设备类型
  const deviceType = getDeviceType();
  
  // 确定是否应该加载较低质量的图像
  const shouldLoadLowQuality = netCondition === 'slow' || (connection && connection.saveData);

  // 计算最佳尺寸
  let optimalWidth = width ? Math.round(width * devicePixelRatio) : undefined;
  let optimalHeight = height ? Math.round(height * devicePixelRatio) : undefined;
  
  // 根据网络状况调整尺寸和质量
  if (shouldLoadLowQuality) {
    optimalWidth = optimalWidth ? Math.round(optimalWidth * 0.6) : undefined;
    optimalHeight = optimalHeight ? Math.round(optimalHeight * 0.6) : undefined;
  } else if (netCondition === 'medium') {
    optimalWidth = optimalWidth ? Math.round(optimalWidth * 0.8) : undefined;
    optimalHeight = optimalHeight ? Math.round(optimalHeight * 0.8) : undefined;
  }
  
  // 如果是移动设备，进一步优化尺寸
  if (deviceType === 'mobile' && optimalWidth && optimalWidth > 640) {
    optimalWidth = 640;
    optimalHeight = undefined; // 移除高度限制，让图像保持原始比例
  }
  
  // 如果URL中已经包含尺寸参数，则尝试替换
  if (originalUrl.includes('width=') || originalUrl.includes('height=')) {
    let modifiedUrl = originalUrl;
    if (optimalWidth && modifiedUrl.includes('width=')) {
      modifiedUrl = modifiedUrl.replace(/width=\d+/g, `width=${optimalWidth}`);
    }
    if (optimalHeight && modifiedUrl.includes('height=')) {
      modifiedUrl = modifiedUrl.replace(/height=\d+/g, `height=${optimalHeight}`);
    }
    
    // 添加质量参数
    if (shouldLoadLowQuality && !modifiedUrl.includes('quality=')) {
      const separator = modifiedUrl.includes('?') ? '&' : '?';
      modifiedUrl += `${separator}quality=60`;
    }
    
    return modifiedUrl;
  }
  
  // 对于Supabase存储的图像，添加尺寸参数
  if (originalUrl.includes('storage.googleapis.com') || originalUrl.includes('supabase')) {
    const separator = originalUrl.includes('?') ? '&' : '?';
    const params = [];
    
    if (optimalWidth) {
      params.push(`width=${optimalWidth}`);
    }
    if (optimalHeight) {
      params.push(`height=${optimalHeight}`);
    }
    
    // 添加质量参数
    if (shouldLoadLowQuality) {
      params.push('quality=60');
    } else if (netCondition === 'medium') {
      params.push('quality=75');
    }
    
    // 添加格式参数 - WebP或AVIF (如果浏览器支持)
    if (supportsAVIF()) {
      params.push('format=avif');
    } else if (supportsWebP()) {
      params.push('format=webp');
    }
    
    if (params.length > 0) {
      return `${originalUrl}${separator}${params.join('&')}`;
    }
  }
  
  // 对于其他图像，尝试添加宽度参数
  if (optimalWidth && !originalUrl.includes('?')) {
    return `${originalUrl}?w=${optimalWidth}${shouldLoadLowQuality ? '&q=60' : ''}`;
  }
  
  return originalUrl;
}

// 图像延迟加载优化函数
export function setupImageLazyLoading(selector = 'img.lazy-image', rootMargin = '300px') {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return;
  }
  
  const lazyImageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const lazyImage = entry.target as HTMLImageElement;
        if (lazyImage.dataset.src) {
          // 获取网络状况
          const networkCondition = getNetworkCondition();
          // 获取设备类型
          const deviceType = getDeviceType();
          
          // 根据网络状况和设备类型处理图片URL
          const optimizedSrc = getOptimalImageSize(
            lazyImage.dataset.src,
            lazyImage.width,
            lazyImage.height,
            networkCondition
          );
          
          // 如果是移动设备且网络较慢，先设置为低质量占位图
          if (deviceType === 'mobile' && networkCondition === 'slow') {
            // 添加加载中动画
            lazyImage.classList.add('low-data-image', 'loading');
            
            // 先加载低质量图片
            const tempImg = new Image();
            tempImg.onload = () => {
              // 低质量图片加载完成后，加载高质量图片
              lazyImage.src = optimizedSrc;
              
              // 高质量图片加载完成时移除加载中状态
              lazyImage.onload = () => {
                lazyImage.classList.remove('loading');
                
                // 渐变显示
                lazyImage.style.opacity = '1';
              };
            };
            
            // 加载低质量预览图
            tempImg.src = `${lazyImage.dataset.src}?width=30&quality=30&blur=10`;
            lazyImage.src = tempImg.src;
          } else {
            // 正常网络情况下直接加载优化图片
            lazyImage.src = optimizedSrc;
            
            // 开始加载后添加过渡效果
            lazyImage.style.opacity = '0';
            lazyImage.onload = () => {
              lazyImage.style.transition = 'opacity 0.3s ease-in-out';
              lazyImage.style.opacity = '1';
            };
          }
          
          delete lazyImage.dataset.src;
          lazyImage.classList.remove('lazy-image');
        }
        lazyImageObserver.unobserve(lazyImage);
      }
    });
  }, {
    rootMargin: rootMargin,
    threshold: 0.01
  });
  
  // 观察所有带有指定选择器的图像
  document.querySelectorAll(selector).forEach(img => {
    lazyImageObserver.observe(img);
  });
  
  return lazyImageObserver;
}

// 图像预加载函数
export function preloadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// 在客户端初始化懒加载
if (typeof window !== 'undefined') {
  // 页面加载完成后设置懒加载
  window.addEventListener('load', () => {
    setupImageLazyLoading();
  });
  
  // 页面大小变化时重新设置
  window.addEventListener('resize', () => {
    setupImageLazyLoading();
  });
} 