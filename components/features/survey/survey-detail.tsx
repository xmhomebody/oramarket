"use client";

// 调研详情页组件 —— 设计风格与首页完全一致
// 根据 id 生成对应的调研数据，包含积分下注、走势图、最近下注等完整功能
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Chart from "chart.js/auto";
import { useLanguage } from "@/components/providers/language-provider";
import { HeaderActions } from "@/components/layouts/header-actions";
import { HeaderSearch } from "@/components/layouts/header-search";
import { TITLES_I18N, TOPICS_I18N } from "@/lib/i18n/dict";
import {
  TREND_DATES,
  rnd,
  pick,
  fmt,
  dateStr,
  AV_COLORS,
  R_NAMES,
  generateCards,
} from "@/lib/data/home";

// 最近下注条目
interface BetItem {
  name: string;
  side: "yes" | "no";
  pts: number;
  color: string;
  minsAgo: number;
}

// 根据 id 确定性地生成调研数据（seed = id，保证同 id 数据稳定）
function seedRnd(seed: number, a: number, b: number) {
  const x = Math.sin(seed + 1) * 10000;
  return a + Math.floor((x - Math.floor(x)) * (b - a + 1));
}

function buildSurveyData(id: number, lang: "zh-CN" | "zh-TW" | "en") {
  const titles = TITLES_I18N[lang] || TITLES_I18N["zh-CN"];
  const topics = TOPICS_I18N[lang] || TOPICS_I18N["zh-CN"];
  const titleIdx = seedRnd(id * 7, 0, titles.length - 1);
  const yesPct = seedRnd(id * 3, 35, 65);
  const noPct = 100 - yesPct;
  const pool = seedRnd(id * 11, 50000, 600000);
  const parts = seedRnd(id * 5, 500, 8000);
  const yesOdds = (100 / yesPct).toFixed(2);
  const noOdds = (100 / noPct).toFixed(2);
  const tagIdx = [seedRnd(id * 2, 0, topics.length - 1), seedRnd(id * 4, 0, topics.length - 1)];
  const tags = [...new Set(tagIdx)].slice(0, 2).map((i) => topics[i]);
  const dl = dateStr(seedRnd(id * 9, 10, 120));
  const pub = dateStr(-seedRnd(id * 6, 1, 30));
  // YES 分布：用于 YES/NO 趋势图（确定性生成）
  const yesTrend = TREND_DATES.map((_, i) => {
    const base = yesPct + seedRnd(id * 100 + i, -8, 8);
    return Math.min(Math.max(base, 10), 90);
  });
  // 积分池增长趋势（随时间递增）
  const poolTrend = TREND_DATES.map((_, i) => {
    return Math.round(pool * (0.6 + (i / TREND_DATES.length) * 0.4));
  });
  // 参与人数趋势
  const partsTrend = TREND_DATES.map((_, i) => {
    return Math.round(parts * (0.5 + (i / TREND_DATES.length) * 0.5));
  });
  return {
    title: titles[titleIdx],
    tags,
    yesPct,
    noPct,
    pool,
    parts,
    yesOdds,
    noOdds,
    dl,
    pub,
    yesBets: Math.round(pool * (yesPct / 100)),
    noBets: Math.round(pool * (noPct / 100)),
    yesTrend,
    poolTrend,
    partsTrend,
  };
}

// 生成最近下注条目（确定性）
function buildRecentBets(id: number): BetItem[] {
  return Array.from({ length: 14 }, (_, i) => ({
    name: R_NAMES[seedRnd(id * 13 + i, 0, R_NAMES.length - 1)] + "预言家",
    side: seedRnd(id * 17 + i, 0, 1) === 0 ? "yes" : "no",
    pts: seedRnd(id * 19 + i, 1, 100) * 10,
    color: AV_COLORS[seedRnd(id * 23 + i, 0, AV_COLORS.length - 1)],
    minsAgo: seedRnd(id * 29 + i, 1, 180),
  }));
}

interface SurveyDetailProps {
  id: number;
}

// 三个趋势视图标签
type TrendTab = "yesno" | "pool" | "parts";

