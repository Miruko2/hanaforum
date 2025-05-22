import { createBrowserClient } from "@supabase/ssr"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 创建优化的Supabase客户端
export const optimizedSupabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

// 内存缓存
const memoryCache = new Map<string, { data: any; expiry: number }>()

// 优化的查询函数
export async function optimizedQuery<T>(
  queryFn: () => Promise<{ data: T; error: any }>,
  cacheKey: string,
  cacheDuration = 60, // 默认缓存60秒
): Promise<T> {
  // 检查缓存
  const now = Date.now()
  const cachedItem = memoryCache.get(cacheKey)

  if (cachedItem && cachedItem.expiry > now) {
    console.log(`[缓存命中] 使用缓存数据: ${cacheKey}`)
    return cachedItem.data
  }

  // 如果没有缓存或缓存过期，执行查询
  try {
    console.log(`[缓存未命中] 从Supabase获取数据: ${cacheKey}`)
    const { data, error } = await queryFn()

    if (error) {
      console.error(`[查询错误] ${cacheKey}:`, error)
      throw error
    }

    // 更新缓存
    if (data) {
      memoryCache.set(cacheKey, {
        data,
        expiry: now + cacheDuration * 1000,
      })
    }

    return data
  } catch (error) {
    console.error(`[查询异常] ${cacheKey}:`, error)
    throw error
  }
}
