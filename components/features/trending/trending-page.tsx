"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useLanguage } from "@/components/providers/language-provider";
import { SiteHeader } from "@/components/layouts/site-header";
import { SiteNav } from "@/components/layouts/site-nav";
import { SurveyCard } from "@/components/features/_shared/survey-card";
import { surveyToCardData, type CardData, type Survey } from "@/lib/types/survey";
import { cn } from "@/lib/utils";

type SortKey   = "pool" | "newest" | "deadline";
type PeriodKey = "all" | "week" | "month" | "quarter";
type StatusKey = "all" | "active" | "settled";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "pool",     label: "积分量" },
  { key: "newest",   label: "最新发布" },
  { key: "deadline", label: "即将截止" },
];

const PERIOD_OPTIONS: { key: PeriodKey; label: string }[] = [
  { key: "all",     label: "全部" },
  { key: "week",    label: "本周" },
  { key: "month",   label: "本月" },
  { key: "quarter", label: "本季" },
];

const STATUS_OPTIONS: { key: StatusKey; label: string }[] = [
  { key: "all",     label: "全部" },
  { key: "active",  label: "进行中" },
  { key: "settled", label: "已结算" },
];

const TRENDING_TOPICS = [
  { key: "all",                  label: "全部",      category: "" },
  { key: "health-medical",       label: "健康医疗",  category: "health-medical" },
  { key: "education",            label: "教育政策",  category: "education" },
  { key: "policy-research",      label: "政策研究",  category: "policy-research" },
  { key: "public-services",      label: "公共服务",  category: "public-services" },
  { key: "business-survey",      label: "商业调查",  category: "business-survey" },
  { key: "satisfaction-survey",  label: "满意度",    category: "satisfaction-survey" },
  { key: "personal-enterprise",  label: "个人/企业", category: "personal-enterprise" },
];

const PER_PAGE = 40;

