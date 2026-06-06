import type { Metadata } from "next";
import { TrendingPage } from "@/components/features/trending/trending-page";

export const metadata: Metadata = {
  title: "热门调研 — OraMarket",
  description: "浏览积分量最高的热门调研预测。",
};

export default function TrendingRoutePage() {
  return <TrendingPage />;
}
