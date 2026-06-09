"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/providers/language-provider";
import { HeaderActions } from "@/components/layouts/header-actions";
import { Logo } from "@/components/layouts/site-logo";
import { HeaderSearch } from "@/components/layouts/header-search";
import { TITLES_I18N, TOPICS_I18N } from "@/lib/i18n/dict";
import { fuzzyScore } from "@/lib/search";
import {
  STABLE_CARDS, AV_COLORS, fmt,
  SORT_OPTIONS, type SortKey,
} from "@/lib/data/home";

const STATUS_OPTS = [
  { key: "active",  label: "进行中" },
  { key: "settled", label: "已结算" },
  { key: "all",     label: "全部" },
] as const;
type StatusKey = (typeof STATUS_OPTS)[number]["key"];

const NAV_ITEMS = [
  { label: "公共服务",   slug: "public-services" },
  { label: "政策研究",   slug: "policy-research" },
  { label: "满意度调查", slug: "satisfaction-survey" },
  { label: "教育",       slug: "education" },
  { label: "健康医疗",   slug: "health-medical" },
  { label: "商业调查",   slug: "business-survey" },
  { label: "个人/企业",  slug: "personal-enterprise" },
];

const hash = (id: number, mod: number) => ((id * 2654435761) >>> 0) % mod;

function SortIcon({ k }: { k: SortKey }) {
  const p = { width: 14, height: 14, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2 } as const;
  if (k === "volume24h") return <svg {...p}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>;
  if (k === "totalPool") return <svg {...p}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" /></svg>;
  return <svg {...p}><path d="M12 2v6M12 22v-4M4.93 10.93l4.24 4.24M14.83 8.83l4.24-4.24" /><circle cx="12" cy="12" r="3" /></svg>;
}

