"use client"

import { useState } from "react"
import Link from "next/link"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AppDownloadButtonProps {
  downloadUrl: string
  version: string
  className?: string
}

export function AppDownloadButton({ downloadUrl, version, className }: AppDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = () => {
    setIsDownloading(true)
    // 这里可以添加下载统计逻辑
    setTimeout(() => {
      setIsDownloading(false)
    }, 3000)
  }

  return (
    <Button
      size="lg"
      className={`group relative h-14 overflow-hidden rounded-lg bg-emerald-600 text-lg font-medium text-white hover:bg-emerald-700 ${className}`}
      disabled={isDownloading}
      onClick={handleDownload}
    >
      <span className="absolute inset-0 flex items-center justify-center transition-opacity group-hover:opacity-0">
        {isDownloading ? "准备下载..." : `下载应用 (${version})`}
      </span>
      <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
        <Download className="mr-2 h-5 w-5" /> {isDownloading ? "准备下载..." : "开始下载"}
      </span>
      <Link href={downloadUrl} className="absolute inset-0" aria-label="下载应用"></Link>
    </Button>
  )
}
