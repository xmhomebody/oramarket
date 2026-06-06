import type { Metadata } from "next";
import { PortfolioPage } from "@/components/features/portfolio/portfolio-page";

export const metadata: Metadata = {
  title: "我的调研组合 — OraMarket",
  description: "查看您的调研组合积分、关注的调研与下注记录。",
};

export default function PortfolioRoutePage() {
  return <PortfolioPage />;
}
