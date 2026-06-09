// 调研相关 API 路由 —— 挂载在 /api/surveys
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
import { createServiceClient } from "@/server/lib/supabase";

// 允许的排序字段
const SORT_MAP: Record<string, string> = {
  pool:       "pool",
  parts:      "parts",
  deadline:   "deadline_date",
  newest:     "pub_date",
};

export const surveysRoute = new Hono()
  // 精选调研轮播（含趋势图数据）—— 仍使用静态数据
  .get("/featured", (c) => c.json({ data: { slides: SLIDE_DATA, trends: TRENDS, dates: TREND_DATES } }))
  // 侧栏：最新 / 热门调研 —— 仍使用静态数据
  .get("/side", (c) => c.json({ data: { latest: LATEST_SURVEYS, hot: HOT_SURVEYS } }))
  // 三个热门话题卡片
  .get("/topics", (c) => c.json({ data: HOT_TOPICS }))
  // 排行榜（按周期）
  .get("/leaderboard", (c) => {
    const period = (c.req.query("period") ?? "day") as keyof typeof LB;
    return c.json({ data: LB[period] ?? LB.day });
  })
  // 地区参与占比
  .get("/regions", (c) => c.json({ data: REGIONS }))

  // ── 调研列表（来自 DB）──
  // 参数：ids（逗号分隔）, category, tag, status, sort, page, limit
  .get("/list", async (c) => {
    const sb = createServiceClient();
    const idsParam = c.req.query("ids") || "";
    const category = c.req.query("category") || "";
    const tag      = c.req.query("tag") || "";
    const status   = c.req.query("status") || "";
    const sort     = c.req.query("sort") || "pool";
    const page     = Math.max(1, parseInt(c.req.query("page") || "1"));
    const limit    = Math.min(500, Math.max(1, parseInt(c.req.query("limit") || "40")));
    const offset   = (page - 1) * limit;

    // ids 模式：按指定 ID 列表获取，忽略分页与排序
    if (idsParam) {
      const ids = idsParam.split(",").map(Number).filter((n) => !isNaN(n) && n > 0);
      const { data, error } = await sb.from("surveys").select("*").in("id", ids);
      if (error) return c.json({ error: error.message }, 500);
      // 保持请求 ids 的顺序
      const map = new Map((data ?? []).map((s) => [s.id, s]));
      return c.json({ data: ids.map((id) => map.get(id)).filter(Boolean), total: ids.length });
    }

    const sortCol = SORT_MAP[sort] ?? "pool";
    let q = sb.from("surveys").select("*", { count: "exact" });

    if (category) q = q.eq("category_slug", category);
    if (tag)      q = q.contains("tags", [tag]);
    if (status && status !== "all") q = q.eq("status", status);

    const { data, error, count } = await q
      .order(sortCol, { ascending: sortCol === "deadline_date" })
      .range(offset, offset + limit - 1);

    if (error) return c.json({ error: error.message }, 500);
    return c.json({ data, total: count ?? 0, page, limit });
  })

  // ── 调研详情（来自 DB）──
  .get("/:id", async (c) => {
    const id = parseInt(c.req.param("id"));
    if (isNaN(id)) return c.json({ error: "无效 ID" }, 400);
    const sb = createServiceClient();
    const { data, error } = await sb.from("surveys").select("*").eq("id", id).maybeSingle();
    if (error) return c.json({ error: error.message }, 500);
    if (!data)  return c.json({ error: "调研不存在" }, 404);
    return c.json({ data });
  });
