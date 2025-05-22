"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Shield, Users, FileText, Trash2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"

export default function AdminPage() {
  const { user, isAdmin } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<any[]>([])
  const [posts, setPosts] = useState<any[]>([])
  const [admins, setAdmins] = useState<any[]>([])
  const [newAdminEmail, setNewAdminEmail] = useState("")
  const [addingAdmin, setAddingAdmin] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedItem, setSelectedItem] = useState<{ id: string; type: string } | null>(null)

  useEffect(() => {
    // 如果用户未登录或不是管理员，重定向到首页
    if (!loading && (!user || !isAdmin)) {
      router.push("/")
      return
    }

    if (user && isAdmin) {
      loadData()
    }
  }, [user, isAdmin, loading, router])

  const loadData = async () => {
    setLoading(true)
    try {
      // 加载用户列表
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false })

      if (usersError) throw usersError
      setUsers(usersData || [])

      // 加载帖子列表
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select("*, users:user_id (username)")
        .order("created_at", { ascending: false })

      if (postsError) throw postsError
      setPosts(postsData || [])

      // 加载管理员列表
      const { data: adminsData, error: adminsError } = await supabase
        .from("admin_users")
        .select("*, users:user_id (email, username)")
        .order("created_at", { ascending: false })

      if (adminsError) throw adminsError
      setAdmins(adminsData || [])
    } catch (error) {
      console.error("加载数据错误:", error)
      toast({
        title: "加载失败",
        description: "无法加载管理数据，请稍后重试",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddAdmin = async () => {
    if (!newAdminEmail.trim()) {
      toast({
        title: "输入错误",
        description: "请输入有效的邮箱地址",
        variant: "destructive",
      })
      return
    }

    setAddingAdmin(true)
    try {
      // 先查找用户ID
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("email", newAdminEmail.trim())
        .single()

      if (userError) {
        toast({
          title: "用户不存在",
          description: "找不到该邮箱对应的用户",
          variant: "destructive",
        })
        return
      }

      // 添加管理员
      const { error: adminError } = await supabase
        .from("admin_users")
        .insert([{ user_id: userData.id, added_by: user?.id }])

      if (adminError) {
        if (adminError.code === "23505") {
          toast({
            title: "添加失败",
            description: "该用户已经是管理员",
            variant: "destructive",
          })
        } else {
          throw adminError
        }
      } else {
        toast({
          title: "添加成功",
          description: "已成功添加新管理员",
        })
        setNewAdminEmail("")
        loadData() // 重新加载数据
      }
    } catch (error) {
      console.error("添加管理员错误:", error)
      toast({
        title: "添加失败",
        description: "添加管理员时出现错误，请稍后重试",
        variant: "destructive",
      })
    } finally {
      setAddingAdmin(false)
    }
  }

  const handleDelete = (id: string, type: string) => {
    setSelectedItem({ id, type })
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!selectedItem) return

    try {
      if (selectedItem.type === "post") {
        // 删除帖子
        await supabase.rpc("delete_post", {
          p_post_id: selectedItem.id,
          p_user_id: user?.id,
        })
        toast({
          title: "删除成功",
          description: "帖子已成功删除",
        })
      } else if (selectedItem.type === "admin") {
        // 删除管理员
        const { error } = await supabase.from("admin_users").delete().eq("id", selectedItem.id)

        if (error) throw error
        toast({
          title: "删除成功",
          description: "管理员已成功移除",
        })
      }

      loadData() // 重新加载数据
    } catch (error) {
      console.error("删除错误:", error)
      toast({
        title: "删除失败",
        description: "操作失败，请稍后重试",
        variant: "destructive",
      })
    } finally {
      setShowDeleteDialog(false)
      setSelectedItem(null)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-10 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-lime-500 mx-auto mb-4"></div>
          <p className="text-gray-400">加载中...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto py-10">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-red-400 flex items-center">
              <AlertCircle className="mr-2 h-5 w-5" />
              访问被拒绝
            </CardTitle>
            <CardDescription>您没有权限访问管理员页面</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push("/")} variant="outline">
              返回首页
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center">
          <Shield className="mr-2 h-6 w-6 text-lime-500" />
          管理员控制面板
        </h1>
      </div>

      <Tabs defaultValue="admins" className="w-full">
        <TabsList className="mb-4 bg-gray-900">
          <TabsTrigger value="admins" className="data-[state=active]:bg-lime-900/30 data-[state=active]:text-lime-400">
            <Shield className="mr-2 h-4 w-4" />
            管理员
          </TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-lime-900/30 data-[state=active]:text-lime-400">
            <Users className="mr-2 h-4 w-4" />
            用户
          </TabsTrigger>
          <TabsTrigger value="posts" className="data-[state=active]:bg-lime-900/30 data-[state=active]:text-lime-400">
            <FileText className="mr-2 h-4 w-4" />
            帖子
          </TabsTrigger>
        </TabsList>

        <TabsContent value="admins">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle>管理员列表</CardTitle>
              <CardDescription>管理所有管理员账户</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex mb-4">
                <Input
                  placeholder="输入用户邮箱"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  className="mr-2 bg-gray-800 border-gray-700"
                />
                <Button onClick={handleAddAdmin} disabled={addingAdmin} className="bg-lime-700 hover:bg-lime-600">
                  {addingAdmin ? "添加中..." : "添加管理员"}
                </Button>
              </div>

              <div className="border rounded-md border-gray-800">
                <div className="grid grid-cols-3 gap-4 p-4 font-medium text-gray-400 border-b border-gray-800">
                  <div>邮箱</div>
                  <div>添加时间</div>
                  <div className="text-right">操作</div>
                </div>
                {admins.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">暂无数据</div>
                ) : (
                  admins.map((admin) => (
                    <div
                      key={admin.id}
                      className="grid grid-cols-3 gap-4 p-4 border-b border-gray-800 last:border-0 items-center"
                    >
                      <div className="text-white">{admin.users?.email || "未知"}</div>
                      <div className="text-gray-400">
                        {new Date(admin.created_at).toLocaleString("zh-CN", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      <div className="text-right">
                        {admin.user_id !== user?.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(admin.id, "admin")}
                            className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            移除
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle>用户列表</CardTitle>
              <CardDescription>查看所有注册用户</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md border-gray-800">
                <div className="grid grid-cols-4 gap-4 p-4 font-medium text-gray-400 border-b border-gray-800">
                  <div>用户名</div>
                  <div>邮箱</div>
                  <div>注册时间</div>
                  <div className="text-right">操作</div>
                </div>
                {users.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">暂无数据</div>
                ) : (
                  users.map((user) => (
                    <div
                      key={user.id}
                      className="grid grid-cols-4 gap-4 p-4 border-b border-gray-800 last:border-0 items-center"
                    >
                      <div className="text-white">{user.username || "未设置"}</div>
                      <div className="text-gray-300">{user.email}</div>
                      <div className="text-gray-400">
                        {new Date(user.created_at).toLocaleString("zh-CN", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                        })}
                      </div>
                      <div className="text-right">{/* 这里可以添加用户管理操作，如封禁等 */}</div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="posts">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle>帖子列表</CardTitle>
              <CardDescription>管理所有帖子</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md border-gray-800">
                <div className="grid grid-cols-4 gap-4 p-4 font-medium text-gray-400 border-b border-gray-800">
                  <div>标题</div>
                  <div>作者</div>
                  <div>发布时间</div>
                  <div className="text-right">操作</div>
                </div>
                {posts.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">暂无数据</div>
                ) : (
                  posts.map((post) => (
                    <div
                      key={post.id}
                      className="grid grid-cols-4 gap-4 p-4 border-b border-gray-800 last:border-0 items-center"
                    >
                      <div className="text-white truncate">{post.title}</div>
                      <div className="text-gray-300">{post.users?.username || "匿名用户"}</div>
                      <div className="text-gray-400">
                        {new Date(post.created_at).toLocaleString("zh-CN", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      <div className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(post.id, "post")}
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          删除
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-gray-900 border-gray-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-400 flex items-center">
              <AlertCircle className="mr-2 h-5 w-5" />
              确认删除
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              {selectedItem?.type === "post"
                ? "你确定要删除这篇帖子吗？此操作无法撤销，帖子及其相关评论将被永久删除。"
                : "你确定要移除这个管理员吗？此操作将撤销该用户的管理员权限。"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-800 text-white hover:bg-gray-700 border-gray-700">
              取消
            </AlertDialogCancel>
            <AlertDialogAction className="bg-red-900 hover:bg-red-800 text-white" onClick={confirmDelete}>
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
