// Hono 服务端使用的 Supabase Service Client（带 service_role 权限）
// 注意：当前为占位，未真正连接数据库；service_role key 绝不能暴露到客户端。
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export function createServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    { auth: { persistSession: false } },
  );
}
