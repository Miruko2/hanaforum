// 全局类型定义文件

// 为Window对象添加自定义属性
interface Window {
  // Capacitor应用接口
  capacitorApp?: {
    restoreSession: () => Promise<boolean>;
    refreshSession: () => Promise<boolean>;
    checkActivity: () => {
      lastActive: Date;
      inactiveMs: number;
      inactiveMin: number;
    };
  };
  
  // HTTPS调试工具
  httpsDebug?: any;
  
  // 应用状态
  appState?: {
    initialized: boolean;
    lastActive: number;
    sessionRestored: boolean;
  };
  
  // 应用数据刷新功能
  appRefresh?: {
    refresh: (force?: boolean) => Promise<boolean>;
    getState: () => any;
    getLogs: () => any[];
  };
  
  // 应用下拉刷新功能
  appPullRefresh?: {
    trigger: () => Promise<void>;
    setEnabled: (enabled: boolean) => void;
  };
  
  // 全局Supabase客户端
  supabase?: any;
  SUPABASE?: any;
} 