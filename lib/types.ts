// 更新Post接口以匹配您的数据库结构
export interface Post {
  id: string
  user_id: string
  title: string
  category: string
  content: string // 数据库中的内容字段
  description: string // 数据库中的描述字段
  image_url?: string
  image_ratio?: number
  likes_count?: number // UI使用
  comments_count?: number // UI使用
  likes: number // 数据库中的字段
  comments: number // 数据库中的字段
  created_at: string
  username?: string // 用于显示，从关联查询中获取
  imageContent?: string // 用于UI显示，当没有图片时
}

export interface PostInput {
  title: string
  category: string
  content: string
  description: string
  image_url?: string
  image_ratio?: number
}

export interface Like {
  id: string
  user_id: string
  post_id: string
  created_at: string
}

export interface Comment {
  id: string
  user_id: string
  post_id: string
  parent_id?: string
  content: string
  created_at: string
  username?: string
  likes_count?: number
  likes?: number
  replies?: Comment[]
  user?: {
    id: string
    username: string
    avatar_url?: string
  }
}
