// Hono 应用主入口 —— 注册全局中间件与各资源路由
// 所有后端 API 由 Hono 承担（不使用 Next.js API Routes 写业务逻辑）
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { surveysRoute } from "./routes/surveys";
import { authRoute } from "./routes/auth";
import { followsRoute } from "./routes/follows";
import { betsRoute } from "./routes/bets";

// 创建应用实例，统一前缀 /api
const app = new Hono()
  .basePath("/api")
  .use("*", logger())
  .use("*", cors())
  // 健康检查
  .get("/health", (c) => c.json({ ok: true }))
  // 调研资源路由
  .route("/surveys", surveysRoute)
  // 认证路由（手机号 + 密码 / 验证码登录）
  .route("/auth", authRoute)
  .route("/follows", followsRoute)
  .route("/bets", betsRoute);

// 导出类型供前端 Hono RPC 使用（端到端类型安全的关键）
export type AppType = typeof app;

export default app;
