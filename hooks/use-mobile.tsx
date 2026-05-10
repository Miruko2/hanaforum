import { useState, useEffect, useCallback, useMemo } from "react"

// 定义断点类型
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

// 断点值（像素）
export const BREAKPOINTS = {
  xs: 0,     // 额外小屏幕
  sm: 640,   // 小屏幕（手机）
  md: 768,   // 中等屏幕（平板竖屏）
  lg: 1024,  // 大屏幕（平板横屏/小笔记本）
  xl: 1280,  // 特大屏幕（笔记本/桌面）
  '2xl': 1536, // 超大屏幕
};

// 设备类型
export type DeviceType = 'mobile' | 'tablet' | 'desktop';

/**
 * 检测是否为移动设备视图
 * @returns 当前视图是否为移动设备大小
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined)

  const checkMobile = useCallback(() => {
    setIsMobile(window.innerWidth < BREAKPOINTS.md)
  }, [])

  useEffect(() => {
    // 初始检测
    checkMobile()

    // 使用matchMedia API获得更好的性能
    const mediaQuery = window.matchMedia(`(max-width: ${BREAKPOINTS.md - 1}px)`)
    
    const handleChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches)
    }

    // 添加监听器
    mediaQuery.addEventListener("change", handleChange)
    
    // 设置初始值
    setIsMobile(mediaQuery.matches)

    return () => {
      mediaQuery.removeEventListener("change", handleChange)
    }
  }, [checkMobile])

  return !!isMobile
}

/**
 * 获取当前视图断点
 * @returns 当前视图的断点名称
 */
export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('lg')
  
  useEffect(() => {
    // 根据窗口宽度设置断点
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      
      if (width < BREAKPOINTS.sm) {
        setBreakpoint('xs');
      } else if (width < BREAKPOINTS.md) {
        setBreakpoint('sm');
      } else if (width < BREAKPOINTS.lg) {
        setBreakpoint('md');
      } else if (width < BREAKPOINTS.xl) {
        setBreakpoint('lg');
      } else if (width < BREAKPOINTS['2xl']) {
        setBreakpoint('xl');
      } else {
        setBreakpoint('2xl');
      }
    };
    
    // 初始化设置
    updateBreakpoint();
    
    // 使用ResizeObserver而不是resize事件以获得更好的性能
    if (typeof ResizeObserver !== 'undefined') {
      const resizeObserver = new ResizeObserver(() => {
        updateBreakpoint();
      });
      
      resizeObserver.observe(document.body);
      
      return () => {
        resizeObserver.disconnect();
      };
    } else {
      // 降级使用resize事件
      window.addEventListener('resize', updateBreakpoint);
      return () => {
        window.removeEventListener('resize', updateBreakpoint);
      };
    }
  }, []);
  
  return breakpoint;
}

/**
 * 检测设备类型（移动设备、平板或桌面）
 * @returns 当前设备类型
 */
export function useDeviceType(): DeviceType {
  const breakpoint = useBreakpoint();
  
  // 根据断点确定设备类型
  return useMemo(() => {
    if (breakpoint === 'xs' || breakpoint === 'sm') {
      return 'mobile';
    } else if (breakpoint === 'md' || breakpoint === 'lg') {
      return 'tablet';
    } else {
      return 'desktop';
    }
  }, [breakpoint]);
}

/**
 * 获取设备方向
 * @returns 当前设备方向（横屏/竖屏）
 */
export function useOrientation(): 'portrait' | 'landscape' {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(
    typeof window !== 'undefined' && window.innerHeight > window.innerWidth 
      ? 'portrait' 
      : 'landscape'
  );
  
  useEffect(() => {
    const handleOrientationChange = () => {
      if (window.innerHeight > window.innerWidth) {
        setOrientation('portrait');
      } else {
        setOrientation('landscape');
      }
    };
    
    // 检测是否支持orientationchange事件
    const orientationEvent = 'onorientationchange' in window ? 'orientationchange' : 'resize';
    
    window.addEventListener(orientationEvent, handleOrientationChange);
    
    return () => {
      window.removeEventListener(orientationEvent, handleOrientationChange);
    };
  }, []);
  
  return orientation;
}

/**
 * 检测是否为原生移动应用环境（如在Capacitor/Cordova中运行）
 */
export function useIsNativeApp() {
  const [isNativeApp, setIsNativeApp] = useState<boolean>(false);
  
  useEffect(() => {
    // 检测是否在原生应用环境中
    const checkNativeApp = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      
      // 通过window对象安全地检测框架对象是否存在
      const isCapacitor = typeof window !== 'undefined' && 'Capacitor' in window;
      const isCordova = typeof window !== 'undefined' && 'cordova' in window;
      
      // 通过用户代理字符串检测
      const isCapacitorNative = userAgent.includes('capacitor');
      const isCordovaNative = userAgent.includes('cordova');
      
      // 其他常见移动应用webview检测
      const isIonicWebView = userAgent.includes('ionic');
      const isNativeWebView = 
        isCapacitor || 
        isCordova || 
        isCapacitorNative || 
        isCordovaNative || 
        isIonicWebView;
      
      setIsNativeApp(isNativeWebView);
    };
    
    if (typeof window !== 'undefined') {
      checkNativeApp();
    }
  }, []);
  
  return isNativeApp;
}

/**
 * 综合设备信息
 * @returns 包含所有设备相关信息的对象
 */
export function useDeviceInfo() {
  const isMobile = useIsMobile();
  const breakpoint = useBreakpoint();
  const deviceType = useDeviceType();
  const orientation = useOrientation();
  const isNativeApp = useIsNativeApp();
  
  // 检测触控设备
  const [hasTouchScreen, setHasTouchScreen] = useState<boolean | undefined>(undefined);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 检测触摸屏支持的多种方法
      const isTouchDevice = 
        ('ontouchstart' in window) || 
        (navigator.maxTouchPoints > 0) || 
        ((navigator as any).msMaxTouchPoints > 0);
      
      setHasTouchScreen(isTouchDevice);
    }
  }, []);
  
  return {
    isMobile,
    breakpoint,
    deviceType,
    orientation,
    isNativeApp,
    hasTouchScreen,
    screenWidth: typeof window !== 'undefined' ? window.innerWidth : undefined,
    screenHeight: typeof window !== 'undefined' ? window.innerHeight : undefined,
    pixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : undefined,
  };
}
