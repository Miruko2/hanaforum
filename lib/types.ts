export interface Post {
  id: string
  title: string
  category: string
  likes: number
  comments: number
  description: string
  imageRatio: number
  imageContent?: string
  createdAt: Date
}
