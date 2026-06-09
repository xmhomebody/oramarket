// 下注相关共享类型与计算
// 积分模型：积分余额(profiles.balance) + 调研组合积分(sum active bets.amount) = 总积分价值

export type BetSide = "yes" | "no";
export type BetStatus = "active" | "settled" | "cancelled";

// 与 GET /api/bets 返回的行对应
export interface Bet {
  survey_id: number;
  side: BetSide;
  amount: number;   // 累计下注积分
  odds: number;     // 入场赔率
  status: BetStatus;
  won: boolean | null;
}

// 调研组合积分 = 进行中下注的金额之和
export function portfolioFromBets(bets: Bet[]): number {
  return bets
    .filter((b) => b.status === "active")
    .reduce((sum, b) => sum + Number(b.amount), 0);
}

// 进行中下注的浮动盈亏：(当前胜率 - 入场隐含胜率) / 入场隐含胜率 × 下注
export function floatingPnl(bet: Bet, curPct: number): number {
  const entryPct = bet.odds > 0 ? 100 / bet.odds : curPct;
  if (entryPct <= 0) return 0;
  return Math.round((bet.amount * (curPct - entryPct)) / entryPct);
}
