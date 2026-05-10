/**
 * app-navigation.js - 简单直接的导航库，专为移动端设计
 */

// 检测是否在移动应用环境中
export const isNativeApp = () => {
  if (typeof window === 'undefined') return false;
  return window.location.protocol === 'file:' || 
         !!(window.Capacitor) || 
         /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent);
};

// 获取应用根路径
export const getAppRoot = () => {
  if (!isNativeApp()) return '';
  
  const path = window.location.pathname;
  // 查找最后一个目录分隔符
  const lastSlash = path.lastIndexOf('/');
  if (lastSlash <= 0) return '../';
  
  // 提取到倒数第二个斜杠的部分
  const secondLastSlash = path.lastIndexOf('/', lastSlash - 1);
  if (secondLastSlash <= 0) return '../';
  
  return path.substring(0, secondLastSlash + 1);
};

// 简单直接的页面导航
export const navigateTo = (path, options = {}) => {
  const { replace = false, delay = 0 } = options;
  
  // 使用原生方式直接导航
  const navigate = () => {
    console.log('直接导航到:', path);
    
    // 如果是相对路径且在应用环境中，构建完整路径
    let finalPath = path;
    if (isNativeApp() && !path.startsWith('http')) {
      if (path === '/' || path === '') {
        finalPath = getAppRoot() + 'index.html';
      } else {
        // 移除开头的斜杠
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
        finalPath = getAppRoot() + cleanPath + '/index.html';
      }
    }
    
    // 执行导航
    try {
      if (replace) {
        window.location.replace(finalPath);
      } else {
        window.location.href = finalPath;
      }
    } catch (error) {
      console.error('导航错误:', error);
      // 备用导航方式
      window.location.href = finalPath;
    }
  };
  
  // 应用延迟
  if (delay > 0) {
    setTimeout(navigate, delay);
  } else {
    navigate();
  }
};

// 预定义常用页面的导航
export const AppNavigation = {
  // 主要页面
  home: () => navigateTo('/'),
  login: () => navigateTo('/login'),
  register: () => navigateTo('/register'),
  profile: () => navigateTo('/profile'),
  
  // 带延迟的导航（用于等待消息显示等）
  homeWithDelay: (ms = 500) => navigateTo('/', { delay: ms }),
  loginWithDelay: (ms = 500) => navigateTo('/login', { delay: ms }),
  
  // 重定向（替换历史记录）
  redirectHome: () => navigateTo('/', { replace: true }),
  redirectLogin: () => navigateTo('/login', { replace: true }),
};

// 导出默认对象
export default AppNavigation; 