export function SurveyDetail({ id }: SurveyDetailProps) {
  const { lang } = useLanguage();
  const router = useRouter();

  const survey = buildSurveyData(id, lang as "zh-CN" | "zh-TW" | "en");
  const recentBets = buildRecentBets(id);

  // 积分下注状态
  const [selectedSide, setSelectedSide] = useState<"yes" | "no">("yes");
  const [betAmount, setBetAmount] = useState<string>("1000");
  const [activeTrendTab, setActiveTrendTab] = useState<TrendTab>("yesno");

  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  // 净得：根据选择方向和赔率计算
  const betNum = parseInt(betAmount.replace(/,/g, "")) || 0;
  const odds = selectedSide === "yes" ? parseFloat(survey.yesOdds) : parseFloat(survey.noOdds);
  const netGain = betNum > 0 ? ((betNum * odds - betNum) * 0.97).toFixed(0) : "0";

  // 趋势图数据切换
  function getTrendDatasets(tab: TrendTab) {
    if (tab === "yesno") {
      return {
        labels: TREND_DATES,
        datasets: [
          {
            label: "YES",
            data: survey.yesTrend,
            borderColor: "#2563EB",
            backgroundColor: "rgba(37,99,235,.08)",
            borderWidth: 2,
            tension: 0.4,
            pointRadius: 0,
            fill: true,
          },
          {
            label: "NO",
            data: survey.yesTrend.map((v) => 100 - v),
            borderColor: "#DC2626",
            backgroundColor: "transparent",
            borderWidth: 2,
            tension: 0.4,
            pointRadius: 0,
            borderDash: [4, 3],
          },
        ],
      };
    }
    if (tab === "pool") {
      return {
        labels: TREND_DATES,
        datasets: [
          {
            label: "积分池",
            data: survey.poolTrend,
            borderColor: "#2563EB",
            backgroundColor: "rgba(37,99,235,.08)",
            borderWidth: 2,
            tension: 0.4,
            pointRadius: 0,
            fill: true,
          },
        ],
      };
    }
    // parts
    return {
      labels: TREND_DATES,
      datasets: [
        {
          label: "参与人数",
          data: survey.partsTrend,
          borderColor: "#16A34A",
          backgroundColor: "rgba(22,163,74,.08)",
          borderWidth: 2,
          tension: 0.4,
          pointRadius: 0,
          fill: true,
        },
      ],
    };
  }

  // 挂载/更新趋势图
  useEffect(() => {
    if (!chartRef.current) return;
    if (chartInstance.current) chartInstance.current.destroy();
    const isYesNo = activeTrendTab === "yesno";
    chartInstance.current = new Chart(chartRef.current.getContext("2d")!, {
      type: "line",
      data: getTrendDatasets(activeTrendTab),
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: true,
            callbacks: {
              label: (c) =>
                isYesNo
                  ? c.dataset.label + ": " + c.parsed.y + "%"
                  : c.dataset.label + ": " + fmt(c.parsed.y ?? 0),
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 10 }, color: "#94A3B8", maxRotation: 0, autoSkip: true, maxTicksLimit: 6 },
          },
          y: {
            min: isYesNo ? 0 : undefined,
            max: isYesNo ? 100 : undefined,
            grid: { color: "#F1F5F9" },
            ticks: {
              font: { size: 10 },
              color: "#94A3B8",
              stepSize: isYesNo ? 25 : undefined,
              callback: (v) => (isYesNo ? v + "%" : fmt(typeof v === "number" ? v : 0)),
            },
          },
        },
        animation: { duration: 500 },
      },
    });
    return () => { chartInstance.current?.destroy(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTrendTab, id]);

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", fontFamily: "var(--font-fira-sans),sans-serif", color: "var(--text)" }}>

      {/* ── 顶部导航栏（与首页 header 保持一致样式）── */}
      <header>
        <div className="h-inner" style={{ gap: 16 }}>
          {/* Logo */}
          <a className="logo" href="/" style={{ marginLeft: 0 }}>
            <div className="logo-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="3.5" fill="#fff" />
                <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <span className="logo-text">Ora<em>Market</em></span>
          </a>

          {/* 搜索框 */}
          <HeaderSearch />

          <HeaderActions />
        </div>
      </header>

      {/* ── 主内容区 ── */}
      <div className="wrap" style={{ padding: "16px 24px 40px" }}>

        {/* 返回调研市场按钮 —— topbar 下方、标签上方 */}
        <button
          onClick={() => router.push("/")}
          style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            background: "transparent", border: "none",
            color: "var(--blue)", fontSize: 13, cursor: "pointer",
            fontFamily: "inherit", fontWeight: 500,
            padding: "0 0 14px 0", opacity: 0.85,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          返回调研市场
        </button>

        {/* 标题区：标签 + 题目 + 元信息 */}
        <div style={{ marginBottom: 18 }}>
          {/* 话题标签（首页 c-tag 风格） */}
          <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
            {survey.tags.map((tag, i) => (
              <span key={i} className="c-tag">{tag}</span>
            ))}
          </div>

          {/* 题目 + 截止日期 */}
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
            <h1 style={{
              fontSize: 26, fontWeight: 700, color: "var(--blue-d)",
              lineHeight: 1.3, margin: 0,
            }}>
              {survey.title}
            </h1>
            <span style={{ fontSize: 12, color: "var(--muted)", whiteSpace: "nowrap" }}>
              UTC {survey.dl}
            </span>
          </div>

          {/* 元信息行：参与人数 / 截止 / 积分池 */}
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "var(--text2)" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
              </svg>
              {fmt(survey.parts)} 参与人数
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "var(--text2)" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
              </svg>
              截止：{survey.dl}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
              </svg>
              <span style={{ fontFamily: "var(--font-fira-code),monospace", color: "var(--blue)", fontWeight: 600 }}>
                {fmt(survey.pool)}
              </span>
              <span style={{ color: "var(--muted)" }}>积分池</span>
            </span>
          </div>
        </div>

        {/* 两栏布局：左（主内容）右（积分下注） */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 310px", gap: 18, alignItems: "start" }}>

          {/* ── 左栏 ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* 积分池卡片 */}
            <div className="carousel" style={{ padding: "20px 24px 18px" }}>
              {/* 积分池标题（首页 sec-title 风格） */}
              <div className="sec-title" style={{ marginBottom: 10 }}>积分池</div>

              {/* 大数字 */}
              <div style={{
                fontFamily: "var(--font-fira-code),monospace",
                fontSize: 42, fontWeight: 700, color: "var(--blue-d)",
                lineHeight: 1, marginBottom: 10,
              }}>
                {fmt(survey.pool)}
                <span style={{ fontSize: 16, fontWeight: 500, color: "var(--muted)", marginLeft: 6 }}>积分</span>
              </div>

              {/* YES/NO 进度条 */}
              <div style={{ marginBottom: 6 }}>
                <div style={{
                  height: 10, borderRadius: 5, overflow: "hidden",
                  background: "#E2E8F0", display: "flex",
                }}>
                  <div style={{ width: `${survey.yesPct}%`, background: "#2563EB", borderRadius: "5px 0 0 5px" }} />
                  <div style={{ flex: 1, background: "#DC2626", borderRadius: "0 5px 5px 0" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5, fontSize: 11.5, fontFamily: "var(--font-fira-code),monospace" }}>
                  <span style={{ color: "#2563EB", fontWeight: 600 }}>YES {survey.yesPct}% · {survey.yesOdds}x</span>
                  <span style={{ color: "#DC2626", fontWeight: 600 }}>NO {survey.noPct}% · {survey.noOdds}x</span>
                </div>
              </div>

              {/* 三格小统计 */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginTop: 16 }}>
                {[
                  { label: "参与人数", val: fmt(survey.parts), color: "var(--text2)" },
                  { label: "YES 下注", val: fmt(survey.yesBets), color: "#2563EB" },
                  { label: "NO 下注", val: fmt(survey.noBets), color: "#DC2626" },
                ].map((item) => (
                  <div key={item.label} style={{
                    background: "var(--bg)", borderRadius: 8, padding: "10px 14px",
                  }}>
                    <div style={{
                      fontFamily: "var(--font-fira-code),monospace",
                      fontSize: 20, fontWeight: 700, color: item.color, lineHeight: 1,
                    }}>{item.val}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>{item.label}</div>
                  </div>
                ))}
              </div>

              {/* 数据趋势标签页 */}
              <div style={{ display: "flex", gap: 6, marginTop: 20, borderBottom: "1px solid var(--border)", paddingBottom: 0 }}>
                {([ ["yesno", "YES/NO 走势"], ["pool", "积分池增长"], ["parts", "参与人数"] ] as [TrendTab, string][]).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setActiveTrendTab(key)}
                    style={{
                      padding: "6px 14px", borderRadius: "6px 6px 0 0",
                      fontSize: 12.5, fontWeight: 600, cursor: "pointer",
                      border: "1px solid var(--border)", borderBottom: "none",
                      fontFamily: "inherit",
                      background: activeTrendTab === key ? "var(--blue)" : "transparent",
                      color: activeTrendTab === key ? "#fff" : "var(--text2)",
                      marginBottom: -1,
                      transition: ".2s",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* 趋势折线图（与首页精选调研图一致） */}
              <div className="c-trend" style={{ minHeight: 220, marginTop: 0, borderTopLeftRadius: 0 }}>
                {/* YES/NO 浮层（仅在 yesno tab 显示） */}
                {activeTrendTab === "yesno" && (
                  <div className="chart-overlay">
                    <div className="chart-overlay-row">
                      <span className="co-lbl y">YES</span>
                      <span className="co-val y">{survey.yesPct}% ({survey.yesOdds}x)</span>
                    </div>
                    <div className="chart-overlay-row">
                      <span className="co-lbl n">NO</span>
                      <span className="co-val n">{survey.noPct}% ({survey.noOdds}x)</span>
                    </div>
                  </div>
                )}
                <canvas ref={chartRef}></canvas>
              </div>
            </div>

            {/* 最近下注 */}
            <div className="carousel" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{
                background: "var(--blue-d)", padding: "10px 16px",
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#FCD34D">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01z" />
                </svg>
                <span style={{ color: "#fff", fontSize: 12.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px" }}>
                  最近下注
                </span>
              </div>
              <div style={{ padding: "4px 0" }}>
                {recentBets.map((bet, i) => (
                  <div key={i} className="lb-item">
                    {/* 是/否标记 */}
                    <div style={{
                      width: 22, height: 22, borderRadius: 4, flexShrink: 0,
                      background: bet.side === "yes" ? "rgba(37,99,235,.12)" : "rgba(220,38,38,.12)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 700,
                      color: bet.side === "yes" ? "#2563EB" : "#DC2626",
                    }}>
                      {bet.side === "yes" ? "是" : "否"}
                    </div>
                    {/* 用户名 */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="lb-name">{bet.name}</div>
                    </div>
                    {/* 积分 */}
                    <span style={{
                      fontFamily: "var(--font-fira-code),monospace",
                      fontSize: 12, fontWeight: 700,
                      color: bet.side === "yes" ? "#2563EB" : "#DC2626",
                      marginRight: 12, flexShrink: 0,
                    }}>
                      {fmt(bet.pts)} 积分
                    </span>
                    {/* 时间 */}
                    <span style={{ fontSize: 11, color: "var(--muted)", flexShrink: 0 }}>
                      {bet.minsAgo < 60 ? `${bet.minsAgo} 分钟前` : `${Math.floor(bet.minsAgo / 60)} 小时前`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── 右栏：积分下注 ── */}
          <div style={{ position: "sticky", top: 80 }}>
            <div className="carousel" style={{ padding: "18px 16px 20px" }}>
              {/* 积分下注标题（sec-title 风格） */}
              <div className="sec-title" style={{ marginBottom: 14 }}>积分下注</div>

              {/* 是/否选择按钮 */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
                {(["yes", "no"] as const).map((side) => (
                  <button
                    key={side}
                    onClick={() => setSelectedSide(side)}
                    style={{
                      padding: "10px 8px", borderRadius: 8, cursor: "pointer",
                      fontFamily: "inherit", transition: ".2s",
                      border: selectedSide === side
                        ? `2px solid ${side === "yes" ? "#2563EB" : "#DC2626"}`
                        : "2px solid var(--border)",
                      background: selectedSide === side
                        ? side === "yes" ? "rgba(37,99,235,.08)" : "rgba(220,38,38,.08)"
                        : "transparent",
                    }}
                  >
                    <div style={{
                      fontSize: 18, fontWeight: 700,
                      color: side === "yes" ? "#2563EB" : "#DC2626",
                      lineHeight: 1, marginBottom: 3,
                    }}>
                      {side === "yes" ? "是" : "否"}
                    </div>
                    <div style={{
                      fontFamily: "var(--font-fira-code),monospace",
                      fontSize: 16, fontWeight: 700,
                      color: side === "yes" ? "#2563EB" : "#DC2626",
                    }}>
                      {side === "yes" ? survey.yesOdds : survey.noOdds}x
                    </div>
                  </button>
                ))}
              </div>

              {/* 分隔线 + 积分余额标签 */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: "var(--text2)", fontWeight: 600 }}>积分</span>
                <span style={{
                  fontSize: 11, color: "var(--muted)",
                  background: "rgba(30,64,175,.07)", padding: "2px 8px",
                  borderRadius: 5,
                }}>
                  余额：0 积分
                </span>
              </div>

              {/* 投注金额输入 */}
              <div style={{
                display: "flex", alignItems: "center",
                border: "1px solid var(--border)", borderRadius: 8,
                overflow: "hidden", marginBottom: 10,
              }}>
                <input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  style={{
                    flex: 1, padding: "9px 12px", border: "none", outline: "none",
                    fontFamily: "var(--font-fira-code),monospace", fontSize: 15,
                    fontWeight: 600, color: "var(--blue-d)", background: "transparent",
                  }}
                />
                <span style={{
                  padding: "9px 12px", fontSize: 12, color: "var(--muted)",
                  borderLeft: "1px solid var(--border)",
                }}>积分</span>
              </div>

              {/* 快捷金额按钮 */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 5, marginBottom: 14 }}>
                {["10", "50", "100", "500", "1000", "MAX"].map((v) => (
                  <button
                    key={v}
                    onClick={() => setBetAmount(v === "MAX" ? "99999" : v)}
                    style={{
                      padding: "5px 0", borderRadius: 5, cursor: "pointer",
                      fontSize: 12, fontWeight: 600, fontFamily: "inherit",
                      border: "1px solid var(--border)",
                      background: betAmount === v || (v === "MAX" && betAmount === "99999")
                        ? "var(--blue)" : "transparent",
                      color: betAmount === v || (v === "MAX" && betAmount === "99999")
                        ? "#fff" : "var(--text2)",
                      transition: ".15s",
                    }}
                  >
                    {v === "1000" ? "1K" : v}
                  </button>
                ))}
              </div>

              {/* 净得 */}
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "9px 12px", background: "rgba(22,163,74,.07)",
                borderRadius: 7, marginBottom: 14,
              }}>
                <span style={{ fontSize: 12.5, color: "var(--text2)", fontWeight: 500 }}>净得（预测正确）</span>
                <span style={{
                  fontFamily: "var(--font-fira-code),monospace",
                  fontSize: 14, fontWeight: 700, color: "var(--green)",
                }}>
                  +{fmt(Number(netGain))} 积分
                </span>
              </div>

              {/* 确认下注按钮 */}
              <button style={{
                width: "100%", padding: "12px 0",
                background: "var(--green)", border: "none", borderRadius: 8,
                color: "#fff", fontSize: 14, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit",
                transition: ".2s", letterSpacing: ".3px",
              }}>
                确认下注 · {parseInt(betAmount) >= 1000
                  ? Math.floor(parseInt(betAmount) / 1000) + "K"
                  : betAmount} 积分
              </button>

              {/* 免责声明（去掉"结算上链透明可查"） */}
              <p style={{
                marginTop: 12, fontSize: 11, color: "var(--muted)",
                lineHeight: 1.6, textAlign: "center",
              }}>
                预测将在截止日期后由预言机校验结算。预测市场存在风险，请理性参与，手续费 3%。
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
