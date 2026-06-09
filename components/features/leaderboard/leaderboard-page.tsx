"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Chart from "chart.js/auto";
import { useLanguage } from "@/components/providers/language-provider";
import { HeaderActions } from "@/components/layouts/header-actions";
import { Logo } from "@/components/layouts/site-logo";
import { HeaderSearch } from "@/components/layouts/header-search";
import { LB, fmt, type LbItem } from "@/lib/data/home";

type Period = "day" | "week" | "month" | "year";
type Metric = "points" | "accuracy";

const PERIODS: { key: Period; i18n: string }[] = [
  { key: "day", i18n: "lb_day" },
  { key: "week", i18n: "lb_week" },
  { key: "month", i18n: "lb_month" },
  { key: "year", i18n: "lb_year" },
];

const NAV_ITEMS = [
  { label: "公共服务", slug: "public-services" },
  { label: "政策研究", slug: "policy-research" },
  { label: "满意度调查", slug: "satisfaction-survey" },
  { label: "教育", slug: "education" },
  { label: "健康医疗", slug: "health-medical" },
  { label: "商业调查", slug: "business-survey" },
  { label: "个人/企业", slug: "personal-enterprise" },
];

// 解析数据字符串 → 数字（"+4,100" → 4100，"94%" → 94）
const parsePts = (s: string) => Number(s.replace(/[+,]/g, "")) || 0;
const parseAcc = (s: string) => parseFloat(s) || 0;

// 确定性伪随机：用于合成走势曲线（仅客户端 useEffect 内使用）
function synth(base: number, n: number, seed: number) {
  let s = seed >>> 0;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    out.push(Math.round((base * (0.8 + 0.2 * t) + (rnd() - 0.5) * base * 0.06) * 10) / 10);
  }
  out[n - 1] = base; // 末点收敛到当前值
  return out;
}

