"use client";

// 调研组合页 —— 左侧关注的调研（独占左边、全高）；右侧调研详情 + 我的调研组合（同宽）
// 积分模型：积分余额(points) + 调研组合积分(portfolio=进行中下注之和) = 总积分价值
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Chart from "chart.js/auto";
import { useAuth } from "@/components/providers/auth-provider";
import { useLanguage } from "@/components/providers/language-provider";
import { HeaderActions } from "@/components/layouts/header-actions";
import { Logo } from "@/components/layouts/site-logo";
import { HeaderSearch } from "@/components/layouts/header-search";
import { UnfollowMenu, ctxMenuFrom, type CtxMenuState } from "@/components/layouts/unfollow-menu";
import { TREND_DATES, fmt } from "@/lib/data/home";
import { surveyToCardData, type Survey, type CardData } from "@/lib/types/survey";
import { floatingPnl } from "@/lib/types/bet";

const NAV_ITEMS = [
  { label: "公共服务",   slug: "public-services" },
  { label: "政策研究",   slug: "policy-research" },
  { label: "满意度调查", slug: "satisfaction-survey" },
  { label: "教育",       slug: "education" },
  { label: "健康医疗",   slug: "health-medical" },
  { label: "商业调查",   slug: "business-survey" },
  { label: "个人/企业",  slug: "personal-enterprise" },
];

// 确定性哈希（SSR/CSR 一致）—— 仅用于趋势图模拟
const hash = (n: number, mod: number) => ((n * 2654435761) >>> 0) % mod;

