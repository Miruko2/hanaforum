import { supabase } from "./supabaseClient"
import { getUserNotifications, smartClearCache } from "./supabase"

/**
 * 使用 Supabase Realtime 实现实时通知订阅
 * 
 * @param userId 用户ID
 * @param callback 回调函数，接收通知列表作为参数
 * @returns 取消订阅的函数
 */
export function subscribeToNotificationsRealtime(userId: string, callback: (notifications: any[]) => void) {
  // 防抖更新函数，避免频繁重新获取
  let updateTimeout: NodeJS.Timeout | null = null;
  let lastFetchTime = 0;
  const DEBOUNCE_DELAY = 500; // 增加到500毫秒，减少频繁调用
  const MIN_FETCH_INTERVAL = 5000; // 增加到5秒，降低服务器负载
  
  // 缓存最后一次获取的通知，避免重复回调
  let lastNotificationsHash = '';
  
  const fetchAndUpdateNotifications = async (force = false) => {
    try {
      const now = Date.now();
      
      // 如果非强制模式且时间间隔太短，则跳过
      if (!force && (now - lastFetchTime < MIN_FETCH_INTERVAL)) {
        return;
      }
      
      lastFetchTime = now;
      
      // 使用智能缓存清理，只清理通知相关缓存
      try {
        smartClearCache('profile');
      } catch (e) {
        // 忽略错误
      }
      
      const { notifications } = await getUserNotifications(userId);
      
      // 计算简单哈希值以检测变化
      const newHash = computeNotificationsHash(notifications);
      if (newHash !== lastNotificationsHash || force) {
        // 只有当通知有变化或强制更新时才回调
        lastNotificationsHash = newHash;
        callback(notifications);
      }
    } catch (err) {
      console.error('获取通知失败:', err);
    }
  };
  
  // 计算通知列表的简单哈希值
  const computeNotificationsHash = (notifications: any[]): string => {
    if (!notifications || !notifications.length) return '';
    
    return notifications.map(n => `${n.id}:${n.is_read}`).join('|');
  };
  
  // 防抖处理函数，将多个更新合并成一次
  const debouncedUpdate = () => {
    if (updateTimeout) {
      clearTimeout(updateTimeout);
    }
    
    updateTimeout = setTimeout(async () => {
      await fetchAndUpdateNotifications();
    }, DEBOUNCE_DELAY);
  };
  
  // 初始加载数据
  fetchAndUpdateNotifications(true);
  
  // 订阅成功/失败回调
  const handleSubscriptionChange = (status: string) => {
    // 如果订阅失败，回退到初始加载
    if (status !== 'SUBSCRIBED') {
      fetchAndUpdateNotifications(true);
    }
  };
  
  // 创建实时订阅
  const subscription = supabase
    .channel(`notifications-${userId}`)
    .on(
      "postgres_changes",
      {
        event: "*", // 监听所有事件类型（插入、更新、删除）
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`, // 只订阅当前用户的通知
      },
      debouncedUpdate
    )
    .subscribe(handleSubscriptionChange);
  
  // 返回取消订阅的函数
  return () => {
    if (updateTimeout) {
      clearTimeout(updateTimeout);
    }
    subscription.unsubscribe();
  };
} 