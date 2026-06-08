import type { Metadata } from "next";
import { LeaderboardPage } from "@/components/features/leaderboard/leaderboard-page";

export const metadata: Metadata = {
  title: "排行榜 — OraMarket",
  description: "查看按积分增长与准确率排名的 Top 10 预测者，支持日/周/月/年周期。",
};

export default function LeaderboardRoutePage() {
  return <LeaderboardPage />;
}
