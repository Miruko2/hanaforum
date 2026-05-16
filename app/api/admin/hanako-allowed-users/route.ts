import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

// GET: 查询所有白名单用户
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("hanako_allowed_users")
      .select("id, user_id, added_by, created_at")
      .order("created_at", { ascending: false })

    if (error) throw error

    // 查询用户信息
    const userIds = data.map((item) => item.user_id).filter(Boolean)
    const usernameMap = new Map<string, string>()

    if (userIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("id, username")
        .in("id", userIds)

      for (const p of profiles || []) {
        if (p.username) {
          usernameMap.set(p.id, p.username)
        }
      }
    }

    const result = data.map((item) => ({
      ...item,
      username: usernameMap.get(item.user_id) || null,
    }))

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("[Hanako Allowed Users] GET error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST: 添加用户到白名单
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, addedBy } = body

    if (!userId) {
      return NextResponse.json({ error: "缺少 userId" }, { status: 400 })
    }

    // 验证用户是否存在
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle()

    if (profileError || !profile) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 })
    }

    // 添加到白名单
    const { data, error } = await supabaseAdmin
      .from("hanako_allowed_users")
      .insert([{ user_id: userId, added_by: addedBy || null }])
      .select()
      .single()

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "用户已在白名单中" }, { status: 409 })
      }
      throw error
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("[Hanako Allowed Users] POST error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE: 从白名单中删除用户
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "缺少 id" }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from("hanako_allowed_users")
      .delete()
      .eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[Hanako Allowed Users] DELETE error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
