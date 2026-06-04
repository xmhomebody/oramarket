// Hono RPC 客户端 —— 前端用它调用 API，享受完整的端到端类型推断
// 用法示例：const res = await api.surveys.leaderboard.$get({ query: { period: "week" } })
import { hc } from "hono/client";
import type { AppType } from "@/server";

// 根据环境自动选择 API 基地址（浏览器端用相对地址即可）
const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL ??
  (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");

export const api = hc<AppType>(baseUrl);
