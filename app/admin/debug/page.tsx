import AdminDebug from "@/components/admin-debug"

export default function AdminDebugPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6 text-center">管理员状态调试</h1>
      <AdminDebug />
    </div>
  )
}