export function SearchResults({ query }: { query: string }) {
  const { lang } = useLanguage();
  const router = useRouter();

  const titles = TITLES_I18N[lang as keyof typeof TITLES_I18N] || TITLES_I18N["zh-CN"];
  const topics  = TOPICS_I18N[lang as keyof typeof TOPICS_I18N]  || TOPICS_I18N["zh-CN"];

  const [activeTopic, setActiveTopic] = useState(-1);
  const [sort,   setSort]   = useState<SortKey>("volume24h");
  const [status, setStatus] = useState<StatusKey>("active");

  // 关键词模糊过滤后的基础列表（按相关度排序，用于统计各话题数量）
  const baseList = useMemo(() => {
    const q = query.trim();
    if (!q) return [...STABLE_CARDS];
    return STABLE_CARDS
      .map((c) => {
        const title = titles[c.titleIdx] || "";
        const tagNames = c.tagIndices.map((i) => topics[i] || "");
        return { c, score: fuzzyScore(q, title + " " + tagNames.join(" ")) };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.c);
  }, [query, titles, topics]);

  // 标签按搜索结果汇总：只保留结果中出现的话题，按命中数降序
  const presentTopics = useMemo(
    () => topics
      .map((name, i) => ({ name, i, count: baseList.filter((c) => c.tagIndices.includes(i)).length }))
      .filter((t) => t.count > 0)
      .sort((a, b) => b.count - a.count),
    [baseList, topics]
  );

  // 切换搜索词时重置话题筛选（避免选中的话题在新结果中不存在）
  useEffect(() => { setActiveTopic(-1); }, [query]);

  const results = useMemo(() => {
    let list = [...baseList];
    if (activeTopic >= 0) list = list.filter((c) => c.tagIndices.includes(activeTopic));
    if (status === "active")  list = list.filter((c) => c.id % 2 !== 0);
    else if (status === "settled") list = list.filter((c) => c.id % 2 === 0);
    if (sort === "volume24h") list.sort((a, b) => (b.pool + hash(b.id, 200)) - (a.pool + hash(a.id, 200)));
    else if (sort === "totalPool") list.sort((a, b) => b.pool - a.pool);
    else list.sort((a, b) => new Date(b.pub).getTime() - new Date(a.pub).getTime());
    return list.slice(0, 60);
  }, [baseList, activeTopic, sort, status]);

  const clearFilters = () => { setActiveTopic(-1); setSort("volume24h"); setStatus("active"); };

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", fontFamily: "var(--font-fira-sans),sans-serif", color: "var(--text)" }}>

      <header>
        <div className="h-inner">
          <Logo />
          <HeaderSearch defaultValue={query} />
          <HeaderActions />
        </div>
      </header>

      <nav className="mnav">
        <div className="n-inner">
          <button className="nitem hot" onClick={() => router.push("/trending")}>
            热门
          </button>
          <button className="nitem" onClick={() => router.push("/latest")}>最新</button>
          <div className="n-div" />
          {NAV_ITEMS.map((item) => (
            <button key={item.slug} className="nitem" onClick={() => router.push(`/category/${item.slug}`)}>{item.label}</button>
          ))}
        </div>
      </nav>

      <div className="wrap" style={{ padding: "20px 24px 40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 22, alignItems: "start" }}>

          {/* ── 左：结果列表 ── */}
          <div>
            <div style={{ marginBottom: 12 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--blue-d)", margin: 0 }}>
                {query ? <>"{query}" 的搜索结果</> : "探索热门调研与实时赔率"}
              </h1>
            </div>

            {/* 话题分类 chip 行（仅展示搜索结果中出现的话题，按命中数降序） */}
            {presentTopics.length > 0 && (
              <div className="filter-row" style={{ marginBottom: 4 }}>
                <button
                  className={"f-tag" + (activeTopic === -1 ? " active" : "")}
                  onClick={() => setActiveTopic(-1)}
                >
                  全部
                  <span style={{ marginLeft: 5, fontSize: 11, fontFamily: "var(--font-fira-code),monospace", opacity: activeTopic === -1 ? 1 : 0.6 }}>
                    {baseList.length}
                  </span>
                </button>
                {presentTopics.map((tp) => (
                  <button
                    key={tp.i}
                    className={"f-tag" + (activeTopic === tp.i ? " active" : "")}
                    onClick={() => setActiveTopic(tp.i)}
                  >
                    {tp.name}
                    <span style={{ marginLeft: 5, fontSize: 11, fontFamily: "var(--font-fira-code),monospace", opacity: activeTopic === tp.i ? 1 : 0.6 }}>
                      {tp.count}
                    </span>
                  </button>
                ))}
              </div>
            )}

            <div style={{ fontSize: 12, color: "var(--muted)", margin: "12px 2px" }}>
              共 {results.length} 条结果
            </div>

            {/* 结果列表 */}
            <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
              {results.length === 0 ? (
                <div style={{ padding: 48, textAlign: "center", color: "var(--muted)", fontSize: 14 }}>
                  未找到匹配的调研
                </div>
              ) : results.map((c) => {
                const title    = titles[c.titleIdx] || titles[0];
                const cat      = c.tagIndices.map((i) => topics[i] || topics[0]);
                const isSettled = c.id % 2 === 0;
                const avatarColor = AV_COLORS[c.id % AV_COLORS.length];

                return (
                  <div
                    key={c.id}
                    style={{ position: "relative", overflow: "hidden", borderBottom: "1px solid var(--border)" }}
                    onClick={() => router.push(`/survey/${c.id}`)}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#F8FAFF")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    className="search-row"
                  >
                    {/* 已结算斜角标 */}
                    {isSettled && (
                      <div style={{
                        position: "absolute", top: 13, left: -26, width: 90,
                        background: "var(--muted)", color: "#fff",
                        fontSize: 9.5, fontWeight: 700, letterSpacing: ".5px",
                        textAlign: "center", padding: "3px 0",
                        transform: "rotate(-45deg)", pointerEvents: "none",
                      }}>
                        已结算
                      </div>
                    )}

                    <div style={{ display: "flex", alignItems: "stretch", gap: 14, padding: "14px 18px", cursor: "pointer" }}>
                      {/* 头像 */}
                      <div style={{
                        width: 42, height: 42, borderRadius: 10, flexShrink: 0, background: avatarColor,
                        color: "#fff", fontWeight: 700, fontSize: 17,
                        display: "flex", alignItems: "center", justifyContent: "center", alignSelf: "center",
                      }}>
                        {cat[0]?.[0] || "调"}
                      </div>

                      {/* 中间：标题 + 小字 + 标签 */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 14.5, fontWeight: 600, color: "var(--blue-d)", marginBottom: 6,
                          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                        }}>
                          {title}
                        </div>

                        {/* 元信息行（同调研详情） */}
                        <div style={{ display: "flex", gap: 14, fontSize: 12, color: "var(--text2)", flexWrap: "wrap", alignItems: "center", marginBottom: 7 }}>
                          {/* 积分池 */}
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.8">
                              <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" />
                            </svg>
                            <span style={{ fontFamily: "var(--font-fira-code),monospace", color: "var(--blue)", fontWeight: 600 }}>{fmt(c.pool)}</span>
                            <span>积分池</span>
                          </span>
                          {/* 参与者 */}
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
                              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                            </svg>
                            {fmt(c.parts)} 参与者
                          </span>
                          {/* 发布 */}
                          <span>发布 {c.pub}</span>
                          {/* 截止 */}
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                              <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                            </svg>
                            截止 {c.dl}
                          </span>
                        </div>

                        {/* 话题标签（c-tag 样式） */}
                        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                          {cat.map((tg, i) => <span key={i} className="c-tag">{tg}</span>)}
                        </div>
                      </div>

                      {/* 右：YES / NO 撑满高度，字号统一 */}
                      <div style={{
                        flexShrink: 0, width: 190,
                        display: "flex", flexDirection: "column", justifyContent: "space-between",
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "#2563EB", letterSpacing: ".5px" }}>YES</span>
                            <span style={{ fontSize: 13, color: "var(--muted)", fontFamily: "var(--font-fira-code),monospace" }}>×{c.yesOdds}</span>
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#2563EB", fontFamily: "var(--font-fira-code),monospace" }}>{c.yesPct}%</span>
                        </div>
                        <div style={{ height: 4, borderRadius: 2, background: "var(--border)", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${c.yesPct}%`, background: "#2563EB", borderRadius: 2 }} />
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--red)", letterSpacing: ".5px" }}>NO</span>
                            <span style={{ fontSize: 13, color: "var(--muted)", fontFamily: "var(--font-fira-code),monospace" }}>×{c.noOdds}</span>
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--red)", fontFamily: "var(--font-fira-code),monospace" }}>{c.noPct}%</span>
                        </div>
                      </div>

                      {/* 箭头 */}
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" style={{ flexShrink: 0, alignSelf: "center" }}>
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── 右：筛选侧栏 ── */}
          <div style={{ position: "sticky", top: 80 }}>
            <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: "16px 16px 18px" }}>
              <HeaderSearch variant="light" defaultValue={query} />

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

const sectionLabel: React.CSSProperties = {
  fontSize: 12, fontWeight: 700, color: "var(--text2)", marginBottom: 10,
};

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
