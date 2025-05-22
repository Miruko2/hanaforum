// app/register/page.tsx
import { RegisterForm } from '@/components/auth/register-form';
import Navbar from '@/components/navbar';
import BackgroundEffects from '@/components/background-effects';

export default function RegisterPage() {
  return (
    <main className="min-h-screen">
      <BackgroundEffects />
      <Navbar />
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[calc(100vh-56px)]">
        <RegisterForm />
      </div>
    </main>
  );
}