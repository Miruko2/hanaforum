import { type NextRequest, NextResponse } from "next/server"

/**
 * 图片优化API路由
 * 代理Supabase存储的图片请求，添加缓存和优化
 */
export async function GET(request: NextRequest) {
  try {
    // 获取URL参数
    const url = request.nextUrl.searchParams.get("url")
    const width = request.nextUrl.searchParams.get("width")
    const height = request.nextUrl.searchParams.get("height")
    const format = request.nextUrl.searchParams.get("format") || "webp"
    const quality = request.nextUrl.searchParams.get("quality") || "80"

    // 验证URL参数
    if (!url) {
      return NextResponse.json({ error: "Missing required parameter: url" }, { status: 400 })
    }

    // 构建Supabase存储URL
    let imageUrl = url

    // 如果提供了宽度，添加转换参数
    if (width) {
      // 检查URL是否已经包含查询参数
      const hasQuery = imageUrl.includes("?")
      const separator = hasQuery ? "&" : "?"

      imageUrl += `${separator}width=${width}`
      if (height) imageUrl += `&height=${height}`
      imageUrl += `&format=${format}&quality=${quality}`
    }

    // 获取图片
    const imageResponse = await fetch(imageUrl, {
      headers: {
        Accept: "image/*",
      },
    })

    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: `Failed to fetch image: ${imageResponse.statusText}` },
        { status: imageResponse.status },
      )
    }

    // 获取图片数据
    const imageData = await imageResponse.arrayBuffer()
    const contentType = imageResponse.headers.get("Content-Type") || "image/webp"

    // 返回图片，添加缓存头
    return new NextResponse(imageData, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800",
      },
    })
  } catch (error) {
    console.error("Image optimization error:", error)
    return NextResponse.json({ error: "Failed to process image" }, { status: 500 })
  }
}
