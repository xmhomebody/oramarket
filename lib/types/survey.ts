// 调研相关共享类型
// CardData：SurveyCard 渲染所需的扁平数据，DB 行和旧 STABLE_CARDS 均可映射到此类型。
// Survey：与 public.surveys 表行对应（DB 查询结果）。

export interface CardData {
  id: number;
  title: string;           // 当前语言的标题
  categorySlug: string;
  tags: string[];          // 已解析的标签字符串
  pool: number;
  yesPct: number;
  noPct: number;
  yesOdds: string;
  noOdds: string;
  parts: number;
  pub: string;             // YYYY-MM-DD
  dl: string;              // YYYY-MM-DD
  status: "active" | "settled" | "cancelled";
}

export interface TrendData {
  dates: string[];
  yes_pcts: number[];
  pools: number[];
  parts_counts: number[];
}

// DB 行类型（与 types/database.ts 中 surveys.Row 一致，便于在组件层直接使用）
export interface Survey {
  id: number;
  title_zh_cn: string;
  title_zh_tw: string | null;
  title_en: string | null;
  description: string | null;
  category_slug: string;
  tags: string[];
  yes_pct: number;
  pool: number;
  parts: number;
  status: string;
  pub_date: string;
  deadline_date: string;
  trend_data: TrendData | null;
  created_at: string;
  updated_at: string;
}

type Lang = "zh-CN" | "zh-TW" | "en";

export function surveyToCardData(s: Survey, lang: Lang): CardData {
  const noPct = 100 - s.yes_pct;
  const title =
    lang === "zh-TW" ? (s.title_zh_tw ?? s.title_zh_cn) :
    lang === "en"    ? (s.title_en    ?? s.title_zh_cn) :
    s.title_zh_cn;
  return {
    id: Number(s.id),
    title,
    categorySlug: s.category_slug,
    tags: s.tags,
    pool: s.pool,
    yesPct: s.yes_pct,
    noPct,
    yesOdds: (100 / s.yes_pct).toFixed(2),
    noOdds:  (100 / noPct).toFixed(2),
    parts: s.parts,
    pub: s.pub_date,
    dl: s.deadline_date,
    status: s.status as CardData["status"],
  };
}
