// 搜索结果页（Server Component）—— 读取查询参数 q，渲染交给客户端组件
import type { Metadata } from "next";
import { SearchResults } from "@/components/features/search/search-results";

export const metadata: Metadata = {
  title: "搜索结果 — OraMarket",
  description: "搜索调研、话题与事件，查看实时赔率。",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  return <SearchResults query={q ?? ""} />;
}