export function LeaderboardPage() {
  const { t } = useLanguage();
  const router = useRouter();

  const [period, setPeriod] = useState<Period>("day");
  const [metric, setMetric] = useState<Metric>("points");

  const barRef = useRef<HTMLCanvasElement>(null);
  const lineRef = useRef<HTMLCanvasElement>(null);
  const barInst = useRef<Chart | null>(null);
  const lineInst = useRef<Chart | null>(null);

  // 数据：按指标排序（准确率时重排，积分增长保持原序）
  const base = LB[period];
  const rows: LbItem[] = [...base];
  if (metric === "accuracy") rows.sort((a, b) => parseAcc(b.acc) - parseAcc(a.acc));

  // 总体统计
  const totalPts = base.reduce((a, b) => a + parsePts(b.pts), 0);
  const avgAcc = base.reduce((a, b) => a + parseAcc(b.acc), 0) / base.length;
  const top = rows[0];
  const cutoff = rows[rows.length - 1];
  const cutoffVal = metric === "points" ? cutoff.pts : cutoff.acc;
  const periodLabel = t(PERIODS.find((p) => p.key === period)!.i18n);
  const metricLabel = metric === "points" ? t("lb_points_gained") : t("lb_accuracy");

  // ── 图表：随 period / metric 重建 ──
  useEffect(() => {
    // 条形图：Top 10 当期对比（用各自头像底色）
    if (barRef.current) {
      barInst.current?.destroy();
      const isPts = metric === "points";
      const vals = rows.map((r) => (isPts ? parsePts(r.pts) : parseAcc(r.acc)));
      barInst.current = new Chart(barRef.current.getContext("2d")!, {
        type: "bar",
        data: {
          labels: rows.map((r) => r.n),
          datasets: [{
            data: vals,
            backgroundColor: rows.map((r) => r.c),
            borderRadius: 5,
            barThickness: 16,
          }],
        },
        options: {
          indexAxis: "y",
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: { label: (c) => (isPts ? "+" + fmt(c.parsed.x ?? 0) + " " + t("lb_pts_label") : (c.parsed.x ?? 0) + "%") },
            },
          },
          scales: {
            x: {
              beginAtZero: true,
              max: isPts ? undefined : 100,
              grid: { color: "#F1F5F9" },
              ticks: { font: { size: 10 }, color: "#94A3B8", callback: (v) => (isPts ? fmt(typeof v === "number" ? v : 0) : v + "%") },
            },
            y: { grid: { display: false }, ticks: { font: { size: 11 }, color: "#475569" } },
          },
          animation: { duration: 500 },
        },
      });
    }

    // 折线图：Top 10 平均准确率走势（合成，始终展示准确率）
    if (lineRef.current) {
      lineInst.current?.destroy();
      const ctx = lineRef.current.getContext("2d")!;
      const seed = period.length * 7919 + Math.round(avgAcc * 13);
      const series = synth(avgAcc, 8, seed);
      const grad = ctx.createLinearGradient(0, 0, 0, 220);
      grad.addColorStop(0, "rgba(30,64,175,.18)");
      grad.addColorStop(1, "rgba(30,64,175,0)");
      lineInst.current = new Chart(ctx, {
        type: "line",
        data: {
          labels: ["−7", "−6", "−5", "−4", "−3", "−2", "−1", "当前"],
          datasets: [{
            data: series,
            borderColor: "#1E40AF",
            backgroundColor: grad,
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 2.5,
            pointBackgroundColor: "#1E40AF",
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: (c) => (c.parsed.y ?? 0) + "%" } },
          },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 10 }, color: "#94A3B8" } },
            y: {
              grid: { color: "#F1F5F9" },
              ticks: { font: { size: 10 }, color: "#94A3B8", callback: (v) => v + "%" },
            },
          },
          animation: { duration: 500 },
        },
      });
    }

    return () => {
      barInst.current?.destroy();
      lineInst.current?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, metric]);

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
            <button key={item.slug} className="nitem" onClick={() => router.push(`/category/${item.slug}`)}>
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
          <span style={{ color: "var(--text2)", fontWeight: 600 }}>排行榜</span>
        </div>
      </div>

      {/* ── 主体 ── */}
      <div className="wrap" style={{ padding: "16px 24px 48px" }}>

        {/* 标题行 + 全局筛选（驱动统计/图表/榜单） */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: 4 }}>
          <div>
            <div className="sec-title" style={{ marginBottom: 4 }}>排行榜</div>
            <p style={{ fontSize: 13, color: "var(--muted)" }}>{metricLabel} · {periodLabel}榜 · 表现最佳的 Top 10 预测者</p>
          </div>
          <div className="lb-controls">
            <div className="lb-seg">
              <button className={metric === "points" ? "on" : ""} onClick={() => setMetric("points")}>{t("lb_points_gained")}</button>
              <button className={metric === "accuracy" ? "on red" : ""} onClick={() => setMetric("accuracy")}>{t("lb_accuracy")}</button>
            </div>
            <div className="lb-seg">
              {PERIODS.map((p) => (
                <button key={p.key} className={period === p.key ? "on" : ""} onClick={() => setPeriod(p.key)}>{t(p.i18n)}</button>
              ))}
            </div>
          </div>
        </div>

        {/* KPI 总体统计 */}
        <div className="lb-kpis" style={{ marginTop: 14 }}>
          {/* 榜首玩家 */}
          <div className="s-card">
            <div className="s-top">
              <span className="s-lbl">榜首玩家</span>
              <div className="s-ico" style={{ background: "rgba(30,64,175,.09)" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1E40AF" strokeWidth="2"><path d="M6 9H4.5a2.5 2.5 0 010-5H6M18 9h1.5a2.5 2.5 0 000-5H18M4 22h16M10 14.66V17a2 2 0 01-.55 1.38L8 20h8l-1.45-1.62A2 2 0 0114 17v-2.34M18 2H6v7a6 6 0 0012 0V2z" /></svg>
              </div>
            </div>
            <div className="s-val" style={{ fontSize: 20 }}>{top.n}</div>
            <div className="lb-kpi-sub">{metric === "points" ? <>积分增长 <b>{top.pts}</b> · 准确率 <b>{top.acc}</b></> : <>准确率 <b>{top.acc}</b> · 积分 <b>{top.pts}</b></>}</div>
          </div>

          {/* 上榜总积分 */}
          <div className="s-card">
            <div className="s-top">
              <span className="s-lbl">上榜总积分</span>
              <div className="s-ico" style={{ background: "rgba(220,38,38,.09)" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v10M9 9.5h4a1.5 1.5 0 010 3h-2a1.5 1.5 0 000 3h4" /></svg>
              </div>
            </div>
            <div className="s-val">{fmt(totalPts)}</div>
            <div className="lb-kpi-sub">{periodLabel}榜 Top 10 积分增长合计</div>
          </div>

          {/* 平均准确率 */}
          <div className="s-card">
            <div className="s-top">
              <span className="s-lbl">平均准确率</span>
              <div className="s-ico" style={{ background: "rgba(22,163,74,.09)" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.2" fill="#16A34A" /></svg>
              </div>
            </div>
            <div className="s-val">{avgAcc.toFixed(1)}%</div>
            <div className="lb-kpi-sub">Top 10 预测者准确率均值</div>
          </div>

          {/* 入榜门槛 */}
          <div className="s-card">
            <div className="s-top">
              <span className="s-lbl">入榜门槛</span>
              <div className="s-ico" style={{ background: "rgba(124,58,237,.09)" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2"><path d="M3 21V8M9 21V4M15 21v-9M21 21V11" /></svg>
              </div>
            </div>
            <div className="s-val">{cutoffVal}</div>
            <div className="lb-kpi-sub">第 10 名 · {metricLabel}</div>
          </div>
        </div>

        {/* 仪表盘：左图表 + 右榜单 */}
        <div className="lb-dash">
          {/* 左：两张图表 */}
          <div className="lb-charts">
            <div className="lb-cardx">
              <div className="lb-cardx-h">
                <span className="lb-cardx-t">Top 10 {metricLabel}对比</span>
                <span className="lb-cardx-s">{periodLabel}榜</span>
              </div>
              <div style={{ height: 380 }}><canvas ref={barRef} /></div>
            </div>
            <div className="lb-cardx">
              <div className="lb-cardx-h">
                <span className="lb-cardx-t">Top 10 平均准确率走势</span>
                <span className="lb-cardx-s">近 8 期 · 当前 {avgAcc.toFixed(1)}%</span>
              </div>
              <div style={{ height: 220 }}><canvas ref={lineRef} /></div>
            </div>
          </div>

          {/* 右：榜单 */}
          <div className="lb-panel lb-page">
            <div className="lb-head">
              <div className="lb-ttl">{t("lb_title")}</div>
              <div style={{ color: "rgba(255,255,255,.65)", fontSize: 11.5 }}>{metricLabel} · {periodLabel}榜</div>
            </div>
            <div className="lb-list">
              {rows.map((item, i) => {
                const rc = i === 0 ? "g" : i === 1 ? "s" : i === 2 ? "b" : "";
                const main = metric === "points" ? item.pts : item.acc;
                const sub = metric === "points"
                  ? `${t("lb_accuracy_label")}: ${item.acc}`
                  : `${item.pts} ${t("lb_pts_label")}`;
                const mc = metric === "points" ? "var(--green)" : "var(--blue)";
                return (
                  <div className="lb-item" key={`${item.n}-${i}`}>
                    <span className={"lb-rank " + rc}>{i + 1}</span>
                    <div className="lb-av" style={{ background: item.c }}>{item.n[0]}</div>
                    <div className="lb-user">
                      <div className="lb-name">{item.n}</div>
                      <div className="lb-acc">{sub}</div>
                    </div>
                    <span className="lb-pts" style={{ color: mc }}>{main}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
