// 下注 API —— /api/bets
import { Hono } from "hono";
import { createServiceClient } from "@/server/lib/supabase";

// place_bet RPC 抛出的异常 → 友好中文提示
const ERR_MSG: Record<string, string> = {
  invalid_side:         "请选择「是」或「否」",
  invalid_amount:       "下注积分无效",
  user_not_found:       "用户不存在",
  insufficient_balance: "积分余额不足",
  side_locked:          "该调研已下注，只能继续下注此前的方向",
};

function mapError(msg: string): string {
  const key = Object.keys(ERR_MSG).find((k) => msg.includes(k));
  return key ? ERR_MSG[key] : msg;
}

export const betsRoute = new Hono()

  // GET /api/bets?user_id=UUID  —— 该用户的全部下注
  .get("/", async (c) => {
    const userId = c.req.query("user_id");
    if (!userId) return c.json({ error: "缺少 user_id" }, 400);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = createServiceClient() as any;
    const { data, error } = await sb
      .from("bets")
      .select("survey_id, side, amount, odds, status, won, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) return c.json({ error: error.message }, 500);
    // 强制数值字段为 number（numeric 列在部分序列化路径下可能为字符串）
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = (data ?? []).map((r: any) => ({
      survey_id: Number(r.survey_id),
      side: r.side,
      amount: Number(r.amount),
      odds: Number(r.odds),
      status: r.status,
      won: r.won,
    }));
    return c.json({ data: rows });
  })

  // POST /api/bets  body: { user_id, survey_id, side, amount, odds }  —— 下注（原子）
  .post("/", async (c) => {
    const body = await c.req.json().catch(() => null);
    const userId   = body?.user_id;
    const surveyId = Number(body?.survey_id);
    const side     = body?.side;
    const amount   = Number(body?.amount);
    const odds     = Number(body?.odds);
    if (!userId || isNaN(surveyId) || (side !== "yes" && side !== "no") || isNaN(amount) || amount <= 0) {
      return c.json({ error: "参数无效" }, 400);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = createServiceClient() as any;
    const { data, error } = await sb.rpc("place_bet", {
      p_user: userId, p_survey: surveyId, p_side: side, p_amount: amount, p_odds: isNaN(odds) ? 1 : odds,
    });
    if (error) return c.json({ error: mapError(error.message) }, 400);
    // data = { balance, bet }
    return c.json({ ok: true, balance: Number(data?.balance ?? 0), bet: data?.bet ?? null });
  });
