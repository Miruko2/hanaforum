import Navbar from "@/components/navbar"
import PostGrid from "@/components/post-grid"
import FloatingActionButton from "@/components/floating-action-button"
import BackgroundEffects from "@/components/background-effects"

export default function Home() {
  return (
    <main className="min-h-screen">
      <BackgroundEffects />
      <Navbar />
      <div className="content-wrap pt-4 pb-8 px-4">
        <PostGrid />
      </div>
      <FloatingActionButton />
    </main>
  )
}
