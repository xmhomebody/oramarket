import type { Metadata } from "next";
import { PointsPage } from "@/components/features/points/points-page";

export const metadata: Metadata = {
  title: "积分记录 — OraMarket",
  description: "查看您的积分流水：入分、赢的结算、输的结算与积分兑换。",
};

export default function PointsRoutePage() {
  return <PointsPage />;
}
