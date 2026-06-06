"use client";

// 积分兑换页 —— 将积分余额兑换为虚拟卡权益（打车券 / 话费 / 购物卡 / 视频会员等）
// 主体：可兑换权益列表 + 分类筛选；右侧：兑换统计 + 其它用户实时兑换；底部：最新兑换记录表
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { HeaderActions } from "@/components/layouts/header-actions";
import { Logo } from "@/components/layouts/site-logo";
import { HeaderSearch } from "@/components/layouts/header-search";
import { AV_COLORS, R_NAMES, fmt, pick } from "@/lib/data/home";

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

// ── 分类 ──
const CATEGORIES: { key: string; label: string }[] = [
  { key: "all",      label: "全部权益" },
  { key: "travel",   label: "出行" },
  { key: "telecom",  label: "话费充值" },
  { key: "shopping", label: "购物卡" },
  { key: "food",     label: "餐饮美食" },
  { key: "video",    label: "视频会员" },
  { key: "fuel",     label: "加油" },
];

// ── 可兑换权益目录 ──
interface RedeemProduct {
  id: number;
  brand: string;     // 品牌
  badge: string;     // 角标文字（1 字）
  color: string;     // 品牌主色
  category: string;  // 分类 key
  name: string;      // 权益名称
  face: string;      // 面值展示
  cost: number;      // 消耗积分
  stockPct: number;  // 剩余库存百分比
  redeemed: number;  // 已兑换人数
  hot?: boolean;     // 热门标记
}

const PRODUCTS: RedeemProduct[] = [
  { id: 1,  brand: "滴滴出行", badge: "滴", color: "#FF6435", category: "travel",   name: "打车券 ¥20",      face: "¥20",  cost: 2000,  stockPct: 62, redeemed: 8421, hot: true },
  { id: 2,  brand: "滴滴出行", badge: "滴", color: "#FF6435", category: "travel",   name: "打车券 ¥50",      face: "¥50",  cost: 5000,  stockPct: 41, redeemed: 3927 },
  { id: 3,  brand: "中国移动", badge: "移", color: "#1E50A2", category: "telecom",  name: "话费充值 ¥30",    face: "¥30",  cost: 3000,  stockPct: 78, redeemed: 12640, hot: true },
  { id: 4,  brand: "中国移动", badge: "移", color: "#1E50A2", category: "telecom",  name: "话费充值 ¥100",   face: "¥100", cost: 10000, stockPct: 33, redeemed: 5218 },
  { id: 5,  brand: "中国联通", badge: "联", color: "#E60012", category: "telecom",  name: "话费充值 ¥50",    face: "¥50",  cost: 5000,  stockPct: 56, redeemed: 4103 },
  { id: 6,  brand: "中国电信", badge: "电", color: "#009FE3", category: "telecom",  name: "话费充值 ¥50",    face: "¥50",  cost: 5000,  stockPct: 49, redeemed: 3611 },
  { id: 7,  brand: "京东",     badge: "京", color: "#E1251B", category: "shopping", name: "京东 E 卡 ¥100",  face: "¥100", cost: 10000, stockPct: 28, redeemed: 6740, hot: true },
  { id: 8,  brand: "京东",     badge: "京", color: "#E1251B", category: "shopping", name: "京东 E 卡 ¥50",   face: "¥50",  cost: 5000,  stockPct: 44, redeemed: 5102 },
  { id: 9,  brand: "天猫超市", badge: "猫", color: "#FF0036", category: "shopping", name: "天猫超市卡 ¥100", face: "¥100", cost: 10000, stockPct: 37, redeemed: 2988 },
  { id: 10, brand: "星巴克",   badge: "星", color: "#00704A", category: "food",     name: "中杯饮品券",      face: "¥45",  cost: 4500,  stockPct: 52, redeemed: 4470, hot: true },
  { id: 11, brand: "瑞幸咖啡", badge: "瑞", color: "#0A4DA1", category: "food",     name: "美式咖啡券",      face: "¥18",  cost: 1800,  stockPct: 71, redeemed: 9355 },
  { id: 12, brand: "麦当劳",   badge: "麦", color: "#FFC72C", category: "food",     name: "随心配套餐券",    face: "¥40",  cost: 4000,  stockPct: 47, redeemed: 5680 },
  { id: 13, brand: "爱奇艺",   badge: "爱", color: "#00BE06", category: "video",    name: "黄金会员月卡",    face: "月卡", cost: 2500,  stockPct: 60, redeemed: 7120 },
  { id: 14, brand: "腾讯视频", badge: "腾", color: "#FF7200", category: "video",    name: "VIP 会员月卡",    face: "月卡", cost: 2500,  stockPct: 58, redeemed: 6890 },
  { id: 15, brand: "哔哩哔哩", badge: "B", color: "#FB7299", category: "video",    name: "大会员月卡",      face: "月卡", cost: 2800,  stockPct: 64, redeemed: 5430 },
  { id: 16, brand: "中国石化", badge: "油", color: "#E60012", category: "fuel",     name: "加油充值卡 ¥100", face: "¥100", cost: 10000, stockPct: 22, redeemed: 1840 },
];

