"use client"

import { useEffect, useState } from "react"
import { useSimpleAuth } from "@/contexts/auth-context-simple"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Shield, Users, FileText, Trash2, AlertCircle, Bot } from "lucide-react"
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
  const { user, isAdmin, loading: authLoading } = useSimpleAuth()
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

  // AI 白名单状态
  const [hanakoAllowedUsers, setHanakoAllowedUsers] = useState<any[]>([])
  const [newAllowedUserInput, setNewAllowedUserInput] = useState("")
  const [addingAllowedUser, setAddingAllowedUser] = useState(false)

  useEffect(() => {
    // 等待认证状态完成初始化再判断
    if (authLoading) return

    // 如果用户未登录或不是管理员，重定向到首页
    if (!user || !isAdmin) {
      router.push("/")
      return
    }

    loadData()
  }, [user, isAdmin, authLoading, router])

  const loadData = async () => {
    setLoading(true)
    try {
      // 并行查询所有表
      const [usersResult, postsResult, adminsResult, allowedResult] = await Promise.allSettled([
        supabase
          .from("profiles")
          .select("id, username, avatar_url, updated_at")
          .order("updated_at", { ascending: false, nullsFirst: false }),
        supabase
          .from("posts")
          .select("id, title, content, description, category, user_id, created_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("admin_users")
          .select("id, user_id, added_by, created_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("hanako_allowed_users")
          .select("id, user_id, added_by, created_at")
          .order("created_at", { ascending: false }),
      ])

      // 处理用户列表
      if (usersResult.status === "fulfilled" && !usersResult.value.error) {
        setUsers(usersResult.value.data || [])
      }

      // 处理帖子列表
      if (postsResult.status === "fulfilled" && !postsResult.value.error) {
        const postsData = postsResult.value.data || []
        const postUserIds = [...new Set(postsData.map(p => p.user_id).filter(Boolean))]
        const usernameMap = new Map<string, string>()

        if (postUserIds.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, username")
            .in("id", postUserIds)

          for (const p of profiles || []) {
            if (p.username) {
              const name = p.username.includes("@") ? p.username.split("@")[0] : p.username
              usernameMap.set(p.id, name)
            }
          }
        }

        const processedPosts = postsData.map(post => ({
          ...post,
          username: usernameMap.get(post.user_id) || `用户_${post.user_id.substring(0, 6)}`,
        }))

        setPosts(processedPosts)
      }

      // 处理管理员列表
      if (adminsResult.status === "fulfilled" && !adminsResult.value.error) {
        const adminsData = adminsResult.value.data || []
        const adminUserIds = [...new Set(adminsData.map(a => a.user_id).filter(Boolean))]
        const adminProfileMap = new Map<string, { username: string | null }>()

        if (adminUserIds.length > 0) {
          const { data: adminProfiles } = await supabase
            .from("profiles")
            .select("id, username")
            .in("id", adminUserIds)

          for (const p of adminProfiles || []) {
            adminProfileMap.set(p.id, { username: p.username })
          }
        }

        const processedAdmins = adminsData.map(a => ({
          ...a,
          users: {
            username: adminProfileMap.get(a.user_id)?.username || null,
            email: null,
          },
        }))

        setAdmins(processedAdmins)
      }

      // 处理 AI 白名单
      if (allowedResult.status === "fulfilled" && !allowedResult.value.error) {
        const allowedData = allowedResult.value.data || []
        const allowedUserIds = allowedData.map((a) => a.user_id).filter(Boolean)
        const allowedUsernameMap = new Map<string, string>()

        if (allowedUserIds.length > 0) {
          const { data: allowedProfiles } = await supabase
            .from("profiles")
            .select("id, username")
            .in("id", allowedUserIds)

          for (const p of allowedProfiles || []) {
            if (p.username) {
              allowedUsernameMap.set(p.id, p.username)
            }
          }
        }

        const processedAllowed = allowedData.map((a) => ({
          ...a,
          username: allowedUsernameMap.get(a.user_id) || null,
        }))

        setHanakoAllowedUsers(processedAllowed)
      }
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
        description: "请输入用户名或用户ID",
        variant: "destructive",
      })
      return
    }

    setAddingAdmin(true)
    try {
      const input = newAdminEmail.trim()
      let targetUserId: string | null = null

      // 如果输入看起来是 UUID，直接用
      const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (uuidRe.test(input)) {
        targetUserId = input
      } else {
        // 否则在 profiles 表按用户名查找
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", input)
          .maybeSingle()

        if (profile?.id) {
          targetUserId = profile.id
        }
      }

      if (!targetUserId) {
        toast({
          title: "用户不存在",
          description: "找不到该用户名或用户ID对应的用户",
          variant: "destructive",
        })
        return
      }

      // 添加管理员
      const { error: adminError } = await supabase
        .from("admin_users")
        .insert([{ user_id: targetUserId, added_by: user?.id }])

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
      } else if (selectedItem.type === "hanako_allowed") {
        // 删除 AI 白名单用户
        const { error } = await supabase.from("hanako_allowed_users").delete().eq("id", selectedItem.id)

        if (error) throw error
        toast({
          title: "删除成功",
          description: "已从 AI 对话白名单中移除",
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

  const handleAddAllowedUser = async () => {
    if (!newAllowedUserInput.trim()) {
      toast({
        title: "输入错误",
        description: "请输入用户名或用户ID",
        variant: "destructive",
      })
      return
    }

    setAddingAllowedUser(true)
    try {
      const input = newAllowedUserInput.trim()
      let targetUserId: string | null = null

      // 如果输入看起来是 UUID，直接用
      const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (uuidRe.test(input)) {
        targetUserId = input
      } else {
        // 否则在 profiles 表按用户名查找
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", input)
          .maybeSingle()

        if (profile?.id) {
          targetUserId = profile.id
        }
      }

      if (!targetUserId) {
        toast({
          title: "用户不存在",
          description: "找不到该用户名或用户ID对应的用户",
          variant: "destructive",
        })
        return
      }

      // 添加到白名单
      const { error: addError } = await supabase
        .from("hanako_allowed_users")
        .insert([{ user_id: targetUserId, added_by: user?.id }])

      if (addError) {
        if (addError.code === "23505") {
          toast({
            title: "添加失败",
            description: "该用户已在白名单中",
            variant: "destructive",
          })
        } else {
          throw addError
        }
      } else {
        toast({
          title: "添加成功",
          description: "已添加到 AI 对话白名单",
        })
        setNewAllowedUserInput("")
        loadData()
      }
    } catch (error) {
      console.error("添加白名单用户错误:", error)
      toast({
        title: "添加失败",
        description: "添加白名单用户时出现错误，请稍后重试",
        variant: "destructive",
      })
    } finally {
      setAddingAllowedUser(false)
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
          <TabsTrigger value="hanako" className="data-[state=active]:bg-lime-900/30 data-[state=active]:text-lime-400">
            <Bot className="mr-2 h-4 w-4" />
            AI 对话权限
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
                  placeholder="输入用户名或用户 ID"
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
                  <div>用户名</div>
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
                      <div className="text-white">
                        {admin.users?.username || `用户_${admin.user_id?.substring(0, 6) || "未知"}`}
                      </div>
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
                <div className="grid grid-cols-3 gap-4 p-4 font-medium text-gray-400 border-b border-gray-800">
                  <div>用户名</div>
                  <div>用户 ID</div>
                  <div className="text-right">操作</div>
                </div>
                {users.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">暂无数据</div>
                ) : (
                  users.map((u) => (
                    <div
                      key={u.id}
                      className="grid grid-cols-3 gap-4 p-4 border-b border-gray-800 last:border-0 items-center"
                    >
                      <div className="text-white">{u.username || "未设置"}</div>
                      <div className="text-gray-300 font-mono text-xs truncate">{u.id}</div>
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
                      <div className="text-gray-300">{post.username || "匿名用户"}</div>
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

        <TabsContent value="hanako">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle>AI 对话白名单</CardTitle>
              <CardDescription>管理允许与 Hanako AI 对话的用户</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex mb-4">
                <Input
                  placeholder="输入用户名或用户 ID"
                  value={newAllowedUserInput}
                  onChange={(e) => setNewAllowedUserInput(e.target.value)}
                  className="mr-2 bg-gray-800 border-gray-700"
                />
                <Button onClick={handleAddAllowedUser} disabled={addingAllowedUser} className="bg-lime-700 hover:bg-lime-600">
                  {addingAllowedUser ? "添加中..." : "添加用户"}
                </Button>
              </div>

              <div className="border rounded-md border-gray-800">
                <div className="grid grid-cols-3 gap-4 p-4 font-medium text-gray-400 border-b border-gray-800">
                  <div>用户名</div>
                  <div>添加时间</div>
                  <div className="text-right">操作</div>
                </div>
                {hanakoAllowedUsers.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">暂无数据</div>
                ) : (
                  hanakoAllowedUsers.map((allowed) => (
                    <div
                      key={allowed.id}
                      className="grid grid-cols-3 gap-4 p-4 border-b border-gray-800 last:border-0 items-center"
                    >
                      <div className="text-white">
                        {allowed.username || `用户_${allowed.user_id?.substring(0, 6) || "未知"}`}
                      </div>
                      <div className="text-gray-400">
                        {new Date(allowed.created_at).toLocaleString("zh-CN", {
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
                          onClick={() => handleDelete(allowed.id, "hanako_allowed")}
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          移除
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
                : selectedItem?.type === "hanako_allowed"
                  ? "你确定要将此用户从 AI 对话白名单中移除吗？移除后该用户将无法与 Hanako AI 对话。"
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
