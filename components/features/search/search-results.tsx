"use client";

// 搜索结果页 —— 布局参考目标图，沿用本站设计风格（积分/调研术语、配色、表头导航）
// 左：结果列表（行式），右：固定筛选侧栏（搜索框 + 排序方式 + 事件状态 + 清空筛选）
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/providers/language-provider";
import { HeaderActions } from "@/components/layouts/header-actions";
import { HeaderSearch } from "@/components/layouts/header-search";
import { TITLES_I18N, TOPICS_I18N } from "@/lib/i18n/dict";
import {
  STABLE_CARDS, AV_COLORS, fmt,
  SORT_OPTIONS, type SortKey, type PredictionCard,
} from "@/lib/data/home";

// 事件状态选项（含"全部"）
const STATUS_OPTS = [
  { key: "active", label: "进行中" },
  { key: "settled", label: "已结算" },
  { key: "all", label: "全部" },
] as const;
type StatusKey = (typeof STATUS_OPTS)[number]["key"];

// 顶部导航分类（与其它页一致）
const NAV_ITEMS = [
  { label: "公共服务", slug: "public-services" },
  { label: "政策研究", slug: "policy-research" },
  { label: "满意度调查", slug: "satisfaction-survey" },
  { label: "教育", slug: "education" },
  { label: "健康医疗", slug: "health-medical" },
  { label: "商业调查", slug: "business-survey" },
  { label: "个人/企业", slug: "personal-enterprise" },
];

// 基于 id 的确定性整数（用于"今日积分量"等派生值，避免 SSR 水合不一致）
const hash = (id: number, mod: number) => ((id * 2654435761) >>> 0) % mod;

// 排序方式图标
function SortIcon({ k }: { k: SortKey }) {
  const common = { width: 14, height: 14, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2 } as const;
  if (k === "volume24h") return <svg {...common}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>; // 活动波形
  if (k === "totalPool") return <svg {...common}><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" /></svg>; // 积分池
  return <svg {...common}><path d="M12 2v6M12 22v-4M4.93 10.93l4.24 4.24M14.83 8.83l4.24-4.24" /><circle cx="12" cy="12" r="3" /></svg>; // 最新发布
}