export function PortfolioPage() {
  const { user, portfolio, points, bets, betFor, placeBet } = useAuth();
  const { lang } = useLanguage();
  const router = useRouter();

  const lng = lang as "zh-CN" | "zh-TW" | "en";

  const [selectedId, setSelectedId] = useState<number>(-1);
  const [followIds, setFollowIds] = useState<number[]>([]);
  const [ctxMenu, setCtxMenu] = useState<CtxMenuState | null>(null);
  const [tab, setTab] = useState<"active" | "settled">("active");
  const [betSide, setBetSide] = useState<"yes" | "no">("yes");
  const [betAmount, setBetAmount] = useState("1000");
  const [trendTab, setTrendTab] = useState<"yesno" | "pool" | "parts">("yesno");
  const [betting, setBetting] = useState(false);
  const [betMsg, setBetMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const surveyMap = useRef<Map<number, CardData>>(new Map());
  const [, forceRender] = useState(0);

  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInst = useRef<Chart | null>(null);

  // 从 DB 拉取关注列表
  useEffect(() => {
    if (!user?.id) { setFollowIds([]); return; }
    fetch(`/api/follows?user_id=${encodeURIComponent(user.id)}`)
      .then((r) => r.json())
      .then((json: { data?: number[] }) => setFollowIds(json.data ?? []))
      .catch(() => {});
  }, [user?.id]);

  // 语言变化时清空已缓存的调研数据，触发按新语言重新拉取
  useEffect(() => { surveyMap.current.clear(); forceRender((n) => n + 1); }, [lng]);

  // 拉取「关注 ∪ 已下注」涉及的调研详情（左侧列表与下方表格、详情区共用）
  useEffect(() => {
    const ids = Array.from(new Set([...followIds, ...bets.map((b) => b.survey_id)]));
    const missing = ids.filter((id) => !surveyMap.current.has(id));
    if (missing.length === 0) return;
    fetch(`/api/surveys/list?ids=${missing.join(",")}`)
      .then((r) => r.json())
      .then((res: { data?: Survey[] }) => {
        (res.data ?? []).forEach((s) => surveyMap.current.set(s.id, surveyToCardData(s, lng)));
        forceRender((n) => n + 1);
      })
      .catch(() => {});
  }, [followIds, bets, lng]);

  // 默认选中：第一个下注的调研，否则第一个关注的调研
  useEffect(() => {
    if (selectedId !== -1) return;
    const first = bets[0]?.survey_id ?? followIds[0];
    if (first != null) setSelectedId(first);
  }, [bets, followIds, selectedId]);

  const selected = surveyMap.current.get(selectedId);

  // 取消关注：从列表移除并同步 DB
  const unfollow = (id: number) => {
    setFollowIds((prev) => prev.filter((x) => x !== id));
    if (user?.id) {
      fetch(`/api/follows/${id}?user_id=${encodeURIComponent(user.id)}`, { method: "DELETE" }).catch(() => {});
    }
  };
  // 关注：最新关注置于列表最前，并确保左侧列表能取到该调研数据
  const follow = (id: number) => {
    if (!user?.id) return;
    setFollowIds((prev) => [id, ...prev.filter((x) => x !== id)]);
    fetch(`/api/follows/${id}?user_id=${encodeURIComponent(user.id)}`, { method: "POST" }).catch(() => {});
    if (!surveyMap.current.has(id)) {
      fetch(`/api/surveys/list?ids=${id}`)
        .then((r) => r.json())
        .then((res: { data?: Survey[] }) => {
          (res.data ?? []).forEach((s) => surveyMap.current.set(s.id, surveyToCardData(s, lng)));
          forceRender((n) => n + 1);
        })
        .catch(() => {});
    }
  };
  const toggleFollow = (id: number) => (followIds.includes(id) ? unfollow(id) : follow(id));
  const isFollowed = followIds.includes(selectedId);

  // 选中调研的已有下注 → 方向锁定
  const selectedBet = betFor(selectedId);
  const lockedSide = selectedBet?.side ?? null;
  useEffect(() => { if (lockedSide) setBetSide(lockedSide); }, [lockedSide]);

  // 进行中下注的浮动盈亏合计（用于「调研组合积分」的涨跌提示）
  const portfolioPnl = bets
    .filter((b) => b.status === "active")
    .reduce((sum, b) => {
      const card = surveyMap.current.get(b.survey_id);
      const curPct = card ? (b.side === "yes" ? card.yesPct : card.noPct) : 0;
      return sum + floatingPnl(b, curPct);
    }, 0);

  // 详情走势图（YES/NO 走势 / 积分池增长 / 参与人数）
  useEffect(() => {
    if (!user || !selected || !chartRef.current) return;
    const len = TREND_DATES.length;
    const yesTrend = TREND_DATES.map((_, i) => Math.min(Math.max(selected.yesPct + (hash(selected.id * 100 + i, 17) - 8), 8), 92));
    const poolTrend = TREND_DATES.map((_, i) => Math.round(selected.pool * (0.6 + (i / len) * 0.4)));
    const partsTrend = TREND_DATES.map((_, i) => Math.round(selected.parts * (0.5 + (i / len) * 0.5)));
    const isYesNo = trendTab === "yesno";
    function buildData() {
      if (trendTab === "yesno") {
        return { labels: TREND_DATES, datasets: [
          { label: "YES", data: yesTrend, borderColor: "#2563EB", backgroundColor: "rgba(37,99,235,.08)", borderWidth: 2, tension: 0.4, pointRadius: 0, fill: true },
          { label: "NO", data: yesTrend.map((v) => 100 - v), borderColor: "#DC2626", backgroundColor: "transparent", borderWidth: 2, tension: 0.4, pointRadius: 0, borderDash: [4, 3] },
        ] };
      }
      if (trendTab === "pool") {
        return { labels: TREND_DATES, datasets: [
          { label: "积分池", data: poolTrend, borderColor: "#2563EB", backgroundColor: "rgba(37,99,235,.08)", borderWidth: 2, tension: 0.4, pointRadius: 0, fill: true },
        ] };
      }
      return { labels: TREND_DATES, datasets: [
        { label: "参与人数", data: partsTrend, borderColor: "#16A34A", backgroundColor: "rgba(22,163,74,.08)", borderWidth: 2, tension: 0.4, pointRadius: 0, fill: true },
      ] };
    }
    chartInst.current?.destroy();
    chartInst.current = new Chart(chartRef.current, {
      type: "line",
      data: buildData(),
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: { enabled: true, callbacks: { label: (c) => isYesNo ? c.dataset.label + ": " + c.parsed.y + "%" : c.dataset.label + ": " + fmt(c.parsed.y ?? 0) } },
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 10 }, color: "#94A3B8", maxRotation: 0, autoSkip: true, maxTicksLimit: 6 } },
          y: { min: isYesNo ? 0 : undefined, max: isYesNo ? 100 : undefined, grid: { color: "#F1F5F9" }, ticks: { font: { size: 10 }, color: "#94A3B8", stepSize: isYesNo ? 25 : undefined, callback: (v) => isYesNo ? v + "%" : fmt(typeof v === "number" ? v : 0) } },
        },
        animation: { duration: 400 },
      },
    });
    return () => { chartInst.current?.destroy(); chartInst.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedId, lang, trendTab, selected?.id, selected?.yesPct, selected?.pool, selected?.parts]);

  // 积分汇总（总积分价值 = 调研组合积分 + 积分余额）
  const total = portfolio + points;
  const up = portfolioPnl >= 0;
  const pct = portfolio > 0 ? (portfolioPnl / portfolio) * 100 : 0;

  // 当前 tab 下的下注行
  const tableBets = bets.filter((b) => b.status === tab);

  // 下注预计净得
  const yesBets = selected ? Math.round((selected.pool * selected.yesPct) / 100) : 0;
  const noBets = selected ? Math.round((selected.pool * selected.noPct) / 100) : 0;
  const betNum = parseInt(betAmount.replace(/,/g, "")) || 0;
  const betOdds = selected ? parseFloat(betSide === "yes" ? selected.yesOdds : selected.noOdds) : 1;
  const netGain = betNum > 0 ? Math.round((betNum * betOdds - betNum) * 0.97) : 0;

  // 确认下注：余额校验 → 写入后端（余额联动，金额计入调研组合积分）
  async function confirmBet() {
    if (betting || !selected) return;
    if (!user) { setBetMsg({ ok: false, text: "请先登录后再下注" }); return; }
    if (betNum <= 0) { setBetMsg({ ok: false, text: "请输入下注积分" }); return; }
    if (betNum > points) { setBetMsg({ ok: false, text: "积分余额不足" }); return; }
    setBetting(true);
    setBetMsg(null);
    const res = await placeBet(selectedId, betSide, betNum, betOdds);
    setBetting(false);
    setBetMsg(res.ok ? { ok: true, text: "下注成功，已计入调研组合积分" } : { ok: false, text: res.error });
  }

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
          </button>
          <button className="nitem" onClick={() => router.push("/latest")}>最新</button>
          <div className="n-div" />
          {NAV_ITEMS.map((item) => (
            <button key={item.slug} className="nitem" onClick={() => router.push(`/category/${item.slug}`)}>{item.label}</button>
          ))}
        </div>
      </nav>

      {/* ── 未登录提示 ── */}
      {!user ? (
        <div className="wrap" style={{ padding: "80px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 16, color: "var(--text2)", marginBottom: 8 }}>请先登录后查看您的调研组合</div>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>点击右上角「登录」即可使用。</div>
        </div>
      ) : (
        <div className="wrap" style={{ padding: "20px 24px 40px" }}>

          {/* ── 两栏：左关注的调研(全高) | 右(调研详情 + 我的调研组合) ── */}
          <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 18, alignItems: "start" }}>

            {/* 左：关注的调研（独占左边、全高、内部滚动；样式同首页侧栏） */}
            <div className="s-panel" style={{ position: "sticky", top: 80, height: "calc(100vh - 100px)", display: "flex", flexDirection: "column" }}>
              <div className="p-head">
                <span className="p-title">
                  关注的调研
                  <span style={{ marginLeft: 7, background: "rgba(255,255,255,.22)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "1px 7px", borderRadius: 10, verticalAlign: "middle" }}>
                    {followIds.length}
                  </span>
                </span>
                <button
                  onClick={() => router.push("/follows?from=portfolio")}
                  title="管理关注的调研"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    background: "rgba(255,255,255,.15)", border: "none", borderRadius: 6,
                    color: "#fff", fontSize: 11, fontWeight: 600, padding: "3px 9px",
                    cursor: "pointer", fontFamily: "inherit", transition: ".15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,.28)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,.15)")}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4 12.5-12.5z" />
                  </svg>
                  管理
                </button>
              </div>
              <div style={{ flex: 1, overflowY: "auto" }}>
                {followIds.length === 0 ? (
                  <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
                    暂无关注的调研
                  </div>
                ) : followIds.map((id) => {
                  const s = surveyMap.current.get(id);
                  const isSel = id === selectedId;
                  const bet = betFor(id);
                  return (
                    <div
                      key={id}
                      className="side-survey"
                      onClick={() => setSelectedId(id)}
                      onContextMenu={(e) => { e.preventDefault(); setCtxMenu(ctxMenuFrom(e, id)); }}
                      style={{ background: isSel ? "rgba(37,99,235,.13)" : undefined, borderBottomColor: "var(--border)" }}
                    >
                      <div className="side-ttl" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>{s?.title ?? "加载中…"}</span>
                        {bet && (
                          <span style={{
                            flexShrink: 0, fontSize: 9.5, fontWeight: 700, padding: "1px 5px", borderRadius: 4, letterSpacing: ".3px",
                            color: bet.side === "yes" ? "#2563EB" : "var(--red)",
                            background: bet.side === "yes" ? "rgba(37,99,235,.12)" : "rgba(220,38,38,.12)",
                          }}>已参与</span>
                        )}
                      </div>
                      <div className="side-opts">
                        <div className="s-opt y"><span className="so-lbl">YES</span><span className="so-pct">{s?.yesPct ?? "--"}%</span><span className="so-odds">{s?.yesOdds ?? "--"}x</span></div>
                        <div className="s-opt n"><span className="so-lbl">NO</span><span className="so-pct">{s?.noPct ?? "--"}%</span><span className="so-odds">{s?.noOdds ?? "--"}x</span></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 右：调研详情 + 我的调研组合（同宽） */}
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

              {/* 调研详情（仅在选中调研时显示；位于我的调研组合下方） */}
              {selected && (
                <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: "16px 18px", order: 2 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                    <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--blue-d)", margin: 0, lineHeight: 1.35 }}>
                      {selected.title}
                      {selectedBet && (
                        <span style={{
                          marginLeft: 8, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6, letterSpacing: ".3px", verticalAlign: "middle",
                          color: selectedBet.side === "yes" ? "#2563EB" : "var(--red)",
                          background: selectedBet.side === "yes" ? "rgba(37,99,235,.1)" : "rgba(220,38,38,.1)",
                        }}>已参与 · {selectedBet.side === "yes" ? "YES" : "NO"}</span>
                      )}
                    </h2>
                    <button
                      onClick={() => router.push(`/survey/${selected.id}`)}
                      style={{ flexShrink: 0, marginTop: 2, background: "none", border: "none", cursor: "pointer", color: "var(--blue)", fontSize: 12.5, fontWeight: 600, fontFamily: "inherit", whiteSpace: "nowrap" }}
                    >
                      查看完整调研详情 ›
                    </button>
                  </div>

                  {/* 元信息行 */}
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center", fontSize: 12.5, color: "var(--text2)", marginTop: 8 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" /></svg>
                      <span style={{ fontFamily: "var(--font-fira-code),monospace", color: "var(--blue)", fontWeight: 600 }}>{fmt(selected.pool)}</span>
                      <span>积分池</span>
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>
                      {fmt(selected.parts)} 参与者
                    </span>
                    <span>发布 {selected.pub}</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                      截止 {selected.dl}
                    </span>
                  </div>

                  {/* 标签 */}
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 8 }}>
                    {selected.tags.map((tg, i) => <span key={i} className="c-tag">{tg}</span>)}
                  </div>

                  {/* 积分池卡片 + 积分下注（合起来 = 我的调研组合宽度；两区等高） */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16, marginTop: 14, alignItems: "stretch" }}>

                    {/* 左：积分池区域 */}
                    <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                        <div className="sec-title" style={{ margin: 0 }}>积分池</div>
                        <button
                          onClick={() => toggleFollow(selectedId)}
                          title={isFollowed ? "取消关注" : "关注此调研"}
                          style={{
                            background: isFollowed ? "var(--blue)" : "transparent",
                            border: `1.5px solid ${isFollowed ? "var(--blue)" : "var(--border)"}`,
                            borderRadius: 8, padding: "4px 10px", cursor: "pointer",
                            display: "flex", alignItems: "center", gap: 5,
                            color: isFollowed ? "#fff" : "var(--text2)",
                            fontSize: 12, fontWeight: 500, fontFamily: "inherit", transition: ".2s",
                          }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill={isFollowed ? "#fff" : "none"}
                            stroke={isFollowed ? "#fff" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                          </svg>
                          {isFollowed ? "已关注" : "关注"}
                        </button>
                      </div>
                      <div style={{ fontFamily: "var(--font-fira-code),monospace", fontSize: 30, fontWeight: 700, color: "var(--blue-d)", lineHeight: 1, marginBottom: 8 }}>
                        {fmt(selected.pool)}<span style={{ fontSize: 13, fontWeight: 500, color: "var(--muted)", marginLeft: 6 }}>积分</span>
                      </div>
                      {/* YES/NO 进度条 */}
                      <div style={{ height: 9, borderRadius: 5, overflow: "hidden", display: "flex", background: "#E2E8F0" }}>
                        <div style={{ width: `${selected.yesPct}%`, background: "#2563EB" }} />
                        <div style={{ flex: 1, background: "#DC2626" }} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5, fontSize: 11.5, fontFamily: "var(--font-fira-code),monospace" }}>
                        <span style={{ color: "#2563EB", fontWeight: 600 }}>YES {selected.yesPct}% · {selected.yesOdds}x</span>
                        <span style={{ color: "#DC2626", fontWeight: 600 }}>NO {selected.noPct}% · {selected.noOdds}x</span>
                      </div>
                      {/* 三格统计 */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginTop: 12 }}>
                        {[
                          { label: "参与人数", val: fmt(selected.parts), color: "var(--text2)" },
                          { label: "YES 下注", val: fmt(yesBets), color: "#2563EB" },
                          { label: "NO 下注", val: fmt(noBets), color: "#DC2626" },
                        ].map((it) => (
                          <div key={it.label} style={{ background: "var(--card)", borderRadius: 8, padding: "8px 10px" }}>
                            <div style={{ fontFamily: "var(--font-fira-code),monospace", fontSize: 16, fontWeight: 700, color: it.color, lineHeight: 1 }}>{it.val}</div>
                            <div style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 3 }}>{it.label}</div>
                          </div>
                        ))}
                      </div>
                      {/* 趋势 tab */}
                      <div style={{ display: "flex", gap: 6, marginTop: 14, borderBottom: "1px solid var(--border)" }}>
                        {([["yesno", "YES/NO 走势"], ["pool", "积分池增长"], ["parts", "参与人数"]] as [typeof trendTab, string][]).map(([key, label]) => (
                          <button key={key} onClick={() => setTrendTab(key)} style={{
                            padding: "5px 12px", borderRadius: "6px 6px 0 0", fontSize: 12, fontWeight: 600, cursor: "pointer",
                            border: "1px solid var(--border)", borderBottom: "none", fontFamily: "inherit", marginBottom: -1, transition: ".15s",
                            background: trendTab === key ? "var(--blue)" : "transparent", color: trendTab === key ? "#fff" : "var(--text2)",
                          }}>{label}</button>
                        ))}
                      </div>
                      {/* 图表 */}
                      <div style={{ position: "relative", height: 123, marginTop: 10 }}>
                        {trendTab === "yesno" && (
                          <div style={{ position: "absolute", top: 0, right: 0, zIndex: 2, fontSize: 11, fontFamily: "var(--font-fira-code),monospace", textAlign: "right", lineHeight: 1.6, background: "rgba(255,255,255,.85)", padding: "2px 6px", borderRadius: 6 }}>
                            <div style={{ color: "#2563EB", fontWeight: 700 }}>YES {selected.yesPct}% ({selected.yesOdds}x)</div>
                            <div style={{ color: "var(--red)", fontWeight: 700 }}>NO {selected.noPct}% ({selected.noOdds}x)</div>
                          </div>
                        )}
                        <canvas ref={chartRef} />
                      </div>
                    </div>

                    {/* 右：积分下注（box 内置顶对齐） */}
                    <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px" }}>
                      <div className="sec-title" style={{ marginBottom: 12 }}>积分下注</div>
                      {/* 是/否（已下注则另一方向变淡不可选） */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                        {(["yes", "no"] as const).map((side) => {
                          const disabled = lockedSide !== null && lockedSide !== side;
                          return (
                          <button key={side} onClick={() => !disabled && setBetSide(side)} disabled={disabled}
                            title={disabled ? "该调研已下注此前方向，无法切换" : undefined}
                            style={{
                              padding: "8px 8px", borderRadius: 8, cursor: disabled ? "not-allowed" : "pointer", fontFamily: "inherit", transition: ".15s",
                              opacity: disabled ? 0.4 : 1,
                              border: betSide === side ? `2px solid ${side === "yes" ? "#2563EB" : "#DC2626"}` : "2px solid var(--border)",
                              background: "#fff",
                            }}>
                            <div style={{ fontSize: 15, fontWeight: 700, color: side === "yes" ? "#2563EB" : "#DC2626", lineHeight: 1, marginBottom: 3 }}>{side === "yes" ? "是" : "否"}</div>
                            <div style={{ fontFamily: "var(--font-fira-code),monospace", fontSize: 13, fontWeight: 700, color: side === "yes" ? "#2563EB" : "#DC2626" }}>{side === "yes" ? selected.yesOdds : selected.noOdds}x</div>
                          </button>
                          );
                        })}
                      </div>
                      {lockedSide && (
                        <div style={{ fontSize: 10.5, color: "var(--muted)", marginTop: -4, marginBottom: 10, lineHeight: 1.5 }}>
                          已下注 {lockedSide === "yes" ? "YES" : "NO"} 方向，只能继续加注此方向。
                        </div>
                      )}
                      {/* 积分 + 余额 */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <span style={{ fontSize: 12, color: "var(--text2)", fontWeight: 600 }}>积分</span>
                        <span style={{ fontSize: 11, color: "var(--muted)", background: "rgba(30,64,175,.07)", padding: "2px 8px", borderRadius: 5 }}>余额：{fmt(points)} 积分</span>
                      </div>
                      {/* 输入 */}
                      <div style={{ display: "flex", alignItems: "center", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden", marginBottom: 10, background: "var(--card)" }}>
                        <input type="number" value={betAmount} onChange={(e) => setBetAmount(e.target.value)} style={{ flex: 1, padding: "8px 12px", border: "none", outline: "none", fontFamily: "var(--font-fira-code),monospace", fontSize: 14, fontWeight: 600, color: "var(--blue-d)", background: "transparent" }} />
                        <span style={{ padding: "8px 12px", fontSize: 12, color: "var(--muted)", borderLeft: "1px solid var(--border)" }}>积分</span>
                      </div>
                      {/* 快捷金额 */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 5, marginBottom: 12 }}>
                        {["10", "50", "100", "500", "1000", "MAX"].map((v) => {
                          const val = v === "MAX" ? String(points) : v;
                          const on = betAmount === val;
                          return (
                            <button key={v} onClick={() => setBetAmount(val)} style={{
                              padding: "5px 0", borderRadius: 5, cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit",
                              border: "1px solid var(--border)", background: on ? "var(--blue)" : "transparent", color: on ? "#fff" : "var(--text2)", transition: ".15s",
                            }}>{v === "1000" ? "1K" : v}</button>
                          );
                        })}
                      </div>
                      {/* 净得 */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "rgba(22,163,74,.07)", borderRadius: 7, marginBottom: 12 }}>
                        <span style={{ fontSize: 12.5, color: "var(--text2)", fontWeight: 500 }}>净得（预测正确）</span>
                        <span style={{ fontFamily: "var(--font-fira-code),monospace", fontSize: 14, fontWeight: 700, color: "var(--green)" }}>+{fmt(netGain)} 积分</span>
                      </div>
                      {/* 确认 */}
                      <button
                        onClick={confirmBet}
                        disabled={betting || betNum <= 0}
                        style={{
                          width: "100%", padding: "11px 0", background: "var(--green)", border: "none", borderRadius: 8, color: "#fff", fontSize: 14, fontWeight: 700,
                          cursor: betting || betNum <= 0 ? "default" : "pointer", fontFamily: "inherit", letterSpacing: ".3px", opacity: betting || betNum <= 0 ? 0.6 : 1,
                        }}>
                        {betting ? "下注中…" : `${selectedBet ? "加注" : "确认下注"} · ${betNum >= 1000 ? Math.floor(betNum / 1000) + "K" : betNum} 积分`}
                      </button>
                      {betMsg && (
                        <div style={{ marginTop: 10, fontSize: 12, fontWeight: 600, textAlign: "center", color: betMsg.ok ? "var(--green)" : "var(--red)" }}>
                          {betMsg.text}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 我的调研组合（tab + 表格 + 滚动，位于调研详情上方） */}
              <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden", order: 1 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 18px", borderBottom: "1px solid var(--border)", flexWrap: "wrap", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                    <div className="sec-title" style={{ marginBottom: 0, fontSize: 20 }}>我的调研组合</div>
                    {/* 积分汇总（合并为一行，分隔符隔开） */}
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", fontSize: 12.5, color: "var(--muted)" }}>
                      <span>总积分价值 <b style={{ fontFamily: "var(--font-fira-code),monospace", color: "var(--blue-d)", fontSize: 14 }}>{fmt(total)}</b></span>
                      <span style={{ width: 1, height: 16, background: "var(--border)" }} />
                      <span>
                        调研组合积分 <b style={{ fontFamily: "var(--font-fira-code),monospace", color: "var(--blue-d)", fontSize: 14 }}>{fmt(portfolio)}</b>
                        {portfolio > 0 && (
                          <span style={{ marginLeft: 6, fontFamily: "var(--font-fira-code),monospace", fontWeight: 600, color: up ? "var(--green)" : "var(--red)" }}>
                            {up ? "▲" : "▼"}{up ? "+" : ""}{fmt(portfolioPnl)} {up ? "+" : "-"}{Math.abs(pct).toFixed(1)}%
                          </span>
                        )}
                      </span>
                      <span style={{ width: 1, height: 16, background: "var(--border)" }} />
                      <span>积分余额 <b style={{ fontFamily: "var(--font-fira-code),monospace", color: "var(--amber)", fontSize: 14 }}>{fmt(points)}</b></span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {([["active", "进行中"], ["settled", "已结算"]] as [typeof tab, string][]).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => setTab(key)}
                        style={{
                          padding: "6px 16px", borderRadius: 7, cursor: "pointer", fontFamily: "inherit",
                          fontSize: 12.5, fontWeight: 600, transition: ".15s",
                          border: `1px solid ${tab === key ? "var(--blue)" : "var(--border)"}`,
                          background: tab === key ? "var(--blue)" : "transparent",
                          color: tab === key ? "#fff" : "var(--text2)",
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ maxHeight: 230, overflowY: "auto", overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: "#f5f5f5", color: "var(--text2)", fontSize: 11.5, textAlign: "left" }}>
                        <th style={thStyle}>调研名称</th>
                        <th style={thStyle}>方向</th>
                        <th style={{ ...thStyle, textAlign: "right" }}>下注积分</th>
                        <th style={{ ...thStyle, textAlign: "right" }}>赔率</th>
                        <th style={{ ...thStyle, textAlign: "right" }}>{tab === "active" ? "当前胜率" : "结果"}</th>
                        <th style={{ ...thStyle, textAlign: "right" }}>{tab === "active" ? "浮动盈亏" : "实际盈亏"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableBets.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ padding: "36px 16px", textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
                            {tab === "active" ? "暂无进行中的下注，去调研详情下注吧" : "暂无已结算的下注"}
                          </td>
                        </tr>
                      ) : tableBets.map((bet) => {
                        const card = surveyMap.current.get(bet.survey_id);
                        const title = card?.title ?? "加载中…";
                        const curPct = card ? (bet.side === "yes" ? card.yesPct : card.noPct) : 0;
                        const pnl = tab === "active"
                          ? floatingPnl(bet, curPct)
                          : (bet.won ? Math.round(bet.amount * (bet.odds - 1) * 0.97) : -bet.amount);
                        const pnlPos = pnl >= 0;
                        const isSel = bet.survey_id === selectedId;
                        return (
                          <tr
                            key={bet.survey_id}
                            onClick={() => setSelectedId(bet.survey_id)}
                            style={{
                              borderBottom: "1px solid var(--border)", cursor: "pointer", transition: ".15s",
                              background: isSel ? "rgba(37,99,235,.13)" : "transparent",
                            }}
                            onMouseEnter={(e) => { if (!isSel) e.currentTarget.style.background = "#F8FAFF"; }}
                            onMouseLeave={(e) => { if (!isSel) e.currentTarget.style.background = "transparent"; }}
                          >
                            <td style={{ ...tdStyle, maxWidth: 420 }}>
                              <div style={{
                                display: "flex", alignItems: "center", gap: 7,
                                color: isSel ? "var(--blue)" : "var(--blue-d)", fontWeight: 600,
                                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 420,
                              }}>
                                {isSel && <span style={{ width: 3, height: 14, background: "var(--blue)", borderRadius: 2, flexShrink: 0 }} />}
                                {title}
                              </div>
                            </td>
                            <td style={tdStyle}>
                              <span style={{
                                fontSize: 10.5, fontWeight: 700, letterSpacing: ".5px", padding: "2px 8px", borderRadius: 6,
                                color: bet.side === "yes" ? "#2563EB" : "var(--red)",
                                background: bet.side === "yes" ? "rgba(37,99,235,.1)" : "rgba(220,38,38,.1)",
                              }}>
                                {bet.side === "yes" ? "YES" : "NO"}
                              </span>
                            </td>
                            <td style={{ ...tdStyle, textAlign: "right", fontFamily: "var(--font-fira-code),monospace", color: "var(--text2)" }}>{fmt(bet.amount)}</td>
                            <td style={{ ...tdStyle, textAlign: "right", fontFamily: "var(--font-fira-code),monospace", color: "var(--text2)" }}>×{bet.odds.toFixed(2)}</td>
                            <td style={{ ...tdStyle, textAlign: "right" }}>
                              {tab === "active" ? (
                                <span style={{ fontFamily: "var(--font-fira-code),monospace", color: "var(--text2)" }}>{curPct}%</span>
                              ) : (
                                <span style={{
                                  fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6,
                                  color: bet.won ? "var(--green)" : "var(--red)",
                                  background: bet.won ? "rgba(22,163,74,.1)" : "rgba(220,38,38,.1)",
                                }}>
                                  {bet.won ? "赢" : "输"}
                                </span>
                              )}
                            </td>
                            <td style={{ ...tdStyle, textAlign: "right", fontFamily: "var(--font-fira-code),monospace", fontWeight: 700, color: pnl === 0 ? "var(--text2)" : pnlPos ? "var(--green)" : "var(--red)" }}>
                              {pnl > 0 ? "+" : ""}{fmt(pnl)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 右键菜单：取消关注 */}
      <UnfollowMenu state={ctxMenu} onUnfollow={unfollow} onClose={() => setCtxMenu(null)} />
    </div>
  );
}

const thStyle: React.CSSProperties = { padding: "9px 16px", fontWeight: 600, position: "sticky", top: 0, background: "#f5f5f5", zIndex: 1 };
const tdStyle: React.CSSProperties = { padding: "10px 16px" };
