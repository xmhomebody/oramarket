"use client";

// 分类调研页 —— 设计风格与首页完全一致
// 左侧：话题标签菜单（含数量）
// 右侧：带三个下拉筛选的调研卡片网格
import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/providers/language-provider";
import { HeaderActions } from "@/components/layouts/header-actions";
import { Logo } from "@/components/layouts/site-logo";
import { HeaderSearch } from "@/components/layouts/header-search";
import { TITLES_I18N, TOPICS_I18N } from "@/lib/i18n/dict";
import {
  CATEGORY_META,
  SORT_OPTIONS, PERIOD_OPTIONS, STATUS_OPTIONS,
  STABLE_CARDS,
  AV_COLORS,
  fmt,
  type SortKey, type PeriodKey, type StatusKey,
  type PredictionCard,
} from "@/lib/data/home";

// ── 下拉选择器组件（复用三次）──
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

  // 点击外部关闭
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", userSelect: "none" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "6px 12px", borderRadius: 6, cursor: "pointer",
          border: "1px solid var(--border)", background: "var(--card)",
          fontFamily: "inherit", fontSize: 12.5, fontWeight: 500,
          color: "var(--text2)", transition: ".15s", whiteSpace: "nowrap",
        }}
      >
        <span style={{ color: "var(--muted)", fontSize: 11, marginRight: 2 }}>{label}：</span>
        <span style={{ color: "var(--blue-d)", fontWeight: 600 }}>{current?.label}</span>
        <svg
          width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          style={{ transition: ".15s", transform: open ? "rotate(180deg)" : "none", opacity: .5 }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 50,
          background: "var(--card)", border: "1px solid var(--border)",
          borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,.1)",
          overflow: "hidden", minWidth: 130,
        }}>
          {options.map((opt) => (
            <button
              key={opt.key}
              onClick={() => { onChange(opt.key); setOpen(false); }}
              style={{
                display: "block", width: "100%", textAlign: "left",
                padding: "8px 14px", border: "none", cursor: "pointer",
                fontFamily: "inherit", fontSize: 12.5, fontWeight: 500,
                background: opt.key === value ? "rgba(30,64,175,.07)" : "transparent",
                color: opt.key === value ? "var(--blue)" : "var(--text2)",
                transition: ".1s",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── 调研卡片（与首页 mkCard 视觉完全一致）──
function SurveyCard({ d, topics, titles, t }: {
  d: PredictionCard;
  topics: string[];
  titles: string[];
  t: (k: string) => string;
}) {
  const router = useRouter();
  const avs = AV_COLORS.slice(0, 3).map((c, i) => (
    <div key={i} className="av" style={{ background: c }}>{String.fromCharCode(65 + i)}</div>
  ));
  const cardTitle = titles[d.titleIdx] || titles[0];
  const tags = d.tagIndices.map((idx) => topics[idx] || topics[0]);

  return (
    <div
      className="pred-card"
      style={{ cursor: "pointer", animationDelay: (d.id % 40) * 20 + "ms" }}
      onClick={() => router.push(`/survey/${d.id}`)}
    >
      <div className="pc-title">{cardTitle}</div>
      <div className="pc-pool">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2">
          <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" />
        </svg>
        <span className="pc-pool-n">{fmt(d.pool)}</span>
        <span className="pc-pool-l">{t("card_pts_pool")}</span>
      </div>
      <div className="pc-vote">
        <div className="pc-vrow">
          <div className="pc-vlbl"><span className="pc-vtag y">YES</span><span className="pc-vodds">×{d.yesOdds}</span></div>
          <span className="pc-vpct y">{d.yesPct}%</span>
        </div>
        <div className="pc-bar"><div className="pc-bary" style={{ width: `${d.yesPct}%` }}></div></div>
        <div className="pc-vrow" style={{ marginTop: 3 }}>
          <div className="pc-vlbl"><span className="pc-vtag n">NO</span><span className="pc-vodds">×{d.noOdds}</span></div>
          <span className="pc-vpct n">{d.noPct}%</span>
        </div>
      </div>
      <div className="pc-parts">
        <div className="av-stack">{avs}</div>
        <span className="pc-cnt">{fmt(d.parts)} {t("card_joined")}</span>
      </div>
      <div className="pc-tags">{tags.map((tg, i) => <span key={i} className="pc-tag">{tg}</span>)}</div>
      <div className="pc-foot">
        <span className="pc-pub">{t("card_published")}: {d.pub}</span>
        <span className="pc-dl">{t("card_closes")}: {d.dl}</span>
      </div>
    </div>
  );
}

interface CategoryPageProps {
  slug: string;
}

const PER_PAGE = 40;

// 所有导航分类：slug → 路由（与首页 NAV_ROUTES 保持一致）
const NAV_ITEMS = [
  { label: "公共服务",   slug: "public-services" },
  { label: "政策研究",   slug: "policy-research" },
  { label: "满意度调查", slug: "satisfaction-survey" },
  { label: "教育",       slug: "education" },
  { label: "健康医疗",   slug: "health-medical" },
  { label: "商业调查",   slug: "business-survey" },
  { label: "个人/企业",  slug: "personal-enterprise" },
];

export function CategoryPage({ slug }: CategoryPageProps) {
  const { lang, t } = useLanguage();
  const router = useRouter();

  // 左侧选中的话题
  const [activeTopic, setActiveTopic] = useState("all");
  // 三个筛选器状态
  const [sort, setSort] = useState<SortKey>("volume24h");
  const [period, setPeriod] = useState<PeriodKey>("all");
  const [status, setStatus] = useState<StatusKey>("active");
  // 当前显示的卡片数量（懒加载）
  const [displayCount, setDisplayCount] = useState(PER_PAGE);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // 获取话题/标题数组（跟随语言）
  const topics = TOPICS_I18N[lang as keyof typeof TOPICS_I18N] || TOPICS_I18N["zh-CN"];
  const titles = TITLES_I18N[lang as keyof typeof TITLES_I18N] || TITLES_I18N["zh-CN"];

  // 直接引用模块级稳定数据，SSR 和客户端使用同一份，彻底消除水合不一致
  const allCards = useRef<PredictionCard[]>(STABLE_CARDS);

  // 按筛选/排序处理卡片（状态变化时重新计算）
  const filteredCards = useCallback(() => {
    let cards = [...allCards.current];

    if (status === "settled") cards = cards.filter((c) => c.id % 2 === 0);
    else if (status === "active") cards = cards.filter((c) => c.id % 2 !== 0);

    // 时间范围筛选（用 dl 天数粗略模拟）
    const periodDays: Record<PeriodKey, number> = { day: 1, week: 7, month: 30, quarter: 90, all: 9999 };
    const maxDays = periodDays[period];
    cards = cards.filter((c) => {
      const diff = Math.abs(new Date(c.dl).getTime() - new Date("2026-06-03").getTime()) / 86400000;
      return diff <= maxDays;
    });

    // 排序（用确定性哈希代替 Math.random，避免 SSR/客户端水合不一致）
    // 24h积分量：pool + 基于 id 的伪随机偏移（确定性）
    const h = (id: number) => ((id * 2654435761) >>> 0) % 200;
    if (sort === "volume24h") cards.sort((a, b) => (b.pool + h(b.id)) - (a.pool + h(a.id)));
    else if (sort === "totalPool") cards.sort((a, b) => b.pool - a.pool);
    else cards.sort((a, b) => new Date(b.pub).getTime() - new Date(a.pub).getTime());

    return cards;
  }, [sort, period, status]);

  // 当筛选条件变化，重置分页
  useEffect(() => {
    setDisplayCount(PER_PAGE);
  }, [sort, period, status, activeTopic]);

  // 无限滚动：IntersectionObserver 观察哨兵元素
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) {
          const cards = filteredCards();
          if (displayCount < cards.length) {
            setLoading(true);
            setTimeout(() => {
              setDisplayCount((c) => Math.min(c + PER_PAGE, cards.length));
              setLoading(false);
            }, 400);
          }
        }
      },
      { rootMargin: "300px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [displayCount, loading, filteredCards]);

  const cards = filteredCards().slice(0, displayCount);
  const totalCount = filteredCards().length;
  // 从 CATEGORY_META 取当前分类的名称和话题列表（找不到则提供默认值）
  const meta = CATEGORY_META[slug];
  const categoryLabel = meta?.label || slug;
  const categoryTopics = meta?.topics || [{ key: "all", label: "全部", count: STABLE_CARDS.length }];

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", fontFamily: "var(--font-fira-sans),sans-serif", color: "var(--text)" }}>

      {/* ── Header（与首页一致）── */}
      <header>
        <div className="h-inner">
          <Logo />
          <HeaderSearch />
          <HeaderActions />
        </div>
      </header>

      {/* ── 二级导航（当前分类高亮，其余可点击跳转）── */}
      <nav className="mnav">
        <div className="n-inner">
          <button className="nitem hot" onClick={() => router.push("/trending")}>
            热门
          </button>
          <button className="nitem" onClick={() => router.push("/latest")}>最新</button>
          <div className="n-div" />
          {NAV_ITEMS.map((item) => (
            <button
              key={item.slug}
              className={"nitem" + (item.slug === slug ? " active" : "")}
              onClick={() => router.push(`/category/${item.slug}`)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      {/* ── 面包屑 ── */}
      <div className="wrap" style={{ padding: "14px 24px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--muted)" }}>
          <button onClick={() => router.push("/")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--blue)", fontFamily: "inherit", fontSize: 12.5 }}>
            首页
          </button>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
          <span style={{ color: "var(--text2)", fontWeight: 600 }}>{categoryLabel}</span>
        </div>
      </div>

      {/* ── 主体：左侧边栏 + 右侧列表 ── */}
      <div className="wrap" style={{ padding: "16px 24px 40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 20, alignItems: "start" }}>

          {/* ── 左侧：话题标签菜单 ── */}
          <div style={{
            background: "var(--card)", border: "1px solid var(--border)",
            borderRadius: 12, overflow: "hidden", position: "sticky", top: 80,
          }}>
            {/* 菜单标题 */}
            <div style={{
              background: "var(--blue)", padding: "10px 14px",
              fontSize: 12, fontWeight: 700, color: "#fff",
              textTransform: "uppercase", letterSpacing: ".5px",
            }}>
              {categoryLabel}
            </div>
            {/* 话题列表 */}
            {categoryTopics.map((topic) => {
              const isActive = activeTopic === topic.key;
              return (
                <button
                  key={topic.key}
                  onClick={() => setActiveTopic(topic.key)}
                  style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    width: "100%", padding: "9px 14px",
                    borderBottom: "1px solid var(--border)", border: "none",
                    background: isActive ? "rgba(30,64,175,.07)" : "transparent",
                    cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                    transition: ".15s",
                    borderLeft: isActive ? "3px solid var(--blue)" : "3px solid transparent",
                  }}
                >
                  <span style={{
                    fontSize: 13, fontWeight: isActive ? 700 : 500,
                    color: isActive ? "var(--blue)" : "var(--text2)",
                  }}>
                    {topic.label}
                  </span>
                  <span style={{
                    fontSize: 11, fontFamily: "var(--font-fira-code),monospace",
                    color: isActive ? "var(--blue)" : "var(--muted)",
                    background: isActive ? "rgba(30,64,175,.1)" : "rgba(0,0,0,.04)",
                    padding: "1px 6px", borderRadius: 4,
                  }}>
                    {topic.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ── 右侧：标题 + 筛选 + 卡片网格 ── */}
          <div>
            {/* 区块标题行 */}
            <div style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10,
            }}>
              {/* 左：sec-title 风格标题 + 数量 */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div className="sec-title" style={{ marginBottom: 0 }}>
                  {categoryLabel}
                </div>
                <span style={{
                  fontSize: 11.5, fontFamily: "var(--font-fira-code),monospace",
                  color: "var(--muted)", background: "rgba(0,0,0,.04)",
                  padding: "2px 8px", borderRadius: 5,
                }}>
                  {totalCount} 条
                </span>
              </div>

              {/* 右：三个下拉筛选 */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Select<SortKey>
                  value={sort} onChange={setSort}
                  options={SORT_OPTIONS} label="排序"
                />
                <Select<PeriodKey>
                  value={period} onChange={setPeriod}
                  options={PERIOD_OPTIONS} label="时段"
                />
                <Select<StatusKey>
                  value={status} onChange={setStatus}
                  options={STATUS_OPTIONS} label="状态"
                />
              </div>
            </div>

            {/* 卡片网格（与首页 card-grid 完全一致） */}
            {cards.length === 0 ? (
              <div style={{ textAlign: "center", padding: 48, color: "var(--muted)", fontSize: 14 }}>
                暂无符合条件的调研
              </div>
            ) : (
              <div className="card-grid">
                {cards.map((d) => (
                  <SurveyCard key={d.id} d={d} topics={topics} titles={titles} t={t} />
                ))}
              </div>
            )}

            {/* 加载指示 / 全部加载完 */}
            {loading && (
              <div className="load-ind"><div className="spinner"></div></div>
            )}
            {!loading && displayCount >= totalCount && totalCount > 0 && (
              <div className="load-ind" style={{ color: "var(--muted)" }}>— 全部加载完成 —</div>
            )}
            {/* 无限滚动哨兵 */}
            <div ref={sentinelRef} style={{ height: 1 }} />
          </div>
        </div>
      </div>
    </div>
  );
}
