// 服务端 Supabase 客户端 —— 在 Server Component 中使用（SSR 会话恢复）
// 注意：当前为占位，未真正连接数据库；填入 .env.local 后即可启用。
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        // 读取 cookie 用于 SSR 会话恢复
        getAll() {
          return cookieStore.getAll();
        },
        // 写入 cookie 用于刷新 token（Server Component 中可能只读，做容错处理）
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // 在只读上下文（如纯渲染）中忽略写入失败
          }
        },
      },
    },
  );
}
