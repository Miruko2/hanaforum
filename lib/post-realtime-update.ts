/**
 * 实时帖子更新工具
 * 
 * 这个文件提供了辅助函数来处理实时帖子更新，
 * 解决新帖子创建后不能立即显示的问题。
 */

import { Post } from "./types";

/**
 * 全局状态存储 - 仅用于内部
 */
const _state = {
  pendingPosts: new Map<string, Post>(),
  listeners: new Set<Function>()
};

/**
 * 添加新创建的帖子到队列
 * @param post 新创建的帖子
 */
export function queueNewPost(post: Post): void {
  if (!post || !post.id) return;
  
  // 添加到等待队列
  _state.pendingPosts.set(post.id, post);
  
  // 通知所有监听器
  notifyListeners();
}

/**
 * 从队列中移除帖子（当帖子被删除时）
 * @param postId 要移除的帖子ID
 */
export function removePostFromQueue(postId: string): void {
  if (!postId) return;
  
  try {
    // 检查帖子是否在队列中
    if (_state.pendingPosts.has(postId)) {
      // 从队列中删除
      _state.pendingPosts.delete(postId);
      
      // 通知监听器（传递空数组表示刷新）
      notifyListeners();
    }
    
    // 无论帖子是否在队列中，都让监听器刷新一次
    // 这可以确保帖子在UI中正确显示
    notifyListeners();
  } catch (error) {
    // 忽略错误，避免影响用户体验
  }
}

/**
 * 通知所有监听器
 */
function notifyListeners(): void {
  const posts = Array.from(_state.pendingPosts.values());
  _state.listeners.forEach(listener => {
    try {
      listener(posts);
    } catch (e) {
      // 静默处理错误
    }
  });
}

/**
 * 订阅实时帖子更新
 * @param callback 当有新帖子时调用的回调函数
 * @returns 取消订阅的函数
 */
export function subscribeToNewPosts(callback: (posts: Post[]) => void): () => void {
  if (!callback) return () => {};
  
  // 添加到监听器列表
  _state.listeners.add(callback);
  
  // 如果已有等待的帖子，立即通知
  if (_state.pendingPosts.size > 0) {
    const posts = Array.from(_state.pendingPosts.values());
    setTimeout(() => callback(posts), 0);
  }
  
  // 返回取消订阅的函数
  return () => {
    _state.listeners.delete(callback);
  };
}

/**
 * 设置帖子已被处理
 * 当帖子已经显示在UI中后调用
 * @param postId 帖子ID
 */
export function markPostProcessed(postId: string): void {
  if (_state.pendingPosts.has(postId)) {
    _state.pendingPosts.delete(postId);
  }
}

/**
 * 清除所有等待的帖子
 */
export function clearPendingPosts(): void {
  _state.pendingPosts.clear();
}

/**
 * 初始化帖子实时更新系统
 * 设置全局事件监听
 */
export function initPostRealtimeSystem(): () => void {
  if (typeof window === 'undefined') return () => {};
  
  // 监听原始postCreated事件
  const handlePostCreated = (event: CustomEvent) => {
    const post = event.detail?.post;
    if (post) {
      queueNewPost(post);
    }
  };
  
  // 监听帖子删除事件
  const handlePostDeleted = (event: CustomEvent) => {
    const postId = event.detail?.postId;
    if (postId) {
      // 从队列中移除被删除的帖子
      removePostFromQueue(postId);
    }
  };
  
  // 添加事件监听器
  window.addEventListener('postCreated' as any, handlePostCreated as any);
  window.addEventListener('postDeleted' as any, handlePostDeleted as any);
  
  // 返回清理函数
  return () => {
    window.removeEventListener('postCreated' as any, handlePostCreated as any);
    window.removeEventListener('postDeleted' as any, handlePostDeleted as any);
  };
} 