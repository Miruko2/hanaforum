import LoginForm from "@/components/login-form"
import BackgroundEffects from "@/components/background-effects"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative">
      <BackgroundEffects />
      <div className="w-full max-w-md p-6 rounded-xl glass-card neon-border z-10">
        <LoginForm />
      </div>
    </div>
  )
}
