"use client";

// 积分记录页 —— 账户积分流水：入分 / 答对了 / 答错了 / 积分兑换
// 余额由最新一条向前回推，最新一条结余 = 当前积分余额，保证与全站一致
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { useLanguage } from "@/components/providers/language-provider";
import { HeaderActions } from "@/components/layouts/header-actions";
import { Logo } from "@/components/layouts/site-logo";
import { HeaderSearch } from "@/components/layouts/header-search";
import { TITLES_I18N } from "@/lib/i18n/dict";
import { fmt } from "@/lib/data/home";

const NAV_ITEMS = [
  { label: "公共服务",   slug: "public-services" },
  { label: "政策研究",   slug: "policy-research" },
  { label: "满意度调查", slug: "satisfaction-survey" },
  { label: "教育",       slug: "education" },
  { label: "健康医疗",   slug: "health-medical" },
  { label: "商业调查",   slug: "business-survey" },
  { label: "个人/企业",  slug: "personal-enterprise" },
];

// 确定性哈希（SSR/CSR 一致）
const hash = (n: number, mod: number) => ((n * 2654435761) >>> 0) % mod;

// ── 流水类型 ──
type TxType = "credit" | "win" | "lose" | "redeem";

const TYPE_META: Record<TxType, { label: string; color: string }> = {
  credit: { label: "入分",     color: "var(--green)" },
  win:    { label: "答对了", color: "var(--blue)" },
  lose:   { label: "答错了", color: "var(--red)" },
  redeem: { label: "积分兑换", color: "var(--amber)" },
};

const FILTERS: { key: "all" | TxType; label: string }[] = [
  { key: "all",    label: "全部" },
  { key: "credit", label: "入分" },
  { key: "win",    label: "答对了" },
  { key: "lose",   label: "答错了" },
  { key: "redeem", label: "积分兑换" },
];

// 入分事由 / 兑换权益（用于流水描述）
const CREDIT_REASONS = ["新用户注册奖励", "每日签到奖励", "邀请好友奖励", "限时活动空投", "连续登录奖励", "客服补偿积分"];
const REDEEM_ITEMS = ["滴滴出行 ¥20", "中国移动 ¥30", "京东 E 卡 ¥100", "星巴克中杯券", "瑞幸美式券", "爱奇艺月卡", "腾讯视频月卡", "中国电信 ¥50"];

interface Tx {
  id: number;
  type: TxType;
  detail: string;  // 描述（调研标题 / 权益 / 事由）
  delta: number;   // 带符号积分变动
  balance: number; // 该笔后的结余
  time: string;    // "YYYY-MM-DD HH:mm"
}

// 生成积分流水（确定性）：最新一条结余 = 当前余额，逐条向前回推
function buildTxns(points: number, titles: string[], n = 26): Tx[] {
  const list: Tx[] = [];
  const baseMs = Date.parse("2026-06-06T16:40:00Z");
  let cum = 0;     // 较新各笔变动之和（newest..i-1）
  let cumMin = 0;  // 距基准时间的累计分钟
  for (let i = 0; i < n; i++) {
    const balance = points - cum; // 第 i 笔之后的结余
    const mag = 60 + hash(i * 7 + 1, 941); // 60 ~ 1000
    // 选符号：使各笔结余维持在 [3000,7000] 区间（避免出现负余额）
    let positive: boolean;
    if (cum + mag > 2000) positive = false;
    else if (cum - mag < -2000) positive = true;
    else positive = hash(i * 13 + 5, 2) === 0;
    const delta = positive ? mag : -mag;
    cum += delta;

    let type: TxType;
    let detail: string;
    if (positive) {
      if (hash(i * 17 + 3, 3) === 0) { type = "credit"; detail = CREDIT_REASONS[hash(i * 19 + 2, CREDIT_REASONS.length)]; }
      else { type = "win"; detail = titles[hash(i * 23 + 4, titles.length)]; }
    } else {
      if (hash(i * 29 + 6, 5) === 0) { type = "redeem"; detail = REDEEM_ITEMS[hash(i * 31 + 1, REDEEM_ITEMS.length)]; }
      else { type = "lose"; detail = titles[hash(i * 37 + 2, titles.length)]; }
    }

    cumMin += 35 + hash(i * 41 + 7, 565); // 每笔较前一笔再早 35 ~ 600 分钟
    const time = new Date(baseMs - cumMin * 60000).toISOString().slice(0, 16).replace("T", " ");
    list.push({ id: i, type, detail, delta, balance, time });
  }
  return list;
}