// 分类标签（用于记录表展示）
const CAT_LABEL: Record<string, string> = {
  travel: "出行", telecom: "话费", shopping: "购物卡", food: "餐饮", video: "视频会员", fuel: "加油",
};

// ── 实时兑换 / 兑换记录 数据结构 ──
interface FeedItem {
  name: string; color: string; brand: string; badge: string; face: string; cost: number; time: string;
}

// 确定性初始兑换流（SSR/CSR 一致），后续在 useEffect 内继续推送
function buildFeed(n: number): FeedItem[] {
  return Array.from({ length: n }, (_, i) => {
    const name = R_NAMES[hash(i * 13 + 1, R_NAMES.length)];
    const p = PRODUCTS[hash(i * 7 + 3, PRODUCTS.length)];
    const color = AV_COLORS[hash(i * 5 + 2, AV_COLORS.length)];
    const mins = i === 0 ? 0 : i * 2 + hash(i * 11, 3);
    return { name, color, brand: p.brand, badge: p.badge, face: p.face, cost: p.cost, time: mins === 0 ? "刚刚" : `${mins} 分钟前` };
  });
}
const INITIAL_FEED = buildFeed(8);

// 底部兑换记录（确定性 12 条）
interface RecordItem {
  name: string; color: string; brand: string; badge: string; bColor: string; face: string; category: string; cost: number; time: string; status: "done" | "pending";
}
const RECORDS: RecordItem[] = Array.from({ length: 12 }, (_, i) => {
  const name = R_NAMES[hash(i * 17 + 5, R_NAMES.length)];
  const p = PRODUCTS[hash(i * 9 + 2, PRODUCTS.length)];
  const color = AV_COLORS[hash(i * 3 + 7, AV_COLORS.length)];
  const minsAgo = (i + 1) * 7 + hash(i * 23, 6);
  const time = minsAgo < 60 ? `${minsAgo} 分钟前` : `${Math.floor(minsAgo / 60)} 小时前`;
  return { name, color, brand: p.brand, badge: p.badge, bColor: p.color, face: p.face, category: p.category, cost: p.cost, time, status: i < 9 ? "done" : "pending" };
});

