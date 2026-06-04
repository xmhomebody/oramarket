// 首页（Server Component）—— 负责 SEO 元数据，渲染交给客户端视图组件
import type { Metadata } from "next";
import { OraMarketHome } from "@/components/features/home/ora-market-home";

// 首页 SEO 元数据（默认简体中文，与原站一致）
export const metadata: Metadata = {
  title: "OraMarket — 中国预言机",
  description: "领先的中国预言机，专注政策结果、公众调查与社区预测。",
};

export default function HomePage() {
  return <OraMarketHome />;
}
