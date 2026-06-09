// 关注调研 API —— /api/follows
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { Hono } from "hono";
import { createServiceClient } from "@/server/lib/supabase";

export const followsRoute = new Hono()

  // GET /api/follows?user_id=UUID  —— 获取该用户的关注调研 ID 列表（最新关注在最前）
  .get("/", async (c) => {
    const userId = c.req.query("user_id");
    if (!userId) return c.json({ error: "缺少 user_id" }, 400);
    const sb = createServiceClient() as any;
    const { data, error } = await sb
      .from("user_follows")
      .select("survey_id, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) return c.json({ error: error.message }, 500);
    return c.json({ data: (data ?? []).map((r: any) => r.survey_id) });
  })

  // POST /api/follows/:survey_id?user_id=UUID  —— 关注
  .post("/:survey_id", async (c) => {
    const userId   = c.req.query("user_id");
    const surveyId = parseInt(c.req.param("survey_id"));
    if (!userId || isNaN(surveyId)) return c.json({ error: "参数无效" }, 400);
    const sb = createServiceClient() as any;
    const { error } = await sb.from("user_follows").insert({ user_id: userId, survey_id: surveyId });
    if (error) return c.json({ error: error.message }, 500);
    return c.json({ ok: true });
  })

  // DELETE /api/follows/:survey_id?user_id=UUID  —— 取消关注
  .delete("/:survey_id", async (c) => {
    const userId   = c.req.query("user_id");
    const surveyId = parseInt(c.req.param("survey_id"));
    if (!userId || isNaN(surveyId)) return c.json({ error: "参数无效" }, 400);
    const sb = createServiceClient() as any;
    const { error } = await sb.from("user_follows").delete().eq("user_id", userId).eq("survey_id", surveyId);
    if (error) return c.json({ error: error.message }, 500);
    return c.json({ ok: true });
  });