export function RedeemPage() {
  const { user, points } = useAuth();
  const router = useRouter();

  const [cat, setCat] = useState("all");
  const [feed, setFeed] = useState<FeedItem[]>(INITIAL_FEED);
  const [target, setTarget] = useState<RedeemProduct | null>(null);
  const [done, setDone] = useState(false);

  // 实时兑换流：挂载后每 ~3.5s 推送一条（客户端随机，不影响 SSR 水合）
  useEffect(() => {
    if (!user) return;
    const timer = setInterval(() => {
      const p = pick(PRODUCTS);
      const item: FeedItem = {
        name: pick(R_NAMES), color: pick(AV_COLORS), brand: p.brand, badge: p.badge, face: p.face, cost: p.cost, time: "刚刚",
      };
      setFeed((prev) => [item, ...prev.map((it) => (it.time === "刚刚" ? { ...it, time: "片刻前" } : it))].slice(0, 8));
    }, 3500);
    return () => clearInterval(timer);
  }, [user]);

  // 打开兑换弹窗
  function openRedeem(p: RedeemProduct) {
    setTarget(p);
    setDone(false);
  }
  function closeRedeem() {
    setTarget(null);
    setDone(false);
  }

  const shown = cat === "all" ? PRODUCTS : PRODUCTS.filter((p) => p.category === cat);

  // 模拟卡密（确定性）
  const cardCode = target
    ? `${1000 + hash(target.id * 31, 9000)}-${1000 + hash(target.id * 53, 9000)}-${1000 + hash(target.id * 97, 9000)}`
    : "";

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
            <svg viewBox="0 0 24 24"><path d="M17.66 11.2c-.23-.3-.51-.56-.77-.82-.67-.6-1.43-1.03-2.07-1.66C13.33 7.26 13 4.85 13.95 3c-.95.23-1.78.75-2.49 1.32-2.59 2.04-3.49 5.56-2.46 8.73.04.14.08.27.08.42 0 .28-.18.52-.46.62-.27.1-.56.01-.74-.21a5.27 5.27 0 01-.88-2.31c-1.12 1.52-1.68 3.48-1.49 5.47.12 1.22.57 2.41 1.29 3.39.81 1.08 1.91 1.87 3.17 2.27 1.41.44 2.97.41 4.37-.06 1.6-.54 2.94-1.69 3.67-3.21.78-1.61.87-3.51.18-5.19-.23-.57-.56-1.09-.97-1.55z" /></svg>
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
          <div style={{ fontSize: 16, color: "var(--text2)", marginBottom: 8 }}>请先登录后兑换积分权益</div>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>点击右上角「登录」即可使用。</div>
        </div>
      ) : (
        <div className="wrap" style={{ padding: "20px 24px 40px" }}>

          {/* ── 顶部横幅：标题 + 积分余额 ── */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 18,
            background: "linear-gradient(120deg, var(--blue-d), var(--blue))", borderRadius: 14, padding: "22px 26px",
            color: "#fff", marginBottom: 18,
          }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, letterSpacing: ".5px" }}>积分兑换</h1>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,.8)", margin: "6px 0 0" }}>
                用预测赢得的积分，兑换打车券、话费、购物卡、视频会员等虚拟权益。
              </p>
            </div>
            <div style={{
              display: "flex", alignItems: "center", gap: 22,
              background: "rgba(255,255,255,.1)", borderRadius: 12, padding: "12px 22px",
            }}>
              <div>
                <div style={{ fontSize: 11.5, color: "rgba(255,255,255,.7)", marginBottom: 4 }}>当前积分余额</div>
                <div style={{ fontFamily: "var(--font-fira-code),monospace", fontSize: 30, fontWeight: 700, color: "#FCD34D", lineHeight: 1 }}>
                  {fmt(points)}<span style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,.7)", marginLeft: 6 }}>积分</span>
                </div>
              </div>
              <button
                onClick={() => router.push("/portfolio")}
                style={{
                  background: "#fff", color: "var(--blue-d)", border: "none", borderRadius: 8,
                  padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
                }}
              >
                赚取更多积分 ›
              </button>
            </div>
          </div>

          {/* ── 分类筛选 ── */}
          <div className="filter-row" style={{ marginBottom: 18 }}>
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                className={`f-tag${cat === c.key ? " active" : ""}`}
                onClick={() => setCat(c.key)}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* ── 主体：权益列表 | 右侧栏 ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 18, alignItems: "start" }}>

            {/* 左：权益网格 + 兑换记录 */}
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(218px, 1fr))", gap: 14 }}>
                {shown.map((p) => (
                  <ProductCard key={p.id} p={p} afford={points >= p.cost} onRedeem={() => openRedeem(p)} />
                ))}
              </div>

              {/* 其它用户兑换记录 */}
              <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden", marginTop: 22 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 18px", borderBottom: "1px solid var(--border)" }}>
                  <div className="sec-title" style={{ marginBottom: 0, fontSize: 16 }}>最新兑换记录</div>
                  <span style={{ fontSize: 12, color: "var(--muted)" }}>来自全站用户的兑换动态</span>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: "#f5f5f5", color: "var(--text2)", fontSize: 11.5, textAlign: "left" }}>
                        <th style={thStyle}>用户</th>
                        <th style={thStyle}>兑换权益</th>
                        <th style={thStyle}>类别</th>
                        <th style={{ ...thStyle, textAlign: "right" }}>消耗积分</th>
                        <th style={{ ...thStyle, textAlign: "right" }}>时间</th>
                        <th style={{ ...thStyle, textAlign: "right" }}>状态</th>
                      </tr>
                    </thead>
                    <tbody>
                      {RECORDS.map((r, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                          <td style={tdStyle}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ width: 24, height: 24, borderRadius: "50%", background: r.color, color: "#fff", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{r.name[0]}</span>
                              <span style={{ color: "var(--text)", fontWeight: 500 }}>{maskName(r.name)}</span>
                            </div>
                          </td>
                          <td style={tdStyle}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ width: 22, height: 22, borderRadius: 6, background: r.bColor, color: "#fff", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{r.badge}</span>
                              <span style={{ color: "var(--blue-d)", fontWeight: 600 }}>{r.brand} {r.face}</span>
                            </div>
                          </td>
                          <td style={{ ...tdStyle, color: "var(--text2)" }}>{CAT_LABEL[r.category]}</td>
                          <td style={{ ...tdStyle, textAlign: "right", fontFamily: "var(--font-fira-code),monospace", color: "var(--text2)" }}>-{fmt(r.cost)}</td>
                          <td style={{ ...tdStyle, textAlign: "right", color: "var(--muted)", whiteSpace: "nowrap" }}>{r.time}</td>
                          <td style={{ ...tdStyle, textAlign: "right" }}>
                            <span style={{
                              fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 6, whiteSpace: "nowrap",
                              color: r.status === "done" ? "var(--green)" : "var(--amber)",
                              background: r.status === "done" ? "rgba(22,163,74,.1)" : "rgba(217,119,6,.12)",
                            }}>
                              {r.status === "done" ? "已发放" : "处理中"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 右：兑换统计 + 实时兑换 + 兑换须知 */}
            <div style={{ position: "sticky", top: 80, display: "flex", flexDirection: "column", gap: 18 }}>

              {/* 兑换统计 */}
              <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 16px" }}>
                <div className="sec-title" style={{ marginBottom: 12 }}>今日兑换概览</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                  {[
                    { label: "今日兑换", val: "3,284", unit: "笔", color: "var(--blue-d)" },
                    { label: "发放积分", val: "1,260", unit: "万", color: "var(--red)" },
                    { label: "在兑权益", val: String(PRODUCTS.length), unit: "款", color: "var(--green)" },
                  ].map((it) => (
                    <div key={it.label} style={{ background: "var(--bg)", borderRadius: 8, padding: "10px 8px", textAlign: "center" }}>
                      <div style={{ fontFamily: "var(--font-fira-code),monospace", fontSize: 17, fontWeight: 700, color: it.color, lineHeight: 1 }}>{it.val}</div>
                      <div style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 4 }}>{it.unit} · {it.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 实时兑换流 */}
              <div className="live-panel">
                <div className="live-head">
                  <span className="p-title">实时兑换</span>
                  <span className="live-badge"><span className="live-dot" /> 实时</span>
                </div>
                <div className="live-list">
                  {feed.map((it, i) => (
                    <div key={`${it.name}-${i}-${it.time}`} className="live-item">
                      <div className="li-av" style={{ background: it.color }}>{it.name[0]}</div>
                      <div className="li-body">
                        <div className="li-top"><span className="li-name">{maskName(it.name)}</span><span className="li-time">{it.time}</span></div>
                        <div className="li-act">兑换了 <b>{it.brand} {it.face}</b> · <span className="li-pts">{fmt(it.cost)} 积分</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 兑换须知 */}
              <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 16px" }}>
                <div className="sec-title" style={{ marginBottom: 10 }}>兑换须知</div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "var(--text2)", lineHeight: 1.9 }}>
                  <li>兑换成功后积分立即扣除，权益于 24 小时内发放。</li>
                  <li>虚拟卡券一经兑换不支持退换，请确认后操作。</li>
                  <li>卡密信息可在「我的兑换记录」中随时查看。</li>
                  <li>每个账号每日兑换上限为 5 笔。</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 兑换确认弹窗 ── */}
      {target && (
        <div
          onClick={closeRedeem}
          style={{ position: "fixed", inset: 0, zIndex: 2000, background: "rgba(15,23,42,.55)", backdropFilter: "blur(2px)", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ width: 380, background: "var(--card)", borderRadius: 16, padding: "26px 26px 22px", position: "relative", boxShadow: "0 24px 60px rgba(0,0,0,.3)" }}>
            {/* 关闭 */}
            <button onClick={closeRedeem} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 4 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>

            {!done ? (
              <>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--blue-d)", margin: "0 0 18px" }}>确认兑换</h2>
                {/* 权益概览 */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "var(--bg)", borderRadius: 10, marginBottom: 16 }}>
                  <span style={{ width: 44, height: 44, borderRadius: 10, background: target.color, color: "#fff", fontSize: 20, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{target.badge}</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--blue-d)" }}>{target.brand}</div>
                    <div style={{ fontSize: 12.5, color: "var(--text2)" }}>{target.name}</div>
                  </div>
                </div>
                {/* 积分明细 */}
                <div style={{ fontSize: 13, color: "var(--text2)" }}>
                  <Row label="消耗积分" val={`-${fmt(target.cost)} 积分`} valColor="var(--red)" />
                  <Row label="当前余额" val={`${fmt(points)} 积分`} />
                  <Row label="兑换后余额" val={`${fmt(Math.max(points - target.cost, 0))} 积分`} valColor={points >= target.cost ? "var(--blue-d)" : "var(--red)"} bold />
                </div>
                {points < target.cost && (
                  <div style={{ marginTop: 12, fontSize: 12, color: "var(--red)", background: "rgba(220,38,38,.08)", borderRadius: 8, padding: "8px 12px" }}>
                    积分余额不足，去预测赢取更多积分吧。
                  </div>
                )}
                {/* 按钮 */}
                <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                  <button onClick={closeRedeem} style={{ flex: 1, padding: "11px 0", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--text2)", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>取消</button>
                  <button
                    disabled={points < target.cost}
                    onClick={() => setDone(true)}
                    style={{
                      flex: 2, padding: "11px 0", borderRadius: 8, border: "none", fontSize: 14, fontWeight: 700, fontFamily: "inherit", letterSpacing: ".3px",
                      background: points < target.cost ? "var(--border)" : "var(--blue)",
                      color: points < target.cost ? "var(--muted)" : "#fff",
                      cursor: points < target.cost ? "not-allowed" : "pointer",
                    }}
                  >
                    确认兑换
                  </button>
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "8px 0 4px" }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(22,163,74,.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--blue-d)", margin: "0 0 6px" }}>兑换成功</h2>
                <p style={{ fontSize: 12.5, color: "var(--text2)", margin: "0 0 16px", lineHeight: 1.6 }}>
                  {target.brand} {target.name} 已兑换<br />权益将于 24 小时内发放至您的账户。
                </p>
                <div style={{ background: "var(--bg)", borderRadius: 10, padding: "12px 14px", marginBottom: 18 }}>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>卡密 / 兑换码</div>
                  <div style={{ fontFamily: "var(--font-fira-code),monospace", fontSize: 16, fontWeight: 700, color: "var(--blue-d)", letterSpacing: "1px" }}>{cardCode}</div>
                </div>
                <button onClick={closeRedeem} style={{ width: "100%", padding: "11px 0", borderRadius: 8, border: "none", background: "var(--blue)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>完成</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── 权益卡片 ──
function ProductCard({ p, afford, onRedeem }: { p: RedeemProduct; afford: boolean; onRedeem: () => void }) {
  return (
    <div
      style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 14px 12px", display: "flex", flexDirection: "column", transition: ".15s", position: "relative", overflow: "hidden" }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 8px 22px rgba(15,23,42,.1)"; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = p.color; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; e.currentTarget.style.borderColor = "var(--border)"; }}
    >
      {/* 热门角标 */}
      {p.hot && (
        <span style={{ position: "absolute", top: 0, right: 0, background: "var(--red)", color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: "0 12px 0 10px" }}>热门</span>
      )}
      {/* 品牌 + 类别 */}
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
        <span style={{ width: 38, height: 38, borderRadius: 9, background: p.color, color: "#fff", fontSize: 18, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{p.badge}</span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--blue-d)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.brand}</div>
          <div style={{ fontSize: 11, color: "var(--muted)" }}>{CAT_LABEL[p.category]}</div>
        </div>
      </div>

      {/* 权益名称 + 面值 */}
      <div style={{ fontSize: 12.5, color: "var(--text2)", marginBottom: 4 }}>{p.name}</div>
      <div style={{ fontFamily: "var(--font-fira-code),monospace", fontSize: 24, fontWeight: 700, color: p.color, lineHeight: 1, marginBottom: 12 }}>{p.face}</div>

      {/* 库存 + 已兑换 */}
      <div style={{ height: 5, borderRadius: 3, background: "#E2E8F0", overflow: "hidden", marginBottom: 5 }}>
        <div style={{ width: `${p.stockPct}%`, height: "100%", background: p.stockPct < 30 ? "var(--red)" : "var(--green)" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: "var(--muted)", marginBottom: 12 }}>
        <span>剩余 {p.stockPct}%</span>
        <span>{fmt(p.redeemed)} 人已兑换</span>
      </div>

      {/* 积分 + 兑换按钮 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: "auto" }}>
        <div style={{ fontFamily: "var(--font-fira-code),monospace", fontSize: 15, fontWeight: 700, color: "var(--blue-d)" }}>
          {fmt(p.cost)}<span style={{ fontSize: 10.5, fontWeight: 500, color: "var(--muted)", marginLeft: 3 }}>积分</span>
        </div>
        <button
          onClick={onRedeem}
          style={{
            padding: "7px 16px", borderRadius: 7, border: "none", fontSize: 12.5, fontWeight: 700, fontFamily: "inherit",
            background: afford ? "var(--blue)" : "var(--bg)",
            color: afford ? "#fff" : "var(--muted)",
            cursor: "pointer", whiteSpace: "nowrap",
          }}
        >
          {afford ? "兑换" : "积分不足"}
        </button>
      </div>
    </div>
  );
}

// 弹窗明细行
function Row({ label, val, valColor, bold }: { label: string; val: string; valColor?: string; bold?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderTop: "1px solid var(--border)" }}>
      <span>{label}</span>
      <span style={{ fontFamily: "var(--font-fira-code),monospace", fontWeight: bold ? 700 : 600, color: valColor || "var(--text)" }}>{val}</span>
    </div>
  );
}

// 昵称脱敏：保留首字，其余以 * 替代（保护隐私，符合「其它用户」展示）
function maskName(name: string): string {
  if (name.length <= 1) return name;
  return name[0] + "*".repeat(Math.min(name.length - 1, 2));
}

const thStyle: React.CSSProperties = { padding: "9px 16px", fontWeight: 600 };
const tdStyle: React.CSSProperties = { padding: "10px 16px" };
