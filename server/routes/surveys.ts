// 调研相关 API 路由 —— 挂载在 /api/surveys
// 当前数据来自前端静态模块（Supabase 占位）。接入数据库后，
// 把这里换成 createServiceClient() 的查询即可，前端调用方式不变。
import { Hono } from "hono";
import {
  LB,
  REGIONS,
  LATEST_SURVEYS,
  HOT_SURVEYS,
  HOT_TOPICS,
  SLIDE_DATA,
  TRENDS,
  TREND_DATES,
} from "@/lib/data/home";

export const surveysRoute = new Hono()
  // 精选调研轮播（含趋势图数据）
  .get("/featured", (c) => c.json({ data: { slides: SLIDE_DATA, trends: TRENDS, dates: TREND_DATES } }))
  // 侧栏：最新 / 热门调研
  .get("/side", (c) => c.json({ data: { latest: LATEST_SURVEYS, hot: HOT_SURVEYS } }))
  // 三个热门话题卡片
  .get("/topics", (c) => c.json({ data: HOT_TOPICS }))
  // 排行榜（按周期）
  .get("/leaderboard", (c) => {
    const period = (c.req.query("period") ?? "day") as keyof typeof LB;
    return c.json({ data: LB[period] ?? LB.day });
  })
  // 地区参与占比
  .get("/regions", (c) => c.json({ data: REGIONS }));
