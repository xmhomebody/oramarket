"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/providers/language-provider";
import { HeaderActions } from "@/components/layouts/header-actions";
import { Logo } from "@/components/layouts/site-logo";
import { HeaderSearch } from "@/components/layouts/header-search";
import { TITLES_I18N, TOPICS_I18N } from "@/lib/i18n/dict";
import {
  SORT_OPTIONS, PERIOD_OPTIONS, STATUS_OPTIONS,
  STABLE_CARDS,
  AV_COLORS,
  fmt,
  type SortKey, type PeriodKey, type StatusKey,
  type PredictionCard,
} from "@/lib/data/home";

// ── 下拉选择器（与分类页完全一致）──
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

// ── 调研卡片（与分类页一致）──
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

const PER_PAGE = 40;

// 按 tagIndices 统计各话题卡片数量（确定性，模块级）
const TOPIC_COUNTS = Array.from({ length: 10 }, (_, idx) =>
  STABLE_CARDS.filter((c) => c.tagIndices.includes(idx)).length
);

const LATEST_TOPICS = [
  { key: "all",        label: "全部",     count: STABLE_CARDS.length, topicIdx: -1 },
  { key: "healthcare", label: "医疗改革", count: TOPIC_COUNTS[0],     topicIdx: 0 },
  { key: "education",  label: "教育政策", count: TOPIC_COUNTS[1],     topicIdx: 1 },
  { key: "climate",    label: "气候行动", count: TOPIC_COUNTS[2],     topicIdx: 2 },
  { key: "tax",        label: "税收改革", count: TOPIC_COUNTS[3],     topicIdx: 3 },
  { key: "infra",      label: "基础设施", count: TOPIC_COUNTS[4],     topicIdx: 4 },
  { key: "digital",    label: "数字服务", count: TOPIC_COUNTS[5],     topicIdx: 5 },
  { key: "safety",     label: "公共安全", count: TOPIC_COUNTS[6],     topicIdx: 6 },
  { key: "housing",    label: "住房",     count: TOPIC_COUNTS[7],     topicIdx: 7 },
];

const NAV_ITEMS = [
  { label: "公共服务",   slug: "public-services" },
  { label: "政策研究",   slug: "policy-research" },
  { label: "满意度调查", slug: "satisfaction-survey" },
  { label: "教育",       slug: "education" },
  { label: "健康医疗",   slug: "health-medical" },
  { label: "商业调查",   slug: "business-survey" },
  { label: "个人/企业",  slug: "personal-enterprise" },
];

