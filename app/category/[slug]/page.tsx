import type { Metadata } from "next";
import { CategoryPage } from "@/components/features/category/category-page";
import { CATEGORY_META } from "@/lib/data/home";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const label = CATEGORY_META[slug]?.label || slug;
  return { title: `${label} — OraMarket`, description: `浏览${label}分类下的所有调研。` };
}

export default async function CategoryRoutePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <CategoryPage slug={slug} />;
}
