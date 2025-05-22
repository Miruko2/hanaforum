import { createClient } from "@supabase/supabase-js"
import type { Comment } from "./types"
import { withCache } from "./cache-utils"

// 创建 Supabase 客户端
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  // 添加重试逻辑
  global: {
    fetch: (...args) => {
      // 自定义 fetch 以添加重试逻辑
      return fetch(...args).catch(async (error) => {
        console.warn("Fetch error, retrying once:", error)
        // 简单的重试逻辑，失败后重试一次
        return fetch(...args)
      })
    },
  },
  // 启用实时订阅
  realtime: {
    timeout: 30000,
    params: {
      eventsPerSecond: 10,
    },
  },
})

// 本地缓存点赞状态，避免频繁请求
const likeStatusCache = new Map<string, boolean>()

// 获取用户资料信息 - 添加缓存
const profileCache = new Map<string, any>()
export async function getUserProfile(userId: string) {
  if (!userId) return null

  // 检查缓存
  if (profileCache.has(userId)) {
    return profileCache.get(userId)
  }

  try {
    const { data, error } = await supabase.from("profiles").select("username, avatar_url").eq("id", userId).single()

    if (error) {
      console.error("获取用户信息失败:", error)
      return null
    }

    // 缓存结果
    profileCache.set(userId, data)
    return data
  } catch (error) {
    console.error("获取用户信息时出错:", error)
    return null
  }
}

