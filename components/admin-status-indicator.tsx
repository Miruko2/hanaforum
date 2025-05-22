"use client"

import { useAuth } from "@/contexts/auth-context"
import { ShieldCheck, ShieldQuestion } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"

export default function AdminStatusIndicator() {
  const { user, isAdmin, loading } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || loading || !user) return null

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={`ml-2 ${
              isAdmin
                ? "bg-lime-950/50 border-lime-800/50 text-lime-400 hover:bg-lime-900/50"
                : "bg-gray-800/50 border-gray-700/50 text-gray-400"
            }`}
          >
            {isAdmin ? <ShieldCheck className="h-3.5 w-3.5 mr-1" /> : <ShieldQuestion className="h-3.5 w-3.5 mr-1" />}
            {isAdmin ? "管理员" : "普通用户"}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{isAdmin ? "您是管理员，可以执行特殊操作" : "您是普通用户，某些功能可能受限"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
