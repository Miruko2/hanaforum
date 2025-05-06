"use client"

import { Search, PlusCircle, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"

export default function Navbar() {
  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center px-4 py-3 bg-black/40 backdrop-blur-xl border-b border-lime-500/20">
        <div className="w-full max-w-7xl mx-auto flex items-center">
          <Link href="/" className="flex items-center text-lime-400 font-bold text-xl mr-4 neon-text">
            <svg viewBox="0 0 24 24" className="w-6 h-6 mr-2" fill="currentColor">
              <path d="M4 5a2 2 0 012-2h12a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 1h10v4H7V6zm0 6h10v2H7v-2zm0 4h7v2H7v-2z" />
            </svg>
            磨砂瀑布流
          </Link>

          <div className="flex-grow flex items-center relative mx-2">
            <Input
              type="search"
              placeholder="搜索内容..."
              className="w-full bg-black/30 border-gray-800 focus:border-lime-500/50 rounded-full pr-8 h-9 text-sm"
            />
            <Button size="icon" variant="ghost" className="absolute right-0 text-gray-400 hover:text-lime-500">
              <Search className="h-4 w-4" />
            </Button>
          </div>

          <Button variant="ghost" size="icon" className="text-lime-500 rounded-full">
            <PlusCircle className="h-5 w-5" />
          </Button>

          <Button variant="ghost" size="icon" className="text-lime-500 rounded-full">
            <User className="h-5 w-5" />
          </Button>
        </div>
      </nav>
      <div className="h-[56px]"></div>
    </>
  )
}