export function SearchResults({ query }: { query: string }) {
  const { lang } = useLanguage();
  const router = useRouter();

  const titles = TITLES_I18N[lang as keyof typeof TITLES_I18N] || TITLES_I18N["zh-CN"];
  const topics = TOPICS_I18N[lang as keyof typeof TOPICS_I18N] || TOPICS_I18N["zh-CN"];

  // 筛选状态
  const [activeTopic, setActiveTopic] = useState(-1); // -1 表示全部
  const [sort, setSort] = useState<SortKey>("volume24h");
  const [status, setStatus] = useState<StatusKey>("active");

  // 结果计算
  const results = useMemo(() => {
    let list: PredictionCard[] = [...STABLE_CARDS];

    // 关键词：匹配标题或话题标签
    const q = query.trim();
    if (q) {
      list = list.filter((c) => {
        const title = titles[c.titleIdx] || "";
        const tagNames = c.tagIndices.map((i) => topics[i] || "");
        return title.includes(q) || tagNames.some((tg) => tg.includes(q));
      });
    }

    // 话题分类筛选
    if (activeTopic >= 0) list = list.filter((c) => c.tagIndices.includes(activeTopic));

    // 事件状态（用 id 奇偶模拟 进行中/已结算）
    if (status === "active") list = list.filter((c) => c.id % 2 !== 0);
    else if (status === "settled") list = list.filter((c) => c.id % 2 === 0);

    // 排序（确定性）
    if (sort === "volume24h") list.sort((a, b) => (b.pool + hash(b.id, 200)) - (a.pool + hash(a.id, 200)));
    else if (sort === "totalPool") list.sort((a, b) => b.pool - a.pool);
    else list.sort((a, b) => new Date(b.pub).getTime() - new Date(a.pub).getTime());

    return list.slice(0, 60);
  }, [query, activeTopic, sort, status, titles, topics]);

  const clearFilters = () => { setActiveTopic(-1); setSort("volume24h"); setStatus("active"); };

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", fontFamily: "var(--font-fira-sans),sans-serif", color: "var(--text)" }}>

      {/* ── Header ── */}
      <header>
        <div className="h-inner">
          <a className="logo" href="/">
            <div className="logo-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="3.5" fill="#fff" />
                <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <span className="logo-text">Ora<em>Market</em></span>
          </a>
          <HeaderSearch defaultValue={query} />
          <HeaderActions />
        </div>
      </header>

      {/* ── 二级导航 ── */}
      <nav className="mnav">
        <div className="n-inner">
          <button className="nitem hot" onClick={() => router.push("/")}>
            热门
            <svg viewBox="0 0 24 24"><path d="M17.66 11.2c-.23-.3-.51-.56-.77-.82-.67-.6-1.43-1.03-2.07-1.66C13.33 7.26 13 4.85 13.95 3c-.95.23-1.78.75-2.49 1.32-2.59 2.04-3.49 5.56-2.46 8.73.04.14.08.27.08.42 0 .28-.18.52-.46.62-.27.1-.56.01-.74-.21a5.27 5.27 0 01-.88-2.31c-1.12 1.52-1.68 3.48-1.49 5.47.12 1.22.57 2.41 1.29 3.39.81 1.08 1.91 1.87 3.17 2.27 1.41.44 2.97.41 4.37-.06 1.6-.54 2.94-1.69 3.67-3.21.78-1.61.87-3.51.18-5.19-.23-.57-.56-1.09-.97-1.55z" /></svg>
          </button>
          <button className="nitem" onClick={() => router.push("/")}>最新</button>
          <div className="n-div" />
          {NAV_ITEMS.map((item) => (
            <button key={item.slug} className="nitem" onClick={() => router.push(`/category/${item.slug}`)}>{item.label}</button>
          ))}
        </div>
      </nav>

      {/* ── 主体：左结果列表 + 右筛选侧栏 ── */}
      <div className="wrap" style={{ padding: "20px 24px 40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 22, alignItems: "start" }}>

          {/* ── 左：结果列表 ── */}
          <div>
            {/* 标题行 */}
            <div style={{ marginBottom: 14 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--blue-d)", margin: 0 }}>
                {query ? <>“{query}” 的搜索结果</> : "探索热门调研与实时赔率"}
              </h1>
            </div>

            {/* 话题分类筛选条 */}
            <div className="filter-row" style={{ marginBottom: 4 }}>
              <button className={"f-tag" + (activeTopic === -1 ? " active" : "")} onClick={() => setActiveTopic(-1)}>全部</button>
              {topics.map((tp, i) => (
                <button key={i} className={"f-tag" + (activeTopic === i ? " active" : "")} onClick={() => setActiveTopic(i)}>{tp}</button>
              ))}
            </div>

            {/* 结果数量 */}
            <div style={{ fontSize: 12, color: "var(--muted)", margin: "12px 2px" }}>
              共 {results.length} 条结果
            </div>

            {/* 列表 */}
            <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
              {results.length === 0 ? (
                <div style={{ padding: 48, textAlign: "center", color: "var(--muted)", fontSize: 14 }}>
                  未找到匹配的调研
                </div>
              ) : results.map((c) => {
                const title = titles[c.titleIdx] || titles[0];
                const cat = c.tagIndices.map((i) => topics[i] || topics[0]);
                const today = Math.round(c.pool * 0.18) + hash(c.id, 5000);
                const leadYes = c.yesPct >= c.noPct;
                const leadPct = leadYes ? c.yesPct : c.noPct;
                const avatarColor = AV_COLORS[c.id % AV_COLORS.length];
                return (
                  <div
                    key={c.id}
                    onClick={() => router.push(`/survey/${c.id}`)}
                    className="search-row"
                    style={{
                      display: "flex", alignItems: "center", gap: 14, padding: "14px 18px",
                      borderBottom: "1px solid var(--border)", cursor: "pointer", transition: ".15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#F8FAFF")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    {/* 头像 */}
                    <div style={{
                      width: 44, height: 44, borderRadius: 10, flexShrink: 0, background: avatarColor,
                      color: "#fff", fontWeight: 700, fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {cat[0]?.[0] || "调"}
                    </div>

                    {/* 中间信息 */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11.5, color: "var(--muted)", marginBottom: 3 }}>
                        {cat.join(" · ")}
                      </div>
                      <div style={{
                        fontSize: 14.5, fontWeight: 600, color: "var(--blue-d)", marginBottom: 5,
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                      }}>
                        {title}
                      </div>
                      <div style={{ display: "flex", gap: 14, fontSize: 11.5, color: "var(--muted)", flexWrap: "wrap" }}>
                        <Stat icon="coin" text={`${fmt(c.pool)} 积分池`} />
                        <Stat icon="flame" text={`${fmt(today)} 今日`} />
                        <Stat icon="user" text={`${fmt(c.parts)} 参与`} />
                        <Stat icon="clock" text={`截止 ${c.dl}`} />
                      </div>
                    </div>

                    {/* 右：百分比 + 领先方 + 箭头 */}
                    <div style={{ textAlign: "right", flexShrink: 0, minWidth: 64 }}>
                      <div style={{ fontFamily: "var(--font-fira-code),monospace", fontSize: 20, fontWeight: 700, color: "var(--blue-d)", lineHeight: 1 }}>
                        {leadPct}%
                      </div>
                      <div style={{ fontSize: 11.5, fontWeight: 600, marginTop: 3, color: leadYes ? "#2563EB" : "var(--red)" }}>
                        {leadYes ? "YES" : "NO"}
                      </div>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" style={{ flexShrink: 0 }}>
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── 右：筛选侧栏 ── */}
          <div style={{ position: "sticky", top: 80 }}>
            <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: "16px 16px 18px" }}>
              {/* 侧栏内搜索框（浅色变体，白底深字 + 放大镜）*/}
              <HeaderSearch variant="light" defaultValue={query} />

              {/* 排序方式 */}
              <div style={{ marginTop: 18 }}>
                <div style={sectionLabel}>排序方式</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {SORT_OPTIONS.map((opt) => {
                    const on = sort === opt.key;
                    return (
                      <button key={opt.key} onClick={() => setSort(opt.key)} style={chipStyle(on)}>
                        <SortIcon k={opt.key} />
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 事件状态 */}
              <div style={{ marginTop: 18 }}>
                <div style={sectionLabel}>事件状态</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {STATUS_OPTS.map((opt) => {
                    const on = status === opt.key;
                    return (
                      <button key={opt.key} onClick={() => setStatus(opt.key)} style={chipStyle(on)}>
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 清空筛选 */}
            <div style={{ textAlign: "center", marginTop: 14 }}>
              <button onClick={clearFilters} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 12.5, fontFamily: "inherit" }}>
                清空筛选
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// 侧栏分区标题
const sectionLabel: React.CSSProperties = {
  fontSize: 12, fontWeight: 700, color: "var(--text2)", marginBottom: 10,
};

// 胶囊 chip 样式（选中/未选中）
function chipStyle(on: boolean): React.CSSProperties {
  return {
    display: "inline-flex", alignItems: "center", gap: 5,
    padding: "6px 11px", borderRadius: 7, cursor: "pointer",
    fontFamily: "inherit", fontSize: 12.5, fontWeight: 600, transition: ".15s",
    border: `1px solid ${on ? "var(--blue)" : "var(--border)"}`,
    background: on ? "var(--blue)" : "transparent",
    color: on ? "#fff" : "var(--text2)",
  };
}

// 行内小统计（带图标）
function Stat({ icon, text }: { icon: string; text: string }) {
  const common = { width: 12, height: 12, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2 } as const;
  const paths: Record<string, React.ReactNode> = {
    coin: <><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" /></>,
    flame: <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z" />,
    user: <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
    clock: <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>,
  };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      <svg {...common} style={{ opacity: .7 }}>{paths[icon]}</svg>
      {text}
    </span>
  );
}