export function LatestPage() {
  const { lang, t } = useLanguage();
  const router = useRouter();

  // 默认：排序=最新发布、时段=每天、状态=进行中
  const [sort, setSort] = useState<SortKey>("latest");
  const [period, setPeriod] = useState<PeriodKey>("week");
  const [status, setStatus] = useState<StatusKey>("active");
  const [activeTopic, setActiveTopic] = useState("all");
  const [displayCount, setDisplayCount] = useState(PER_PAGE);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const topics = TOPICS_I18N[lang as keyof typeof TOPICS_I18N] || TOPICS_I18N["zh-CN"];
  const titles = TITLES_I18N[lang as keyof typeof TITLES_I18N] || TITLES_I18N["zh-CN"];
  const allCards = useRef<PredictionCard[]>(STABLE_CARDS);

  const filteredCards = useCallback(() => {
    let cards = [...allCards.current];

    if (status === "settled") cards = cards.filter((c) => c.id % 2 === 0);
    else if (status === "active") cards = cards.filter((c) => c.id % 2 !== 0);

    const periodDays: Record<PeriodKey, number> = { day: 1, week: 7, month: 30, quarter: 90, all: 9999 };
    const maxDays = periodDays[period];
    cards = cards.filter((c) => {
      const diff = Math.abs(new Date(c.dl).getTime() - new Date("2026-06-03").getTime()) / 86400000;
      return diff <= maxDays;
    });

    if (activeTopic !== "all") {
      const found = LATEST_TOPICS.find((tp) => tp.key === activeTopic);
      if (found && found.topicIdx >= 0) {
        cards = cards.filter((c) => c.tagIndices.includes(found.topicIdx));
      }
    }

    const h = (id: number) => ((id * 2654435761) >>> 0) % 200;
    if (sort === "volume24h") cards.sort((a, b) => (b.pool + h(b.id)) - (a.pool + h(a.id)));
    else if (sort === "totalPool") cards.sort((a, b) => b.pool - a.pool);
    else cards.sort((a, b) => new Date(b.pub).getTime() - new Date(a.pub).getTime());

    return cards;
  }, [sort, period, status, activeTopic]);

  useEffect(() => {
    setDisplayCount(PER_PAGE);
  }, [sort, period, status, activeTopic]);

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
  const activeTopicLabel = LATEST_TOPICS.find((tp) => tp.key === activeTopic)?.label || "全部";

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", fontFamily: "var(--font-fira-sans),sans-serif", color: "var(--text)" }}>

      {/* ── Header ── */}
      <header>
        <div className="h-inner">
          <Logo />
          <HeaderSearch />
          <HeaderActions />
        </div>
      </header>

      {/* ── 二级导航 ── */}
      <nav className="mnav">
        <div className="n-inner">
          <button className="nitem hot" onClick={() => router.push("/trending")}>
            热门
            <svg viewBox="0 0 24 24"><path d="M17.66 11.2c-.23-.3-.51-.56-.77-.82-.67-.6-1.43-1.03-2.07-1.66C13.33 7.26 13 4.85 13.95 3c-.95.23-1.78.75-2.49 1.32-2.59 2.04-3.49 5.56-2.46 8.73.04.14.08.27.08.42 0 .28-.18.52-.46.62-.27.1-.56.01-.74-.21a5.27 5.27 0 01-.88-2.31c-1.12 1.52-1.68 3.48-1.49 5.47.12 1.22.57 2.41 1.29 3.39.81 1.08 1.91 1.87 3.17 2.27 1.41.44 2.97.41 4.37-.06 1.6-.54 2.94-1.69 3.67-3.21.78-1.61.87-3.51.18-5.19-.23-.57-.56-1.09-.97-1.55z"/></svg>
          </button>
          <button className="nitem active" onClick={() => router.push("/latest")}>最新</button>
          <div className="n-div" />
          {NAV_ITEMS.map((item) => (
            <button
              key={item.slug}
              className="nitem"
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
          <span style={{ color: "var(--text2)", fontWeight: 600 }}>最新调研</span>
        </div>
      </div>

      {/* ── 主体：全宽卡片列表 ── */}
      <div className="wrap" style={{ padding: "16px 24px 40px" }}>
        {/* 标题行 + 筛选 */}
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="sec-title" style={{ marginBottom: 0 }}>最新调研</div>
            <span style={{
              fontSize: 11.5, fontFamily: "var(--font-fira-code),monospace",
              color: "var(--muted)", background: "rgba(0,0,0,.04)",
              padding: "2px 8px", borderRadius: 5,
            }}>
              {totalCount} 条
            </span>
          </div>

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

        {/* 话题 Chip 标签行 */}
        <div className="filter-row">
          {LATEST_TOPICS.map((topic) => (
            <button
              key={topic.key}
              className={"f-tag" + (activeTopic === topic.key ? " active" : "")}
              onClick={() => setActiveTopic(topic.key)}
            >
              {topic.label}
              <span style={{
                marginLeft: 5,
                fontSize: 11,
                fontFamily: "var(--font-fira-code),monospace",
                opacity: activeTopic === topic.key ? 1 : 0.6,
              }}>
                {topic.count}
              </span>
            </button>
          ))}
        </div>

        {/* 卡片网格 */}
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

        {loading && (
          <div className="load-ind"><div className="spinner"></div></div>
        )}
        {!loading && displayCount >= totalCount && totalCount > 0 && (
          <div className="load-ind" style={{ color: "var(--muted)" }}>— 全部加载完成 —</div>
        )}
        <div ref={sentinelRef} style={{ height: 1 }} />
      </div>
    </div>
  );
}
