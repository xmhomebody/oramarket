import type { Metadata } from "next";
import { FollowsPage } from "@/components/features/follows/follows-page";

export const metadata: Metadata = {
  title: "关注的调研 — OraMarket",
  description: "管理您关注的调研，查看详情与下注走势。",
};

// 读取 from 参数（portfolio：来自调研组合；其余：来自下拉菜单/首页），用于返回按钮跳转
export default async function FollowsRoutePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;
  return <FollowsPage from={from ?? ""} />;
}