function Select<T extends string>({
  value, onChange, options, label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { key: T; label: string }[];
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.key === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative select-none">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 whitespace-nowrap rounded-md border border-brand-border bg-brand-card px-3 py-1.5 text-[12.5px] font-medium text-brand-text2 transition-colors hover:border-brand-blue-l"
      >
        <span className="mr-0.5 text-[11px] text-brand-muted">{label}：</span>
        <span className="font-semibold text-brand-blue-d">{current?.label}</span>
        <ChevronDown
          className={cn("size-2.5 opacity-50 transition-transform", open && "rotate-180")}
          strokeWidth={2.5}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+4px)] z-50 min-w-[130px] overflow-hidden rounded-lg border border-brand-border bg-brand-card shadow-[0_8px_24px_rgba(0,0,0,.1)]">
          {options.map((opt) => (
            <button
              key={opt.key}
              onClick={() => { onChange(opt.key); setOpen(false); }}
              className={cn(
                "block w-full px-[14px] py-2 text-left text-[12.5px] font-medium transition-colors",
                opt.key === value
                  ? "bg-brand-blue/[0.07] text-brand-blue"
                  : "text-brand-text2 hover:bg-black/[0.03]"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function TrendingPage() {
  const { lang, t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlTag = searchParams.get("tag") ?? "";

  const [sort, setSort]           = useState<SortKey>("pool");
  const [period, setPeriod]       = useState<PeriodKey>("all");
  const [status, setStatus]       = useState<StatusKey>("all");
  const [activeTopic, setActiveTopic] = useState("all");
  const [activeTag, setActiveTag] = useState(urlTag);
  const [displayCount, setDisplayCount] = useState(PER_PAGE);
  const [loadingMore, setLoadingMore]   = useState(false);
  const [fetching, setFetching]   = useState(false);
  const allCards = useRef<CardData[]>([]);
  const [, forceRender] = useState(0);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Fetch from DB whenever sort / status / lang changes
  useEffect(() => {
    setFetching(true);
    const params = new URLSearchParams({ sort, limit: "200" });
    if (status !== "all") params.set("status", status);
    fetch(`/api/surveys/list?${params.toString()}`)
      .then((r) => r.json())
      .then((json: { data?: Survey[] }) => {
        const rows = json.data ?? [];
        allCards.current = rows.map((s) =>
          surveyToCardData(s, lang as "zh-CN" | "zh-TW" | "en")
        );
        forceRender((n) => n + 1);
      })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [sort, status, lang]);

  // Sync activeTag when URL param changes
  useEffect(() => { setActiveTag(urlTag); }, [urlTag]);

  // Reset pagination when any filter changes
  useEffect(() => {
    setDisplayCount(PER_PAGE);
  }, [sort, period, status, activeTopic, activeTag]);

  const filteredCards = useCallback(() => {
    let cards = [...allCards.current];

    if (activeTag) {
      cards = cards.filter((c) => c.tags.includes(activeTag));
    } else if (activeTopic !== "all") {
      const tp = TRENDING_TOPICS.find((t) => t.key === activeTopic);
      if (tp?.category) cards = cards.filter((c) => c.categorySlug === tp.category);
    }

    if (period !== "all") {
      const periodDays: Record<PeriodKey, number> = { all: 9999, week: 7, month: 30, quarter: 90 };
      const maxDays = periodDays[period];
      const now = Date.now();
      cards = cards.filter((c) => {
        const diff = (new Date(c.dl).getTime() - now) / 86400000;
        return diff >= 0 && diff <= maxDays;
      });
    }

    if (sort === "pool")     cards.sort((a, b) => b.pool - a.pool);
    else if (sort === "newest")   cards.sort((a, b) => new Date(b.pub).getTime() - new Date(a.pub).getTime());
    else if (sort === "deadline") cards.sort((a, b) => new Date(a.dl).getTime() - new Date(b.dl).getTime());

    return cards;
  }, [sort, period, activeTopic, activeTag]);

  // Infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore) {
          const cards = filteredCards();
          if (displayCount < cards.length) {
            setLoadingMore(true);
            setTimeout(() => {
              setDisplayCount((c) => Math.min(c + PER_PAGE, cards.length));
              setLoadingMore(false);
            }, 400);
          }
        }
      },
      { rootMargin: "300px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [displayCount, loadingMore, filteredCards]);

  const allFiltered = filteredCards();
  const cards       = allFiltered.slice(0, displayCount);
  const totalCount  = allFiltered.length;

  const topicCounts = Object.fromEntries(
    TRENDING_TOPICS.map((tp) => [
      tp.key,
      tp.key === "all"
        ? allCards.current.length
        : allCards.current.filter((c) => c.categorySlug === tp.category).length,
    ])
  );

  return (
    <div className="min-h-screen bg-brand-bg font-sans text-brand-text">
      <SiteHeader />
      <SiteNav />

      {/* 面包屑 */}
      <div className="mx-auto max-w-[1400px] px-6 pt-[14px]">
        <div className="flex items-center gap-1.5 text-[12.5px] text-brand-muted">
          <button onClick={() => router.push("/")} className="text-brand-blue">
            首页
          </button>
          <ChevronRight className="size-3" strokeWidth={2} />
          <span className="font-semibold text-brand-text2">热门调研</span>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-6 pb-10 pt-4">
        {/* 标题行 + 筛选 */}
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 text-[13.5px] font-bold uppercase tracking-[0.8px] text-brand-blue-d">
              <span className="h-[15px] w-1 shrink-0 rounded-sm bg-brand-red" />
              热门调研
            </div>
            <span className="rounded-[5px] bg-black/[0.04] px-2 py-0.5 font-mono text-[11.5px] text-brand-muted">
              {totalCount} 条
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            <Select<SortKey>   value={sort}   onChange={setSort}   options={SORT_OPTIONS}   label="排序" />
            <Select<PeriodKey> value={period} onChange={setPeriod} options={PERIOD_OPTIONS} label="时段" />
            <Select<StatusKey> value={status} onChange={setStatus} options={STATUS_OPTIONS} label="状态" />
          </div>
        </div>

        {/* 话题 Chip 标签行 */}
        <div className="mb-[14px] flex flex-wrap gap-[7px] border-b border-brand-border pb-3">
          {activeTag && (
            <button
              onClick={() => { setActiveTag(""); router.replace("/trending"); }}
              className="flex items-center gap-1 rounded-[20px] border border-brand-blue bg-brand-blue px-[13px] py-1 text-[12.5px] font-medium text-white"
            >
              标签：{activeTag}
              <span className="ml-1 opacity-70">×</span>
            </button>
          )}
          {TRENDING_TOPICS.map((topic) => (
            <button
              key={topic.key}
              onClick={() => { setActiveTopic(topic.key); setActiveTag(""); router.replace("/trending"); }}
              className={cn(
                "rounded-[20px] border px-[13px] py-1 text-[12.5px] font-medium transition-colors",
                activeTopic === topic.key
                  ? "border-brand-blue bg-brand-blue text-white"
                  : "border-brand-border bg-brand-card text-brand-text2 hover:border-brand-blue-l hover:text-brand-blue"
              )}
            >
              {topic.label}
              <span
                className={cn(
                  "ml-[5px] font-mono text-[11px]",
                  activeTopic === topic.key ? "opacity-100" : "opacity-60"
                )}
              >
                {topicCounts[topic.key] ?? 0}
              </span>
            </button>
          ))}
        </div>

        {/* 卡片网格 */}
        {fetching ? (
          <div className="p-12 text-center">
            <div className="mx-auto size-[22px] animate-spin rounded-full border-[2.5px] border-brand-blue/20 border-t-brand-blue" />
          </div>
        ) : cards.length === 0 ? (
          <div className="p-12 text-center text-[14px] text-brand-muted">暂无符合条件的调研</div>
        ) : (
          <div className="mb-4 grid grid-cols-4 gap-3">
            {cards.map((d) => (
              <SurveyCard key={d.id} d={d} t={t} />
            ))}
          </div>
        )}

        {loadingMore && (
          <div className="p-[18px] text-center">
            <div className="mx-auto size-[22px] animate-spin rounded-full border-[2.5px] border-brand-blue/20 border-t-brand-blue" />
          </div>
        )}
        {!loadingMore && !fetching && displayCount >= totalCount && totalCount > 0 && (
          <div className="p-[18px] text-center text-[13px] text-brand-muted">— 全部加载完成 —</div>
        )}
        <div ref={sentinelRef} className="h-px" />
      </div>
    </div>
  );
}
