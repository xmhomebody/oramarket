// 浏览器端 Supabase 客户端 —— 仅在客户端组件中使用
// 注意：当前为占位，未真正连接数据库；填入 .env.local 后即可启用。
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  );
}
