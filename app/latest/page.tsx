import type { Metadata } from "next";
import { LatestPage } from "@/components/features/latest/latest-page";

export const metadata: Metadata = {
  title: "最新调研 — OraMarket",
  description: "浏览最新发布的调研预测，按时间、状态筛选。",
};

export default function LatestRoutePage() {
  return <LatestPage />;
}
