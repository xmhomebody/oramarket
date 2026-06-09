"use client";

// OraMarket 首页客户端视图
// 设计/内容/风格与原站 index.html 保持一致：静态结构用 JSX 渲染，
// 图表(Chart.js)、轮播、无限滚动、实时兑换、排行榜等命令式逻辑在 useEffect 中移植执行。
import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";
import { useLanguage } from "@/components/providers/language-provider";
import { HeaderActions } from "@/components/layouts/header-actions";
import { Logo } from "@/components/layouts/site-logo";
import { HeaderSearch } from "@/components/layouts/header-search";
import { type Lang, translate } from "@/lib/i18n/dict";
import type { Survey } from "@/lib/types/survey";
import {
  AV_COLORS,
  LB,
  REGIONS,
  HOT_TOPICS,
  TRENDS,
  TREND_DATES,
  R_NAMES,
  R_CARDS,
  R_KEYS,
  MQ_DATA,
  STAT_TARGETS,
  FILTER_COUNTS,
  fmt,
  rnd,
  pick,
} from "@/lib/data/home";

// 绿色上涨小三角图标（统计卡片复用）
function UpTriangle() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="#16A34A">
      <path d="M7 14l5-5 5 5H7z" />
    </svg>
  );
}

export function OraMarketHome() {
  const { lang, setLang } = useLanguage();

  // 跨 effect 共享的可变引用
  const langRef = useRef<Lang>(lang); // 当前语言（命令式逻辑读取）
  const setLangRef = useRef(setLang); // 切换语言函数
  const applyI18nRef = useRef<() => void>(() => {}); // 暴露 applyI18n 供语言变化时调用
  const initialized = useRef(false); // 防止 StrictMode 下重复初始化
  const langInitDone = useRef(false); // 跳过语言 effect 的首次触发

  setLangRef.current = setLang;

  // 语言变化时重新应用 i18n（首次由挂载 effect 负责）
  useEffect(() => {
    langRef.current = lang;
    if (!langInitDone.current) {
      langInitDone.current = true;
      return;
    }
    applyI18nRef.current();
  }, [lang]);

  // 挂载：初始化全部命令式逻辑（图表/轮播/卡片/实时/排行榜/计数）
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // ── 通用工具 ──
    const t = (key: string) => translate(langRef.current, key);
    const charts: Chart[] = []; // 所有图表实例，便于卸载时销毁
    const trendCharts: Chart[] = []; // 轮播趋势图（需 resize）
    const timers: ReturnType<typeof setInterval>[] = [];
    const PER_PAGE = 40;
    let page = 0;
    let busy = false;
    let cIdx = 0; // 当前轮播索引
    let cTimer: ReturnType<typeof setInterval> | undefined;
    let lbPeriod: keyof typeof LB = "day"; // 排行榜周期
    let lbMet: "points" | "accuracy" = "points"; // 排行榜指标
    let dbSurveys: Survey[] = []; // DB 拉取的真实调研数据

    // ── 统计卡片：迷你折线 + 数字滚动 ──
    function mkSparkline(id: string, color: string) {
      const el = document.getElementById(id) as HTMLCanvasElement | null;
      if (!el) return;
      const pts = Array.from({ length: 24 }, () => rnd(30, 100));
      charts.push(
        new Chart(el.getContext("2d")!, {
          type: "line",
          data: {
            labels: pts.map((_, i) => i),
            datasets: [
              { data: pts, borderColor: color, borderWidth: 1.5, backgroundColor: color + "22", fill: true, tension: 0.4, pointRadius: 0 },
            ],
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { enabled: false } },
            scales: { x: { display: false }, y: { display: false } }, animation: { duration: 900 },
          },
        }),
      );
    }
    function countUp(id: string, target: number) {
      const el = document.getElementById(id);
      if (!el) return;
      const t0 = performance.now();
      const dur = 1800;
      (function tick(now: number) {
        const p = Math.min((now - t0) / dur, 1);
        const e = 1 - Math.pow(1 - p, 4);
        el.textContent = Math.floor(e * target).toLocaleString();
        if (p < 1) requestAnimationFrame(tick);
      })(performance.now());
    }

    // ── 精选轮播：标题/元信息/标签/评论的多语言填充 ──
    function updateCarouselI18n() {
      const slides = document.querySelectorAll(".c-slide");
      const coinIcon = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="1.8" style="flex-shrink:0"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/></svg>`;
      const usersIcon = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="flex-shrink:0"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>`;
      const clockIcon = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`;

      if (dbSurveys.length > 0) {
        const top5 = dbSurveys.slice(0, 5);
        slides.forEach((slide, i) => {
          const s = top5[i];
          if (!s) return;
          (slide as HTMLElement).dataset.surveyId = String(s.id);
          const titleText = langRef.current === "zh-TW" ? (s.title_zh_tw ?? s.title_zh_cn) :
                            langRef.current === "en"    ? (s.title_en    ?? s.title_zh_cn) : s.title_zh_cn;
          const title = slide.querySelector(".c-title");
          if (title) title.textContent = titleText;
          const meta = slide.querySelector(".c-meta");
          if (meta) {
            meta.innerHTML = `
              <span style="display:inline-flex;align-items:center;gap:4px">${coinIcon}<b style="font-family:var(--font-fira-code),monospace;color:var(--blue)">${fmt(s.pool)}</b><span>${t("carousel_pool")}</span></span>
              <span style="display:inline-flex;align-items:center;gap:4px">${usersIcon}${fmt(s.parts)} ${t("carousel_participants")}</span>
              <span>${t("card_published")} ${s.pub_date}</span>
              <span style="display:inline-flex;align-items:center;gap:4px">${clockIcon}${t("card_closes")} ${s.deadline_date}</span>`;
          }
          const tagsEl = slide.querySelector(".c-tags");
          if (tagsEl) tagsEl.innerHTML = s.tags.map((tg) => `<span class="c-tag">${tg}</span>`).join("");
          const noPct = 100 - s.yes_pct;
          const yesOdds = (100 / s.yes_pct).toFixed(2);
          const noOdds = (100 / noPct).toFixed(2);
          // overlay
          const coYes = slide.querySelector(".co-val.y");
          const coNo = slide.querySelector(".co-val.n");
          if (coYes) coYes.textContent = `${s.yes_pct}% (${yesOdds}x)`;
          if (coNo) coNo.textContent = `${noPct}% (${noOdds}x)`;
          // vote bars
          const yPct = slide.querySelector(".v-pct.y");
          const nPct = slide.querySelector(".v-pct.n");
          const vOpts = slide.querySelectorAll(".v-opt");
          const yOddsEl = vOpts[0]?.querySelector(".v-odds");
          const nOddsEl = vOpts[1]?.querySelector(".v-odds");
          const yFill = vOpts[0]?.querySelector(".v-fill.y") as HTMLElement | null;
          const nFill = vOpts[1]?.querySelector(".v-fill.n") as HTMLElement | null;
          if (yPct) yPct.textContent = `${s.yes_pct}%`;
          if (nPct) nPct.textContent = `${noPct}%`;
          if (yOddsEl) yOddsEl.textContent = `×${yesOdds}`;
          if (nOddsEl) nOddsEl.textContent = `×${noOdds}`;
          if (yFill) yFill.style.width = `${s.yes_pct}%`;
          if (nFill) nFill.style.width = `${noPct}%`;
        });
        return;
      }

      // No static fallback — carousel stays empty until DB data loads
    }

    // ── 侧栏：最新 / 热门调研列表 ──
    function renderSideSurveys() {
      const attachClicks = (container: HTMLElement | null) => {
        container?.querySelectorAll<HTMLElement>(".side-survey[data-id]").forEach((el) => {
          el.addEventListener("click", () => { window.location.href = `/survey/${el.dataset.id}`; });
        });
      };

      if (dbSurveys.length > 0) {
        const mkDBItem = (s: Survey) => {
          const noPct = 100 - s.yes_pct;
          const yesOdds = (100 / s.yes_pct).toFixed(2);
          const noOdds = (100 / noPct).toFixed(2);
          const titleText = langRef.current === "zh-TW" ? (s.title_zh_tw ?? s.title_zh_cn) :
                            langRef.current === "en"    ? (s.title_en    ?? s.title_zh_cn) : s.title_zh_cn;
          return `<div class="side-survey" data-id="${s.id}" style="cursor:pointer">
            <div class="side-ttl">${titleText}</div>
            <div class="side-opts">
              <div class="s-opt y"><span class="so-lbl">YES</span><span class="so-pct">${s.yes_pct}%</span><span class="so-odds">${yesOdds}x</span></div>
              <div class="s-opt n"><span class="so-lbl">NO</span><span class="so-pct">${noPct}%</span><span class="so-odds">${noOdds}x</span></div>
            </div>
          </div>`;
        };
        const byNewest = [...dbSurveys].sort((a, b) => new Date(b.pub_date).getTime() - new Date(a.pub_date).getTime()).slice(0, 5);
        const byPool = dbSurveys.slice(0, 5); // already sorted by pool desc
        const latest = document.getElementById("latestList");
        const hot = document.getElementById("hotList");
        if (latest) { latest.innerHTML = byNewest.map(mkDBItem).join(""); attachClicks(latest); }
        if (hot)    { hot.innerHTML    = byPool.map(mkDBItem).join("");    attachClicks(hot); }
        return;
      }

      // No static fallback — leave empty until DB data arrives
    }

    // ── 顶部跑马灯：中奖播报 ──
    function updateMarqueeI18n() {
      const topicKey = langRef.current === "en" ? "topic_en" : langRef.current === "zh-TW" ? "topic_zhTW" : "topic_zh";
      const wonWord = t("mq_won");
      const onWord = t("mq_on");
      let html = "";
      for (let r = 0; r < 2; r++) {
        MQ_DATA.forEach((d) => {
          html += `<span class="mq-item"><span class="w">${d.name}</span> ${wonWord} <span class="p">${d.pts} ${t("unit_pts")}</span> ${onWord} ${d[topicKey as "topic_zh" | "topic_zhTW" | "topic_en"]}</span><span class="mq-sep">|</span>\n`;
        });
      }
      const track = document.getElementById("mqTrack");
      if (track) track.innerHTML = html;
    }

    // ── 三个热门话题卡片 ──
    function renderTopics() {
      const row = document.getElementById("topicRow");
      if (!row) return;
      row.innerHTML = HOT_TOPICS.map(
        (tp) => `
        <div class="topic-card">
          <div class="tc-head"><span class="tc-dot" style="background:${tp.c}"></span><span class="tc-name">${t(tp.nameKey)}</span></div>
          <div class="tc-pool">${fmt(tp.pool)}<span>${t("htc_pts_pool")}</span></div>
          <div class="tc-stat"><span class="tc-inc">+${fmt(tp.inc)}/hr</span><span class="tc-pct">▲ ${tp.pct}%</span></div>
        </div>`,
      ).join("");
    }

    // ── 地区参与占比 ──
    function renderRegion() {
      const grid = document.getElementById("regionGrid");
      if (!grid) return;
      grid.innerHTML = REGIONS.map(
        (d) => `
        <div class="region-item">
          <div class="r-info"><span class="r-name">${t(d.key)}</span><span class="r-pct">${d.pct}%</span></div>
          <div class="r-bar-wrap"><div class="r-bar" style="width:${d.pct}%"></div></div>
          <div class="r-stat">${d.pts} ${t("unit_pts")} · ${d.users} ${t("stat_participants")}</div>
        </div>`,
      ).join("");
    }

    // ── 排行榜（指标 × 周期）──
    function renderLB() {
      const list = document.getElementById("lbList");
      if (!list) return;
      const data = LB[lbPeriod].slice();
      if (lbMet === "accuracy") data.sort((a, b) => parseFloat(b.acc) - parseFloat(a.acc));
      list.innerHTML = data
        .map((item, i) => {
          const rc = i === 0 ? "g" : i === 1 ? "s" : i === 2 ? "b" : "";
          const main = lbMet === "points" ? item.pts : item.acc;
          const sub = lbMet === "points" ? `${t("lb_accuracy_label")}: ${item.acc}` : `${item.pts} ${t("lb_pts_label")}`;
          const mc = lbMet === "points" ? "var(--green)" : "var(--blue)";
          return `<div class="lb-item">
            <span class="lb-rank ${rc}">${i + 1}</span>
            <div class="lb-av" style="background:${item.c}">${item.n[0]}</div>
            <div class="lb-user"><div class="lb-name">${item.n}</div><div class="lb-acc">${sub}</div></div>
            <span class="lb-pts" style="color:${mc}">${main}</span>
          </div>`;
        })
        .join("");
    }

    // ── 预测卡片（无限滚动，使用 DB 数据）──
    function mkCardFromDB(s: Survey) {
      const div = document.createElement("div");
      div.className = "pred-card";
      div.style.cursor = "pointer";
      div.addEventListener("click", () => { window.location.href = `/survey/${s.id}`; });
      div.style.animationDelay = (s.id % PER_PAGE) * 20 + "ms";
      const noPct = 100 - s.yes_pct;
      const yesOdds = (100 / s.yes_pct).toFixed(2);
      const noOdds = (100 / noPct).toFixed(2);
      const avs = AV_COLORS.slice(0, 3).map((c, i) => `<div class="av" style="background:${c}">${String.fromCharCode(65 + i)}</div>`).join("");
      const titleText = langRef.current === "zh-TW" ? (s.title_zh_tw ?? s.title_zh_cn) :
                        langRef.current === "en"    ? (s.title_en    ?? s.title_zh_cn) : s.title_zh_cn;
      const tags = s.tags.map((tag) => `<span class="pc-tag">${tag}</span>`).join("");
      div.innerHTML = `
        <div class="pc-title">${titleText}</div>
        <div class="pc-pool">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/></svg>
          <span class="pc-pool-n">${fmt(s.pool)}</span><span class="pc-pool-l">${t("card_pts_pool")}</span>
        </div>
        <div class="pc-vote">
          <div class="pc-vrow"><div class="pc-vlbl"><span class="pc-vtag y">YES</span><span class="pc-vodds">×${yesOdds}</span></div><span class="pc-vpct y">${s.yes_pct}%</span></div>
          <div class="pc-bar"><div class="pc-bary" style="width:${s.yes_pct}%"></div></div>
          <div class="pc-vrow" style="margin-top:3px"><div class="pc-vlbl"><span class="pc-vtag n">NO</span><span class="pc-vodds">×${noOdds}</span></div><span class="pc-vpct n">${noPct}%</span></div>
        </div>
        <div class="pc-parts"><div class="av-stack">${avs}</div><span class="pc-cnt">${fmt(s.parts)} ${t("card_joined")}</span></div>
        <div class="pc-tags">${tags}</div>
        <div class="pc-foot"><span class="pc-pub">${t("card_published")}: ${s.pub_date}</span><span class="pc-dl">${t("card_closes")}: ${s.deadline_date}</span></div>`;
      return div;
    }

    function loadPage() {
      if (busy) return;
      if (dbSurveys.length === 0) return;
      const filtered = getFilteredSurveys();
      const start = page * PER_PAGE;
      const total = filtered.length;
      const allDone = document.getElementById("allDone");
      const loadInd = document.getElementById("loadInd");
      if (start >= total) {
        if (allDone) allDone.style.display = "block";
        if (loadInd) loadInd.style.display = "none";
        return;
      }
      busy = true;
      if (loadInd) loadInd.style.display = "block";
      setTimeout(() => {
        const grid = document.getElementById("cardGrid");
        if (grid) {
          filtered.slice(start, start + PER_PAGE).forEach((s) => grid.appendChild(mkCardFromDB(s)));
        }
        page++;
        busy = false;
        if (loadInd) loadInd.style.display = "none";
        if (page * PER_PAGE >= total && allDone) allDone.style.display = "block";
      }, 500);
    }
    function reloadCards() {
      const grid = document.getElementById("cardGrid");
      if (grid) grid.innerHTML = "";
      page = 0;
      busy = false;
      const allDone = document.getElementById("allDone");
      const loadInd = document.getElementById("loadInd");
      if (allDone) allDone.style.display = "none";
      if (loadInd) loadInd.style.display = "block";
      loadPage();
    }

    // ── 应用 i18n：静态文本 + 所有动态区块 ──
    function applyI18n() {
      document.querySelectorAll("[data-i18n]").forEach((el) => {
        const key = el.getAttribute("data-i18n")!;
        const val = t(key);
        const svg = el.querySelector("svg");
        if (svg) {
          const clone = svg.cloneNode(true);
          el.textContent = val;
          el.insertBefore(clone, el.firstChild);
        } else {
          el.textContent = val;
        }
      });
      document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
        (el as HTMLInputElement).placeholder = t(el.getAttribute("data-i18n-placeholder")!);
      });
      document.title = t("page_title");
      document.documentElement.lang = langRef.current;
      const sel = document.getElementById("langSelect") as HTMLSelectElement | null;
      if (sel) sel.value = langRef.current;
      // 筛选标签（含数量）—— 每次语言切换重新渲染
      renderFilterTags();
      updateCarouselI18n();
      renderSideSurveys();
      updateMarqueeI18n();
      renderTopics();
      renderLB();
      renderRegion();
      reloadCards();
    }

    // ── 首页筛选标签（按调研 tags 字段出现频率动态生成，取 top 7）──
    function getTopTags(n: number): string[] {
      const freq = new Map<string, number>();
      dbSurveys.forEach((s) => s.tags.forEach((tag) => freq.set(tag, (freq.get(tag) ?? 0) + 1)));
      return [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([tag]) => tag);
    }

    function getFilteredSurveys(): Survey[] {
      const row = document.getElementById("filterRow");
      const activeTag = row?.dataset.active || "";
      if (!activeTag) return dbSurveys;
      return dbSurveys.filter((s) => s.tags.includes(activeTag));
    }

    function renderFilterTags() {
      const row = document.getElementById("filterRow");
      if (!row) return;
      const activeTag = row.dataset.active || "";
      const topTags = getTopTags(7);
      const chips = [
        { label: "全部", tag: "" },
        ...topTags.map((tag) => ({ label: tag, tag })),
      ];
      row.innerHTML = chips.map(({ label, tag }) => {
        const count = tag ? dbSurveys.filter((s) => s.tags.includes(tag)).length : dbSurveys.length;
        const isActive = activeTag === tag;
        const badgeStyle = isActive
          ? "background:rgba(255,255,255,.22);color:#fff"
          : "background:rgba(0,0,0,.05);color:var(--muted)";
        const badge = `<span style="margin-left:5px;font-size:11px;font-family:var(--font-fira-code),monospace;padding:1px 6px;border-radius:4px;${badgeStyle}">${count}</span>`;
        return `<button class="f-tag${isActive ? " active" : ""}" data-filter="${tag}">${label}${badge}</button>`;
      }).join("");
      row.querySelectorAll(".f-tag").forEach((btn) => {
        btn.addEventListener("click", function (this: HTMLElement) {
          row.dataset.active = this.dataset.filter || "";
          renderFilterTags();
          reloadCards();
        });
      });
    }
    applyI18nRef.current = applyI18n;

    // ── 轮播趋势折线图 ──
    function mkTrend(i: number) {
      const cv = document.getElementById("ctrend" + i) as HTMLCanvasElement | null;
      if (!cv) return;
      const yes = TRENDS[i];
      const no = yes.map((v) => 100 - v);
      trendCharts[i] = new Chart(cv.getContext("2d")!, {
        type: "line",
        data: {
          labels: TREND_DATES,
          datasets: [
            { label: "YES", data: yes, borderColor: "#2563EB", backgroundColor: "rgba(37,99,235,.08)", borderWidth: 2, tension: 0.4, pointRadius: 0, fill: true },
            { label: "NO", data: no, borderColor: "#DC2626", backgroundColor: "transparent", borderWidth: 2, tension: 0.4, pointRadius: 0, borderDash: [4, 3] },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false, interaction: { mode: "index", intersect: false },
          plugins: { legend: { display: false }, tooltip: { enabled: true, callbacks: { label: (c) => c.dataset.label + ": " + c.parsed.y + "%" } } },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 8 }, color: "#94A3B8", maxRotation: 0, autoSkip: true, maxTicksLimit: 6 } },
            y: { min: 0, max: 100, grid: { color: "#F1F5F9" }, ticks: { font: { size: 8 }, color: "#94A3B8", stepSize: 25, callback: (v) => v + "%" } },
          },
          animation: { duration: 700 },
        },
      });
      charts.push(trendCharts[i]);
    }

    // ── 实时兑换堆栈 ──
    function pushRedeem(first?: boolean) {
      const list = document.getElementById("liveList");
      if (!list) return;
      const card = pick(R_KEYS);
      const val = pick(R_CARDS[card]);
      const name = pick(R_NAMES);
      const pts = rnd(8, 50) * 100;
      const c = pick(AV_COLORS);
      const justNowText = t("live_just_now");
      const momentsText = t("live_moments_ago");
      [...list.children].forEach((ch) => {
        const tm = ch.querySelector(".li-time");
        if (tm && tm.textContent === justNowText) tm.textContent = momentsText;
      });
      const el = document.createElement("div");
      el.className = "live-item" + (first ? "" : " enter");
      el.innerHTML = `<div class="li-av" style="background:${c}">${name[0]}</div>
        <div class="li-body"><div class="li-top"><span class="li-name">${name}</span><span class="li-time">${justNowText}</span></div>
        <div class="li-act">${t("live_redeemed")} <b>${card} ${val}</b> · <span class="li-pts">${fmt(pts)} ${t("unit_pts")}</span></div></div>`;
      list.prepend(el);
      if (!first) requestAnimationFrame(() => el.classList.remove("enter"));
      while (list.children.length > 7) list.removeChild(list.lastChild!);
    }

    // ── 轮播控制 ──
    function updateCarousel() {
      document.querySelectorAll(".c-slide").forEach((s, i) => s.classList.toggle("active", i === cIdx));
      document.querySelectorAll(".c-dot").forEach((d, i) => d.classList.toggle("active", i === cIdx));
      setTimeout(() => { if (trendCharts[cIdx]) trendCharts[cIdx].resize(); }, 30);
    }
    function cNext() { cIdx = (cIdx + 1) % 5; updateCarousel(); resetCTimer(); }
    function cPrev() { cIdx = (cIdx + 4) % 5; updateCarousel(); resetCTimer(); }
    function goSlide(n: number) { cIdx = n; updateCarousel(); resetCTimer(); }
    function resetCTimer() {
      if (cTimer) clearInterval(cTimer);
      cTimer = setInterval(cNext, 5000);
    }

    // ── 初始化执行顺序（与原站一致）──
    mkSparkline("sc1", "#1E40AF");
    mkSparkline("sc2", "#DC2626");
    mkSparkline("sc3", "#16A34A");
    mkSparkline("sc4", "#7C3AED");
    countUp("sv1", STAT_TARGETS[0]);
    countUp("sv2", STAT_TARGETS[1]);
    countUp("sv3", STAT_TARGETS[2]);
    countUp("sv4", STAT_TARGETS[3]);

    applyI18n(); // 必须在 mkTrend 之前，让 DOM 展开到最终高度

    for (let i = 0; i < 5; i++) mkTrend(i);
    if (trendCharts[0]) trendCharts[0].resize();

    for (let i = 0; i < 5; i++) pushRedeem(true);

    // ── 各类定时器 ──
    timers.push(setInterval(pushRedeem, 3500));
    resetCTimer();
    // 实时统计数字每 3 秒跳动
    timers.push(
      setInterval(() => {
        const inc = [rnd(5, 40), rnd(3, 20), rnd(0, 1), rnd(1, 4)];
        ["sv1", "sv2", "sv3", "sv4"].forEach((id, i) => {
          const el = document.getElementById(id);
          if (!el) return;
          const cur = parseInt(el.textContent!.replace(/,/g, "")) || STAT_TARGETS[i];
          el.textContent = (cur + inc[i]).toLocaleString();
        });
      }, 3000),
    );

    // ── 交互事件绑定 ──
    // 导航：有分类页的菜单项点击后跳转，其余只高亮
    const NAV_ROUTES: Record<string, string> = {
      nav_trending:          "/trending",
      nav_latest:            "/latest",
      nav_public_services:   "/category/public-services",
      nav_policy_research:   "/category/policy-research",
      nav_satisfaction_survey: "/category/satisfaction-survey",
      nav_education:         "/category/education",
      nav_health_medical:    "/category/health-medical",
      nav_business_survey:   "/category/business-survey",
      nav_personal_enterprise: "/category/personal-enterprise",
    };
    document.querySelectorAll(".nitem").forEach((b) => {
      b.addEventListener("click", function (this: HTMLElement) {
        document.querySelectorAll(".nitem").forEach((x) => x.classList.remove("active"));
        this.classList.add("active");
        const route = NAV_ROUTES[this.getAttribute("data-i18n") || this.getAttribute("data-nav") || ""];
        if (route) window.location.href = route;
      });
    });
    // 筛选标签的高亮与数量徽章统一由 renderFilterTags() 在重渲染时设置
    // （根据 data-active 决定 .active 类与徽章配色）。
    // 此处不再附加事件委托——之前的委托会在重渲染后把 renderFilterTags 刚加上的
    // .active 类移除，导致激活项失去蓝色高亮、白色数字落在白底上而“消失”。
    // 轮播左右箭头（第一个为上一张，第二个为下一张）
    const navBtns = document.querySelectorAll(".c-btn");
    navBtns[0]?.addEventListener("click", cPrev);
    navBtns[1]?.addEventListener("click", cNext);
    // 轮播圆点
    document.querySelectorAll(".c-dot").forEach((d, i) => d.addEventListener("click", () => goSlide(i)));
    // 排行榜：周期标签
    document.querySelectorAll(".lb-tab").forEach((b) =>
      b.addEventListener("click", function (this: HTMLElement) {
        lbPeriod = (this.dataset.period as keyof typeof LB) || "day";
        document.querySelectorAll(".lb-tab").forEach((x) => x.classList.remove("active"));
        this.classList.add("active");
        renderLB();
      }),
    );
    // 排行榜：指标标签
    document.querySelectorAll(".lb-mtab").forEach((b) =>
      b.addEventListener("click", function (this: HTMLElement) {
        lbMet = (this.dataset.metric as "points" | "accuracy") || "points";
        document.querySelectorAll(".lb-mtab").forEach((x) => x.classList.remove("active"));
        this.classList.add("active");
        renderLB();
      }),
    );
    // 侧栏"查看全部"按钮
    document.getElementById("latestMore")?.addEventListener("click", () => { window.location.href = "/latest"; });
    document.getElementById("hotMore")?.addEventListener("click", () => { window.location.href = "/trending"; });

    // 语言切换：写入上下文（会持久化并触发重新应用 i18n）
    const langSelect = document.getElementById("langSelect") as HTMLSelectElement | null;
    langSelect?.addEventListener("change", function () {
      setLangRef.current(this.value as Lang);
    });

    // 无限滚动观察器
    const sentinel = document.getElementById("sentinel");
    const observer = new IntersectionObserver((e) => { if (e[0].isIntersecting) loadPage(); }, { rootMargin: "300px" });
    if (sentinel) observer.observe(sentinel);

    // ── DB 数据获取：用真实数据替换静态/PRNG 数据 ──
    fetch("/api/surveys/list?limit=200&sort=pool")
      .then((r) => r.json())
      .then((json: { data?: Survey[] }) => {
        dbSurveys = json.data ?? [];
        if (dbSurveys.length === 0) return;
        updateCarouselI18n();
        // 为轮播幻灯片绑定点击跳转
        document.querySelectorAll<HTMLElement>(".c-slide[data-survey-id]").forEach((slide) => {
          slide.style.cursor = "pointer";
          slide.addEventListener("click", (e) => {
            if ((e.target as HTMLElement).closest(".c-btn, .c-dot")) return;
            if (slide.dataset.surveyId) window.location.href = `/survey/${slide.dataset.surveyId}`;
          });
        });
        renderSideSurveys();
        renderFilterTags();
        reloadCards();
      })
      .catch(() => {});

    // ── 卸载清理 ──
    return () => {
      timers.forEach(clearInterval);
      if (cTimer) clearInterval(cTimer);
      observer.disconnect();
      charts.forEach((c) => c.destroy());
    };
    // 仅挂载时执行一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ====== 静态结构（zh-CN 默认文案，挂载后由 applyI18n 按语言覆盖）======
  return (
    <>
      {/* ══ HEADER ══ */}
      <header>
        <div className="h-inner">
          <Logo />
          <HeaderSearch />
          <HeaderActions />
        </div>
      </header>

      {/* ══ NAV ══ */}
      <nav className="mnav">
        <div className="n-inner">
          <button className="nitem hot active" data-nav="nav_trending">
            <span data-i18n="nav_trending">热门</span>
          </button>
          <button className="nitem" data-i18n="nav_latest">最新</button>
          <div className="n-div"></div>
          <button className="nitem" data-i18n="nav_public_services">公共服务</button>
          <button className="nitem" data-i18n="nav_policy_research">政策研究</button>
          <button className="nitem" data-i18n="nav_satisfaction_survey">满意度调查</button>
          <button className="nitem" data-i18n="nav_education">教育</button>
          <button className="nitem" data-i18n="nav_health_medical">健康医疗</button>
          <button className="nitem" data-i18n="nav_business_survey">商业调查</button>
          <button className="nitem" data-i18n="nav_personal_enterprise">个人/企业</button>
        </div>
      </nav>

      {/* ══ MARQUEE ══ */}
      <div className="mq-bar">
        <div className="mq-label" data-i18n="mq_live">实时</div>
        <div className="mq-track" id="mqTrack"></div>
      </div>

      {/* ══ STATS ══ */}
      <section className="stats-sec">
        <div className="wrap">
          <div className="stats-grid">
            <div className="s-card">
              <div className="s-top">
                <span className="s-lbl" data-i18n="stat_total_pool">总积分池</span>
                <div className="s-ico" style={{ background: "rgba(30,64,175,.09)" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1E40AF" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                </div>
              </div>
              <div className="s-val" id="sv1">0</div>
              <div className="s-chg">
                <UpTriangle />
                <span className="s-inc">+1,247/hr</span>
                <span className="s-unit" data-i18n="unit_pts">积分</span>
                <span className="s-pct">▲ 2.4%</span>
              </div>
              <div className="s-chart"><canvas id="sc1"></canvas></div>
            </div>
            <div className="s-card">
              <div className="s-top">
                <span className="s-lbl" data-i18n="stat_24h_volume">24小时积分量</span>
                <div className="s-ico" style={{ background: "rgba(220,38,38,.09)" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
                </div>
              </div>
              <div className="s-val" id="sv2">0</div>
              <div className="s-chg">
                <UpTriangle />
                <span className="s-inc">+892/hr</span>
                <span className="s-unit" data-i18n="unit_pts">积分</span>
                <span className="s-pct">▲ 1.8%</span>
              </div>
              <div className="s-chart"><canvas id="sc2"></canvas></div>
            </div>
            <div className="s-card">
              <div className="s-top">
                <span className="s-lbl" data-i18n="stat_total_predictions">预测总数</span>
                <div className="s-ico" style={{ background: "rgba(22,163,74,.09)" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></svg>
                </div>
              </div>
              <div className="s-val" id="sv3">0</div>
              <div className="s-chg">
                <UpTriangle />
                <span className="s-inc">+23/hr</span>
                <span className="s-unit" data-i18n="unit_topics">话题</span>
                <span className="s-pct">▲ 0.9%</span>
              </div>
              <div className="s-chart"><canvas id="sc3"></canvas></div>
            </div>
            <div className="s-card">
              <div className="s-top">
                <span className="s-lbl" data-i18n="stat_participants">参与者</span>
                <div className="s-ico" style={{ background: "rgba(124,58,237,.09)" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>
                </div>
              </div>
              <div className="s-val" id="sv4">0</div>
              <div className="s-chg">
                <UpTriangle />
                <span className="s-inc">+156/hr</span>
                <span className="s-unit" data-i18n="unit_users">用户</span>
                <span className="s-pct">▲ 3.1%</span>
              </div>
              <div className="s-chart"><canvas id="sc4"></canvas></div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ FEATURED ══ */}
      <section className="feat-sec">
        <div className="wrap">
          <div className="feat-layout">
            {/* 左：轮播 + 热门话题 */}
            <div className="feat-left">
              <div className="sec-title" data-i18n="sec_featured">精选预测</div>
              <div className="carousel">
                <div className="c-nav">
                  <button className="c-btn"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg></button>
                  <button className="c-btn"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg></button>
                </div>
                {[0,1,2,3,4].map((i) => (
                  <div className={"c-slide" + (i === 0 ? " active" : "")} id={"cs" + i} key={i}>
                    <div className="c-info">
                      <div className="c-title"></div>
                      <div className="c-meta"></div>
                      <div className="c-tags"></div>
                    </div>
                    <div className="c-body">
                      <div className="c-votes">
                        <div className="v-opt">
                          <div className="v-row"><span className="v-lbl y">YES</span><span className="v-pct y"></span></div>
                          <div className="v-odds"></div>
                          <div className="v-bar"><div className="v-fill y" style={{ width: "0%" }}></div></div>
                        </div>
                        <div className="v-opt">
                          <div className="v-row"><span className="v-lbl n">NO</span><span className="v-pct n"></span></div>
                          <div className="v-odds"></div>
                          <div className="v-bar"><div className="v-fill n" style={{ width: "0%" }}></div></div>
                        </div>
                      </div>
                      <div className="chart-col">
                        <div className="chart-overlay">
                          <div className="chart-overlay-row"><span className="co-lbl y">YES</span><span className="co-val y"></span></div>
                          <div className="chart-overlay-row"><span className="co-lbl n">NO</span><span className="co-val n"></span></div>
                        </div>
                        <div className="c-trend"><canvas id={"ctrend" + i}></canvas></div>
                      </div>
                    </div>
                    <div className="c-comments"><div className="cc-track"></div></div>
                  </div>
                ))}
                {/* Dots */}
                <div className="c-dots" id="cDots">
                  {[0,1,2,3,4].map((i) => (
                    <button className={"c-dot" + (i === 0 ? " active" : "")} key={i}></button>
                  ))}
                </div>
              </div>
              {/* 三个热门话题卡片 */}
              <div className="topic-row" id="topicRow"></div>
            </div>

            {/* 右：最新 + 热门 */}
            <div className="feat-sidebar">
              <div className="s-panel">
                <div className="p-head"><span className="p-title" data-i18n="panel_latest">最新预测</span><span id="latestMore" className="p-more" data-i18n="view_all" style={{cursor:"pointer"}}>查看全部 ›</span></div>
                <div className="side-list" id="latestList"></div>
              </div>
              <div className="s-panel">
                <div className="p-head"><span className="p-title" data-i18n="panel_hot_topics">热门话题</span><span id="hotMore" className="p-more" data-i18n="view_all" style={{cursor:"pointer"}}>查看全部 ›</span></div>
                <div className="side-list" id="hotList"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ CONTENT: Cards + Sidebar ══ */}
      <section className="content-sec">
        <div className="wrap">
          <div className="content-layout">
            {/* 卡片（左） */}
            <div>
              <div className="sec-title" data-i18n="sec_all_predictions">所有预测</div>
              {/* 筛选标签行：由 renderFilterTags() 动态注入（含调研数量） */}
              <div className="filter-row" id="filterRow" data-active=""></div>
              <div className="card-grid" id="cardGrid"></div>
              <div className="load-ind" id="loadInd"><div className="spinner"></div></div>
              <div className="load-ind" id="allDone" style={{ display: "none" }} data-i18n="all_loaded">— 所有预测已加载 —</div>
              <div id="sentinel" style={{ height: "1px" }}></div>
            </div>

            {/* 右侧栏 */}
            <div className="r-sidebar">
              {/* 活动横幅 */}
              <div className="act-banner">
                <div className="ab-glow"></div>
                <div className="ab-body">
                  <div className="ab-tag" data-i18n="banner_tag">限时活动</div>
                  <div className="ab-title" data-i18n="banner_title">2026 夏季公民挑战赛</div>
                  <div className="ab-desc" data-i18n="banner_desc">正确预测10项政策结果，赢取50万积分奖池份额。前3名获得专属平台徽章。</div>
                  <div className="ab-cta" data-i18n="banner_cta">
                    参加挑战 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                  </div>
                </div>
              </div>
              {/* 排行榜 */}
              <div className="lb-panel">
                <div className="lb-head">
                  <div className="lb-ttl" data-i18n="lb_title">Top 10 排行榜</div>
                  <div className="lb-mtabs">
                    <button className="lb-mtab active" data-metric="points" data-i18n="lb_points_gained">积分增长</button>
                    <button className="lb-mtab" data-metric="accuracy" data-i18n="lb_accuracy">准确率</button>
                  </div>
                  <div className="lb-tabs">
                    <button className="lb-tab active" data-period="day" data-i18n="lb_day">日</button>
                    <button className="lb-tab" data-period="week" data-i18n="lb_week">周</button>
                    <button className="lb-tab" data-period="month" data-i18n="lb_month">月</button>
                    <button className="lb-tab" data-period="year" data-i18n="lb_year">年</button>
                  </div>
                </div>
                <div className="lb-list" id="lbList"></div>
              </div>
              {/* 实时兑换 */}
              <div className="live-panel">
                <div className="live-head">
                  <span className="p-title" data-i18n="live_redemptions">实时兑换</span>
                  <span className="live-badge"><span className="live-dot"></span> <span data-i18n="live_label">实时</span></span>
                </div>
                <div className="live-list" id="liveList"></div>
              </div>
              {/* 地区分布 */}
              <div className="region-panel">
                <div className="region-head">
                  <div className="region-ttl" data-i18n="sec_region">参与调研的地区占比</div>
                </div>
                <div className="region-body" id="regionGrid"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer>
        <div className="wrap">
          <div className="f-grid">
            <div className="f-brand">
              <img src="/img/logo.png" alt="OraMarket" style={{ height: 36, width: "auto", display: "block", marginBottom: 8 }} />
              <p data-i18n="footer_desc">领先的中国预言机，专注政策结果、公众调查与社区预测。</p>
            </div>
            <div className="f-nav">
              <h4 data-i18n="footer_platform">平台</h4>
              <ul>
                <li><a href="#" data-i18n="footer_trending">热门预测</a></li>
                <li><a href="#" data-i18n="footer_public_services">公共服务</a></li>
                <li><a href="#" data-i18n="footer_policy_research">政策研究</a></li>
                <li><a href="#" data-i18n="footer_satisfaction">满意度调查</a></li>
                <li><a href="#" data-i18n="footer_education_survey">教育调查</a></li>
                <li><a href="#" data-i18n="footer_health">健康医疗</a></li>
                <li><a href="#" data-i18n="footer_leaderboard">排行榜</a></li>
              </ul>
            </div>
            <div className="f-nav">
              <h4 data-i18n="footer_support">支持</h4>
              <ul>
                <li><a href="#" data-i18n="footer_help">帮助中心</a></li>
                <li><a href="#" data-i18n="footer_guidelines">社区准则</a></li>
                <li><a href="#" data-i18n="footer_privacy">隐私政策</a></li>
                <li><a href="#" data-i18n="footer_terms">服务条款</a></li>
                <li><a href="#" data-i18n="footer_contact">联系我们</a></li>
                <li><a href="#" data-i18n="footer_api">API 文档</a></li>
              </ul>
            </div>
            <div className="f-soc">
              <h4 data-i18n="footer_connect">关注我们</h4>
              <div className="soc-icons">
                <div className="soc-ic" title="X / Twitter"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg></div>
                <div className="soc-ic" title="Telegram"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" /></svg></div>
                <div className="soc-ic" title="Discord"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.079.11 18.1.12 18.12a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" /></svg></div>
                <div className="soc-ic" title="LinkedIn"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg></div>
              </div>
              <h4 data-i18n="footer_language">语言</h4>
              <select className="lang-sel" id="langSelect" defaultValue="zh-CN">
                <option value="zh-CN">简体中文</option>
                <option value="zh-TW">繁體中文</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
          <div className="f-bottom">
            <span data-i18n="footer_copyright">© 2026 OraMarket. 保留所有权利。</span>
            <span data-i18n="footer_powered">由民意数据与社区智慧驱动</span>
          </div>
        </div>
      </footer>
    </>
  );
}
