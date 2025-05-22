/**
 * 获取优化的图片URL
 * 支持两种调用方式:
 * 1. getOptimizedImageUrl(originalUrl, size, format)
 * 2. getOptimizedImageUrl(bucket, path, width, height, format, quality)
 */
export function getOptimizedImageUrl(
  bucketOrUrl: string,
  pathOrSize: string | number,
  widthOrFormat?: number | string,
  height?: number,
  format: "webp" | "jpeg" | "png" = "webp",
  quality = 80,
): string {
  // 检查是否使用第一种调用方式 (URL, size, format)
  if (
    typeof bucketOrUrl === "string" &&
    bucketOrUrl.includes("supabase.co/storage") &&
    typeof pathOrSize === "string"
  ) {
    const originalUrl = bucketOrUrl
    const size = pathOrSize

    // 直接返回原始URL，不进行任何转换
    // 这样可以避免转换参数导致的错误
    return originalUrl
  }
  // 使用第二种调用方式 (bucket, path, width, height, format, quality)
  else {
    const bucket = bucketOrUrl
    const path = pathOrSize as string

    try {
      // 使用环境变量获取Supabase URL
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      if (!supabaseUrl) {
        console.error("NEXT_PUBLIC_SUPABASE_URL 环境变量未设置")
        return path // 返回原始路径
      }

      // 直接返回不带转换参数的URL
      return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`
    } catch (error) {
      console.error("获取图片URL失败:", error)
      return path // 出错时返回原始路径
    }
  }
}

/**
 * 预加载图片
 * @param url 图片URL
 */
export function preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!url) {
      resolve()
      return
    }

    const img = new Image()
    img.onload = () => resolve()
    img.onerror = (err) => {
      console.error("图片预加载失败:", url)
      reject(err)
    }
    img.src = url
    img.crossOrigin = "anonymous"
  })
}

/**
 * 批量预加载图片
 * @param urls 图片URL数组
 */
export async function preloadImages(urls: string[]): Promise<void> {
  await Promise.allSettled(urls.map((url) => preloadImage(url)))
}