export function PointsPage() {
  const { user, points } = useAuth();
  const { lang } = useLanguage();
  const router = useRouter();

  const titles = TITLES_I18N[lang as keyof typeof TITLES_I18N] || TITLES_I18N["zh-CN"];
  const [filter, setFilter] = useState<"all" | TxType>("all");

  const txns = useMemo(() => buildTxns(points, titles), [points, titles]);

  // 汇总统计
  const sums = useMemo(() => {
    const s = { win: 0, credit: 0, lose: 0, redeem: 0 };
    for (const t of txns) {
      if (t.type === "win") s.win += t.delta;
      else if (t.type === "credit") s.credit += t.delta;
      else if (t.type === "lose") s.lose += -t.delta;
      else s.redeem += -t.delta;
    }
    return s;
  }, [txns]);

  const shown = filter === "all" ? txns : txns.filter((t) => t.type === filter);

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
          <div style={{ fontSize: 16, color: "var(--text2)", marginBottom: 8 }}>请先登录后查看积分记录</div>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>点击右上角「登录」即可使用。</div>
        </div>
      ) : (
        <div className="wrap" style={{ padding: "20px 24px 40px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 18, flexWrap: "wrap" }}>

          {/* 汇总卡片：余额 + 四类统计（左） */}
          <div style={{
            background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14,
            padding: "20px 24px",
            flex: "0 0 300px", minWidth: 260, boxSizing: "border-box",
          }}>
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 6 }}>积分余额</div>
              <div style={{ fontFamily: "var(--font-fira-code),monospace", fontSize: 36, fontWeight: 700, color: "var(--amber)", lineHeight: 1 }}>
                {fmt(points)}<span style={{ fontSize: 15, fontWeight: 500, color: "var(--muted)", marginLeft: 8 }}>积分</span>
              </div>
            </div>
            <div style={{ display: "grid", gap: 13, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
              {[
                { label: "累计赢得", val: sums.win,    sign: "+", color: "var(--green)" },
                { label: "累计入分", val: sums.credit, sign: "+", color: "var(--green)" },
                { label: "累计输掉", val: sums.lose,   sign: "-", color: "var(--red)" },
                { label: "累计兑换", val: sums.redeem, sign: "-", color: "var(--red)" },
              ].map((it) => (
                <div key={it.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ fontSize: 12.5, color: "var(--muted)" }}>{it.label}</div>
                  <div style={{ fontFamily: "var(--font-fira-code),monospace", fontSize: 18, fontWeight: 700, color: it.color }}>
                    {it.sign}{fmt(it.val)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 记录卡片（右） */}
          <div style={{ flex: "1 1 480px", minWidth: 0, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
            {/* 标题 + 筛选 */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, padding: "14px 18px" }}>
              <div className="sec-title" style={{ marginBottom: 0, fontSize: 18 }}>积分记录</div>
              <div className="filter-row" style={{ margin: 0, paddingBottom: 0, borderBottom: "none" }}>
                {FILTERS.map((f) => (
                  <button key={f.key} className={`f-tag${filter === f.key ? " active" : ""}`} onClick={() => setFilter(f.key)}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 流水列表 */}
            <div>
              {shown.length === 0 ? (
                <div style={{ padding: "48px 20px", textAlign: "center", color: "var(--muted)", fontSize: 13 }}>暂无此类积分记录</div>
              ) : shown.map((t) => {
                const meta = TYPE_META[t.type];
                const pos = t.delta > 0;
                return (
                  <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 18px", borderBottom: "1px solid var(--border)" }}>
                    {/* 类型图标 */}
                    <span style={{
                      width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: tint(meta.color), color: meta.color,
                    }}>
                      <TxIcon type={t.type} />
                    </span>
                    {/* 描述 + 类型·时间 */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--blue-d)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {t.detail}
                      </div>
                      <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>
                        <span style={{ color: meta.color, fontWeight: 600 }}>{meta.label}</span>
                        <span style={{ margin: "0 6px" }}>·</span>
                        {t.time}
                      </div>
                    </div>
                    {/* 变动 + 结余 */}
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontFamily: "var(--font-fira-code),monospace", fontSize: 15, fontWeight: 700, color: pos ? "var(--green)" : "var(--red)" }}>
                        {pos ? "+" : "-"}{fmt(Math.abs(t.delta))}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>余额 {fmt(t.balance)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 颜色淡化为图标底色（基于 CSS 变量映射到对应浅色）
function tint(color: string): string {
  switch (color) {
    case "var(--green)": return "rgba(22,163,74,.12)";
    case "var(--blue)":  return "rgba(37,99,235,.12)";
    case "var(--red)":   return "rgba(220,38,38,.12)";
    case "var(--amber)": return "rgba(217,119,6,.13)";
    default:             return "rgba(100,116,139,.12)";
  }
}

// 类型图标
function TxIcon({ type }: { type: TxType }) {
  const common = { width: 17, height: 17, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2 } as const;
  if (type === "credit") return <svg {...common}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;
  if (type === "win") return <svg {...common}><path d="M6 9H4.5a2.5 2.5 0 010-5H6" /><path d="M18 9h1.5a2.5 2.5 0 000-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0012 0V2z" /></svg>;
  if (type === "lose") return <svg {...common}><polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" /></svg>;
  // redeem
  return <svg {...common}><polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" /><line x1="12" y1="22" x2="12" y2="7" /><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" /></svg>;
}
