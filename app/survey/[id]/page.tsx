// 调研详情页（Server Component）—— 传入 id，渲染交给客户端组件
import type { Metadata } from "next";
import { SurveyDetail } from "@/components/features/survey/survey-detail";

export const metadata: Metadata = {
  title: "调研详情 — OraMarket",
  description: "查看调研详情，参与积分下注。",
};

// Next.js App Router 动态路由参数
export default async function SurveyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SurveyDetail id={Number(id)} />;
}
