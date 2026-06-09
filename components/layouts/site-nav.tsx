"use client";

// 站点二级导航（共享）—— 蓝底横向菜单：热门 / 最新 / 分隔线 / 各分类。
// active 态由 usePathname() 自动判定，文案走 useLanguage() 的 t()，支持多语言。
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/components/providers/language-provider";
import { cn } from "@/lib/utils";

// 分类导航项：i18n key → 路由 slug
const CATEGORIES: { key: string; slug: string }[] = [
  { key: "nav_public_services", slug: "public-services" },
  { key: "nav_policy_research", slug: "policy-research" },
  { key: "nav_satisfaction_survey", slug: "satisfaction-survey" },
  { key: "nav_education", slug: "education" },
  { key: "nav_health_medical", slug: "health-medical" },
  { key: "nav_business_survey", slug: "business-survey" },
  { key: "nav_personal_enterprise", slug: "personal-enterprise" },
];

// 导航项基础样式（复刻原站 .nitem）
const NITEM =
  "whitespace-nowrap rounded px-[13px] py-[5px] text-[13px] font-medium text-white/[0.78] transition-colors hover:bg-white/15 hover:text-white";

export function SiteNav() {
  const { t } = useLanguage();
  const pathname = usePathname();

  // 热门在首页与 /trending 均高亮
  const hotActive = pathname === "/" || pathname === "/trending";

  return (
    <nav className="border-b border-white/[0.12] bg-brand-blue">
      <div className="mx-auto flex h-[42px] max-w-[1400px] items-center gap-[2px] px-6">
        {/* 热门 */}
        <Link
          href="/trending"
          className={cn(NITEM, "font-bold", hotActive && "bg-white/15 text-white")}
        >
          {t("nav_trending")}
        </Link>

        {/* 最新 */}
        <Link
          href="/latest"
          className={cn(NITEM, pathname === "/latest" && "bg-white/15 text-white")}
        >
          {t("nav_latest")}
        </Link>

        {/* 分隔线 */}
        <div className="mx-[6px] h-[18px] w-px bg-white/25" />

        {/* 分类 */}
        {CATEGORIES.map((c) => (
          <Link
            key={c.slug}
            href={`/category/${c.slug}`}
            className={cn(NITEM, pathname === `/category/${c.slug}` && "bg-white/15 text-white")}
          >
            {t(c.key)}
          </Link>
        ))}
      </div>
    </nav>
  );
}
