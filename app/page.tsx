import PostGrid from "@/components/post-grid"
import BackgroundEffects from "@/components/background-effects"
import FloatingActionButton from "@/components/floating-action-button"

export default function HomePage() {
  return (
    <div className="min-h-screen relative">
      <BackgroundEffects />
      <div className="container mx-auto px-4 py-8">
        <PostGrid />
      </div>
      <FloatingActionButton />
    </div>
  )
}
