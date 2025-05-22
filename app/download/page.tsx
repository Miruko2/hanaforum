import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { CheckCircle, Download, RefreshCw, Shield } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export const metadata: Metadata = {
  title: "下载我们的应用",
  description: "获取最新版本的应用，享受全新功能和改进的用户体验",
}

export default function DownloadPage() {
  // 应用信息 - 实际使用时请更新这些信息
  const appInfo = {
    name: "社区论坛",
    version: "1.2.0",
    versionCode: 120,
    releaseDate: "2025-05-21",
    size: "15.4 MB",
    downloadUrl: "/downloads/app-release.apk", // 更新为实际的下载链接
    qrCodeUrl: "/downloads/app-qrcode.png", // 更新为实际的二维码图片
    minAndroidVersion: "Android 6.0+",
    releaseNotes: [
      "修复了帖子内容显示问题",
      "优化了应用性能",
      "改进了用户界面",
      "添加了新的主题选项",
      "修复了已知的错误",
    ],
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-12 md:py-24">
        <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
          {/* 左侧：应用信息 */}
          <div className="flex flex-col justify-center space-y-6">
            <div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">下载{appInfo.name}应用</h1>
              <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
                随时随地访问社区论坛，获取最新内容，参与讨论，分享您的想法。
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardContent className="flex items-center gap-4 p-4">
                  <RefreshCw className="h-8 w-8 text-emerald-500" />
                  <div>
                    <h3 className="font-medium">实时更新</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">获取最新内容</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-4 p-4">
                  <Shield className="h-8 w-8 text-emerald-500" />
                  <div>
                    <h3 className="font-medium">安全可靠</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">数据加密保护</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-800">
              <h2 className="text-xl font-semibold">版本信息</h2>
              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <dt className="text-slate-500 dark:text-slate-400">版本号</dt>
                <dd className="font-medium">
                  {appInfo.version} (Build {appInfo.versionCode})
                </dd>
                <dt className="text-slate-500 dark:text-slate-400">发布日期</dt>
                <dd className="font-medium">{appInfo.releaseDate}</dd>
                <dt className="text-slate-500 dark:text-slate-400">文件大小</dt>
                <dd className="font-medium">{appInfo.size}</dd>
                <dt className="text-slate-500 dark:text-slate-400">系统要求</dt>
                <dd className="font-medium">{appInfo.minAndroidVersion}</dd>
              </dl>
            </div>

            <div className="flex flex-col space-y-4">
              <Button
                size="lg"
                className="group relative h-14 overflow-hidden rounded-lg bg-emerald-600 text-lg font-medium text-white hover:bg-emerald-700"
              >
                <span className="absolute inset-0 flex items-center justify-center transition-opacity group-hover:opacity-0">
                  下载应用 ({appInfo.version})
                </span>
                <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                  <Download className="mr-2 h-5 w-5" /> 开始下载
                </span>
                <Link href={appInfo.downloadUrl} className="absolute inset-0" aria-label="下载应用"></Link>
              </Button>
              <p className="text-center text-sm text-slate-500 dark:text-slate-400">点击按钮开始下载APK文件</p>
            </div>
          </div>

          {/* 右侧：应用预览和下载信息 */}
          <div className="flex flex-col items-center justify-center space-y-8">
            <div className="relative h-[500px] w-[250px] overflow-hidden rounded-[2rem] border-8 border-slate-800 shadow-xl">
              <div className="absolute inset-0 bg-white">
                <Image
                  src="/mobile-forum-screenshot.png"
                  alt="应用截图"
                  width={250}
                  height={500}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-800">
              <h2 className="mb-4 text-xl font-semibold">扫码下载</h2>
              <div className="flex flex-col items-center">
                <div className="relative h-40 w-40 overflow-hidden rounded-lg bg-white p-2">
                  <Image
                    src="/placeholder.svg?height=160&width=160&query=QR code"
                    alt="下载二维码"
                    width={160}
                    height={160}
                    className="h-full w-full"
                  />
                </div>
                <p className="mt-3 text-center text-sm text-slate-500 dark:text-slate-400">
                  使用手机扫描二维码下载应用
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 更新日志 */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold">更新日志</h2>
          <Separator className="my-4" />
          <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-800">
            <h3 className="mb-4 font-semibold">版本 {appInfo.version}</h3>
            <ul className="space-y-2">
              {appInfo.releaseNotes.map((note, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500" />
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 安装指南 */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold">安装指南</h2>
          <Separator className="my-4" />
          <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-800">
            <ol className="space-y-6">
              <li className="flex gap-4">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300">
                  1
                </div>
                <div>
                  <h3 className="font-medium">下载APK文件</h3>
                  <p className="mt-1 text-slate-600 dark:text-slate-400">
                    点击上方的"下载应用"按钮，或使用手机扫描二维码下载APK文件。
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300">
                  2
                </div>
                <div>
                  <h3 className="font-medium">允许安装未知来源应用</h3>
                  <p className="mt-1 text-slate-600 dark:text-slate-400">
                    在Android设备上，前往"设置" &gt; "安全"或"隐私"，启用"未知来源"或"安装未知应用"选项。
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300">
                  3
                </div>
                <div>
                  <h3 className="font-medium">打开APK文件</h3>
                  <p className="mt-1 text-slate-600 dark:text-slate-400">
                    下载完成后，点击通知或在文件管理器中找到APK文件并点击打开。
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300">
                  4
                </div>
                <div>
                  <h3 className="font-medium">安装应用</h3>
                  <p className="mt-1 text-slate-600 dark:text-slate-400">点击"安装"按钮，等待安装完成。</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300">
                  5
                </div>
                <div>
                  <h3 className="font-medium">打开应用</h3>
                  <p className="mt-1 text-slate-600 dark:text-slate-400">
                    安装完成后，点击"打开"按钮或在主屏幕上找到应用图标并点击打开。
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
