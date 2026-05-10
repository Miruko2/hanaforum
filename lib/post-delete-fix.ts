/**
 * 帖子删除事件修复
 * 
 * 此文件提供一个独立的删除帖子功能，避免与其他实现冲突
 */

import { supabase } from "./supabaseClient"

/**
 * 帖子删除函数 - 支持Context API或强制刷新
 * @param postId 要删除的帖子ID
 * @param contextDeleteHandler 可选的Context删除处理函数，如果提供则使用Context更新UI
 * @returns 删除是否成功
 */
export async function deletePostWithUIUpdate(
  postId: string, 
  contextDeleteHandler?: (deletedId: string) => void
): Promise<boolean> {
  return new Promise(async (resolve, reject) => {
    try {
      // 删除帖子相关的内容
      await Promise.all([
        supabase.from("comments").delete().eq("post_id", postId),
        supabase.from("likes").delete().eq("post_id", postId)
      ]);
      
      // 删除帖子本身
      const { error } = await supabase.from("posts").delete().eq("id", postId);
      
      if (error) {
        reject(error);
        return;
      }
      
      // 如果提供了Context处理函数，使用它来更新UI
      if (typeof contextDeleteHandler === 'function') {
        // 调用Context处理函数
        contextDeleteHandler(postId);
        
        // 标记删除成功
        resolve(true);
        return;
      }
      
      // 否则回退到页面刷新方式
      const captureAndRefresh = () => {
        // 告诉调用者删除成功
        resolve(true);
        
        // 设置短延迟，确保resolve已被处理
        setTimeout(() => {
          // 保存滚动位置
          try {
            if (typeof window !== 'undefined') {
              const scrollPosition = window.scrollY || document.documentElement.scrollTop;
              sessionStorage.setItem('post_delete_scroll', scrollPosition.toString());
            }
          } catch (e) {
            // 忽略错误
          }
          
          // 强制刷新页面
          if (typeof window !== 'undefined') {
            window.location.reload();
          }
        }, 300);
      };
      
      // 执行刷新操作
      captureAndRefresh();
      
    } catch (error) {
      reject(error);
    }
  });
} 