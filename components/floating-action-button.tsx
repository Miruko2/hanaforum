"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import CreatePostModal from "@/components/create-post-modal"

export default function FloatingActionButton() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <Button
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-lime-500 hover:bg-lime-600 text-black shadow-lg hover:shadow-lime-500/30 hover:scale-110 transition-all duration-300 backdrop-blur-sm"
        onClick={() => setIsModalOpen(true)}
      >
        <Plus className="h-6 w-6" />
        <span className="absolute inset-0 rounded-full bg-lime-400/20 animate-ping"></span>
      </Button>

      {isModalOpen && <CreatePostModal onClose={() => setIsModalOpen(false)} />}
    </>
  )
}
