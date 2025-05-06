import type { Post } from "./types"

export function generateMockPosts(count: number): Post[] {
  const categories = ["设计", "摄影", "音乐", "艺术", "旅行", "健康"]
  const imageContents = ["+", "X", "O", "□", "△", "◇"]

  return Array.from({ length: count }, (_, i) => {
    const id = `post-${i}`
    const category = categories[i % categories.length]
    const imageRatio = [0.6, 0.8, 1.0, 1.2][i % 4]
    const imageContent = imageContents[i % imageContents.length]

    return {
      id,
      title: `${category}的魅力 ${i + 1}`,
      category,
      likes: 42 + i * 3,
      comments: 18 + i * 2,
      description:
        "探索极简主义设计如何在现代UI中创造令人惊叹的用户体验，让我们一起深入了解这种设计哲学如何影响我们的日常生活和数字交互。".repeat(
          5,
        ),
      imageRatio,
      imageContent,
      createdAt: new Date(Date.now() - i * 86400000),
    }
  })
}
