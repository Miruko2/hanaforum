import { NextResponse } from "next/server"

export async function GET() {
  // 这里可以从数据库或配置文件中获取应用版本信息
  const appVersionInfo = {
    version: "1.0.0",
    versionCode: 120,
    releaseDate: "2025-05-21",
    size: "15.4 MB",
    downloadUrl: "/downloads/app-release.apk", // 更新为实际的下载链接
    minAndroidVersion: "Android 6.0+",
    releaseNotes: [
      "修复了帖子内容显示问题",
      "优化了应用性能",
      "改进了用户界面",
      "添加了新的主题选项",
      "修复了已知的错误",
    ],
  }

  return NextResponse.json(appVersionInfo)
}
