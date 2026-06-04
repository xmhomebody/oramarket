// 将 Hono 挂载到 Next.js Route Handler —— 所有 /api/* 请求交由 Hono 处理
// 这是 app/api 下唯一的文件，仅作挂载，不写任何业务逻辑。
import { handle } from "hono/vercel";
import app from "@/server";

// 使用 Node.js 运行时（与 Supabase 服务端 SDK 兼容）
export const runtime = "nodejs";

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);
export const PATCH = handle(app);