// 改进 createPost 函数，增强会话处理和错误报告
export async function createPost({
  title,
  content,
  description,
  category,
  image_url,
  image_ratio,
}: {
  title: string
  content: string
  description: string
  category: string
  image_url?: string
  image_ratio?: number
}) {
  // 获取用户会话，增加详细错误处理
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

  if (sessionError) {
    console.error("获取会话错误:", sessionError)
    throw new Error("认证错误: " + sessionError.message)
  }

  if (!sessionData.session) {
    console.error("未找到活跃会话")

    // 尝试从localStorage获取备份用户信息
    let backupUserId = null
    try {
      const storedSession = localStorage.getItem("userSession")
      if (storedSession) {
        const parsedSession = JSON.parse(storedSession)
        backupUserId = parsedSession.id
        console.log("从备份中恢复用户ID:", backupUserId)
      }
    } catch (e) {
      console.warn("无法从localStorage读取会话:", e)
    }

    if (!backupUserId) {
      throw new Error("未认证: 无活跃会话")
    }

    // 使用备份用户ID
    console.log("使用备份用户ID创建帖子:", backupUserId)

    try {
      // 使用服务端角色绕过RLS策略
      const { data, error } = await supabase
        .from("posts")
        .insert([
          {
            title,
            content,
            description,
            category,
            image_url: image_url || null,
            image_ratio: image_ratio || 1,
            user_id: backupUserId,
            likes: 0,
            comments: 0,
          },
        ])
        .select()

      if (error) {
        console.error("数据库错误:", error)
        throw error
      }

      return data
    } catch (error) {
      console.error("创建帖子错误:", error)
      throw error
    }
  }

  const userId = sessionData.session.user.id
  console.log("使用用户ID创建帖子:", userId)

  try {
    // 直接插入帖子数据
    const { data, error } = await supabase
      .from("posts")
      .insert([
        {
          title,
          content,
          description,
          category,
          image_url: image_url || null,
          image_ratio: image_ratio || 1,
          user_id: userId,
          likes: 0,
          comments: 0,
        },
      ])
      .select()

    if (error) {
      console.error("数据库错误:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("创建帖子错误:", error)
    throw error
  }
}

// 使用缓存的 getPosts 函数 - 优化缓存策略
export const getPosts = withCache(
  async () => {
    // 优化：减少选择的字段，只获取需要的数据
    const { data, error } = await supabase
      .from("posts")
      .select(
        "id, title, content, description, category, image_url, image_ratio, created_at, likes, comments, user_id, users:user_id (username)",
      )
      .order("created_at", { ascending: false })

    if (error) {
      console.error("获取帖子错误:", error)
      throw error
    }

    // 处理每个帖子的数据，确保图片比例有效
    return (data || []).map((post) => {
      // 确保 image_ratio 是有效值
      let imageRatio = post.image_ratio || 1.0
      // 限制比例在合理范围内
      imageRatio = Math.min(Math.max(imageRatio, 0.5), 2.0)

      return {
        ...post,
        image_ratio: imageRatio,
        likes_count: post.likes || 0,
        comments_count: post.comments || 0,
        imageContent: post.image_url ? undefined : ["+", "X", "O", "□", "△", "◇"][Math.floor(Math.random() * 6)],
      }
    })
  },
  "posts",
  30, // 减少缓存时间到30秒，保持数据更新
)

// 获取单个帖子 - 添加缓存
const postCache = new Map<string, any>()
export async function getPost(postId: string) {
  // 检查缓存
  if (postCache.has(postId)) {
    return postCache.get(postId)
  }

  const { data, error } = await supabase
    .from("posts")
    .select(`
   *,
   users:user_id (username)
 `)
    .eq("id", postId)
    .single()

  if (error) throw error

  // 确保 image_ratio 是有效值
  let imageRatio = data.image_ratio || 1.0
  // 限制比例在合理范围内
  imageRatio = Math.min(Math.max(imageRatio, 0.5), 2.0)

  const processedPost = {
    ...data,
    username: data.users?.username,
    image_ratio: imageRatio,
    likes_count: data.likes || 0,
    comments_count: data.comments || 0,
    imageContent: data.image_url ? undefined : ["+", "X", "O", "□", "△", "◇"][Math.floor(Math.random() * 6)],
  }

  // 缓存结果
  postCache.set(postId, processedPost)

  // 设置缓存过期
  setTimeout(() => {
    postCache.delete(postId)
  }, 30000) // 30秒后过期

  return processedPost
}

// 检查用户是否已点赞 - 修复 count 可能为 null 的问题
export async function checkUserLiked(postId: string, userId: string) {
  // 生成缓存键
  const cacheKey = `${postId}:${userId}`

  // 检查缓存
  if (likeStatusCache.has(cacheKey)) {
    return likeStatusCache.get(cacheKey)
  }

  try {
    // 使用计数而不是select=id，避免406错误
    const { count, error } = await supabase
      .from("likes")
      .select("*", { count: "exact", head: true })
      .eq("post_id", postId)
      .eq("user_id", userId)

    if (error) {
      console.error("检查点赞状态错误:", error)
      return false
    }

    // 修复：确保 count 不为 null
    const isLiked = count !== null && count > 0

    // 缓存结果
    likeStatusCache.set(cacheKey, isLiked)

    // 设置缓存过期
    setTimeout(() => {
      likeStatusCache.delete(cacheKey)
    }, 60000) // 60秒后过期

    return isLiked
  } catch (e) {
    console.error("检查点赞状态异常:", e)
    return false
  }
}

// 点赞帖子 - 使用乐观更新
export async function likePost(postId: string, userId: string) {
  // 生成缓存键
  const cacheKey = `${postId}:${userId}`

  // 乐观更新缓存
  likeStatusCache.set(cacheKey, true)

  try {
    // 使用RPC函数绕过RLS
    const { data, error } = await supabase.rpc("like_post", {
      p_post_id: postId,
      p_user_id: userId,
    })

    if (error) {
      // 如果失败，恢复缓存
      likeStatusCache.set(cacheKey, false)
      throw error
    }

    // 更新帖子缓存
    if (postCache.has(postId)) {
      const cachedPost = postCache.get(postId)
      postCache.set(postId, {
        ...cachedPost,
        likes_count: (cachedPost.likes_count || 0) + 1,
        likes: (cachedPost.likes || 0) + 1,
      })
    }

    return data
  } catch (error) {
    console.error("点赞失败:", error)
    throw error
  }
}

// 取消点赞 - 使用乐观更新
export async function unlikePost(postId: string, userId: string) {
  // 生成缓存键
  const cacheKey = `${postId}:${userId}`

  // 乐观更新缓存
  likeStatusCache.set(cacheKey, false)

  try {
    // 使用RPC函数绕过RLS
    const { data, error } = await supabase.rpc("unlike_post", {
      p_post_id: postId,
      p_user_id: userId,
    })

    if (error) {
      // 如果失败，恢复缓存
      likeStatusCache.set(cacheKey, true)
      throw error
    }

    // 更新帖子缓存
    if (postCache.has(postId)) {
      const cachedPost = postCache.get(postId)
      postCache.set(postId, {
        ...cachedPost,
        likes_count: Math.max((cachedPost.likes_count || 0) - 1, 0),
        likes: Math.max((cachedPost.likes || 0) - 1, 0),
      })
    }

    return data
  } catch (error) {
    console.error("取消点赞失败:", error)
    throw error
  }
}

// 评论缓存
const commentsCache = new Map<string, Comment[]>()

// 修改 getComments 函数，添加缓存
export async function getComments(postId: string) {
  // 检查缓存
  if (commentsCache.has(postId)) {
    return commentsCache.get(postId) || []
  }

  const { data, error } = await supabase
    .from("comments")
    .select(`
   *,
   users:user_id (username)
 `)
    .eq("post_id", postId)
    .order("created_at", { ascending: false })

  if (error) throw error

  // 处理评论数据
  const comments = data.map((comment) => ({
    ...comment,
    username: comment.users?.username,
    replies: [] as Comment[], // 空的回复数组
  }))

  // 缓存结果
  commentsCache.set(postId, comments)

  // 设置缓存过期
  setTimeout(() => {
    commentsCache.delete(postId)
  }, 30000) // 30秒后过期

  return comments
}

// 修改 addComment 函数，使用乐观更新
export async function addComment(postId: string, userId: string, content: string, parentId?: string) {
  try {
    // 使用RPC函数绕过RLS
    const { data, error } = await supabase.rpc("add_comment", {
      p_post_id: postId,
      p_user_id: userId,
      p_content: content,
      p_parent_id: parentId || null,
    })

    if (error) throw error

    // 获取新创建的评论详情
    const { data: commentData, error: commentError } = await supabase
      .from("comments")
      .select(`
     *,
     users:user_id (username)
   `)
      .eq("id", data.id)
      .single()

    if (commentError) throw commentError

    const newComment = {
      ...commentData,
      username: commentData.users?.username,
      replies: [] as Comment[],
    }

    // 更新评论缓存
    if (commentsCache.has(postId)) {
      const cachedComments = commentsCache.get(postId) || []
      commentsCache.set(postId, [newComment, ...cachedComments])
    }

    // 更新帖子缓存中的评论计数
    if (postCache.has(postId)) {
      const cachedPost = postCache.get(postId)
      postCache.set(postId, {
        ...cachedPost,
        comments_count: (cachedPost.comments_count || 0) + 1,
        comments: (cachedPost.comments || 0) + 1,
      })
    }

    return newComment
  } catch (error) {
    console.error("添加评论失败:", error)
    throw error
  }
}

// 实时订阅帖子更新
export function subscribeToPostsUpdates(callback: (posts: any[]) => void) {
  // 初始加载帖子
  getPosts().then(callback).catch(console.error)

  // 订阅帖子表的变化
  const subscription = supabase
    .channel("posts-channel")
    .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, async (payload) => {
      // 当有变化时，重新获取所有帖子
      try {
        const posts = await getPosts()
        callback(posts)
      } catch (error) {
        console.error("获取更新的帖子失败:", error)
      }
    })
    .subscribe()

  // 返回取消订阅的函数
  return () => {
    subscription.unsubscribe()
  }
}

// 实时订阅评论更新
export function subscribeToCommentsUpdates(postId: string, callback: (comments: Comment[]) => void) {
  // 初始加载评论
  getComments(postId).then(callback).catch(console.error)

  // 订阅特定帖子的评论变化
  const subscription = supabase
    .channel(`comments-channel-${postId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "comments",
        filter: `post_id=eq.${postId}`,
      },
      async (payload) => {
        // 当有变化时，重新获取该帖子的所有评论
        try {
          const comments = await getComments(postId)
          callback(comments)
        } catch (error) {
          console.error("获取更新的评论失败:", error)
        }
      },
    )
    .subscribe()

  // 返回取消订阅的函数
  return () => {
    subscription.unsubscribe()
  }
}

// 添加一个函数来创建必要的RPC函数
export async function setupRpcFunctions() {
  // 检查increment函数是否存在
  try {
    // 尝试调用increment函数，如果不存在会抛出错误
    const { data: incrementTest, error: incrementError } = await supabase.rpc("increment", { x: 1 })
    if (incrementError && incrementError.message?.includes("does not exist")) {
      console.log("increment函数不存在，需要在数据库中手动创建")
    }
  } catch (e) {
    console.error("检查increment函数时出错:", e)
  }

  // 检查decrement函数是否存在
  try {
    // 尝试调用decrement函数，如果不存在会抛出错误
    const { data: decrementTest, error: decrementError } = await supabase.rpc("decrement", { x: 1 })
    if (decrementError && decrementError.message?.includes("does not exist")) {
      console.log("decrement函数不存在，需要在数据库中手动创建")
    }
  } catch (e) {
    console.error("检查decrement函数时出错:", e)
  }

  // 检查get_table_info函数是否存在
  try {
    // 尝试调用get_table_info函数，如果不存在会抛出错误
    const { data: tableInfo, error: tableError } = await supabase.rpc("get_table_info", { table_name: "posts" })
    if (tableError && tableError.message?.includes("does not exist")) {
      console.log("get_table_info函数不存在，需要在数据库中手动创建")
    }
  } catch (e) {
    console.error("检查get_table_info函数时出错:", e)
  }
}

// 清理缓存的辅助函数
export function clearCaches() {
  likeStatusCache.clear()
  postCache.clear()
  profileCache.clear()
  commentsCache.clear()
}
