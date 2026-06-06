"use client";

// 关注的调研页 —— 左侧关注列表（样式同调研组合页的关注列表，右键可取消关注）；右侧拼入完整调研详情主体
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { useLanguage } from "@/components/providers/language-provider";
import { HeaderActions } from "@/components/layouts/header-actions";
import { Logo } from "@/components/layouts/site-logo";
import { HeaderSearch } from "@/components/layouts/header-search";
import { UnfollowMenu, ctxMenuFrom, type CtxMenuState } from "@/components/layouts/unfollow-menu";
import { SurveyDetailBody, buildSurveyData } from "@/components/features/survey/survey-detail-body";

const NAV_ITEMS = [
  { label: "公共服务",   slug: "public-services" },
  { label: "政策研究",   slug: "policy-research" },
  { label: "满意度调查", slug: "satisfaction-survey" },
  { label: "教育",       slug: "education" },
  { label: "健康医疗",   slug: "health-medical" },
  { label: "商业调查",   slug: "business-survey" },
  { label: "个人/企业",  slug: "personal-enterprise" },
];

// 默认关注的调研 id 列表（确定性，配合 buildSurveyData 生成详情）
const DEFAULT_FOLLOW_IDS = [3, 8, 12, 19, 27, 34, 41, 53, 66, 78, 91, 105, 118, 132];

export function FollowsPage({ from }: { from?: string }) {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const router = useRouter();
  const lng = lang as "zh-CN" | "zh-TW" | "en";

  // 返回目标：来自调研组合则回调研组合，否则（下拉菜单等）回首页
  const backTo = from === "portfolio" ? "/portfolio" : "/";

  const [followIds, setFollowIds] = useState<number[]>(DEFAULT_FOLLOW_IDS);
  const [selectedId, setSelectedId] = useState<number>(DEFAULT_FOLLOW_IDS[0]);
  const [ctxMenu, setCtxMenu] = useState<CtxMenuState | null>(null);

  // 取消关注：从列表移除；若移除的是当前选中项，则切换到剩余的第一项
  function unfollow(id: number) {
    setFollowIds((prev) => {
      const next = prev.filter((x) => x !== id);
      if (id === selectedId) setSelectedId(next[0] ?? -1);
      return next;
    });
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
          <div style={{ fontSize: 16, color: "var(--text2)", marginBottom: 8 }}>请先登录后查看关注的调研</div>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>点击右上角「登录」即可使用。</div>
        </div>
      ) : (
        <div className="wrap" style={{ padding: "16px 24px 40px" }}>

          {/* 返回 —— 回到来源页（调研组合 / 首页） */}
          <button
            onClick={() => router.push(backTo)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              background: "var(--card)", border: "1px solid var(--border)",
              color: "var(--text2)", fontSize: 12.5, cursor: "pointer",
              fontFamily: "inherit", fontWeight: 500,
              padding: "6px 12px", borderRadius: 6, marginBottom: 16,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            返回
          </button>

          {/* 两栏：左关注列表（全高） | 右调研详情 */}
          <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 18, alignItems: "start" }}>

            {/* 左：关注的调研列表（样式同调研组合页侧栏；右键取消关注） */}
            <div className="s-panel" style={{ position: "sticky", top: 80, height: "calc(100vh - 100px)", display: "flex", flexDirection: "column" }}>
              <div className="p-head">
                <span className="p-title">关注的调研</span>
                <span style={{ color: "rgba(255,255,255,.85)", fontSize: 11.5, fontWeight: 600 }}>
                  共 {followIds.length} 个
                </span>
              </div>
              <div style={{ flex: 1, overflowY: "auto" }}>
                {followIds.length === 0 ? (
                  <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
                    暂无关注的调研<br />
                    <button
                      onClick={() => router.push("/")}
                      style={{ marginTop: 12, background: "var(--blue)", border: "none", color: "#fff", fontSize: 12.5, fontWeight: 600, padding: "7px 16px", borderRadius: 7, cursor: "pointer", fontFamily: "inherit" }}
                    >
                      去发现调研
                    </button>
                  </div>
                ) : (
                  followIds.map((id) => {
                    const s = buildSurveyData(id, lng);
                    const isSel = id === selectedId;
                    return (
                      <div
                        key={id}
                        className="side-survey"
                        onClick={() => setSelectedId(id)}
                        onContextMenu={(e) => { e.preventDefault(); setCtxMenu(ctxMenuFrom(e, id)); }}
                        style={{ background: isSel ? "rgba(37,99,235,.13)" : undefined, borderBottomColor: "var(--border)" }}
                      >
                        <div className="side-ttl">{s.title}</div>
                        <div className="side-opts">
                          <div className="s-opt y"><span className="so-lbl">YES</span><span className="so-pct">{s.yesPct}%</span><span className="so-odds">{s.yesOdds}x</span></div>
                          <div className="s-opt n"><span className="so-lbl">NO</span><span className="so-pct">{s.noPct}%</span><span className="so-odds">{s.noOdds}x</span></div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* 右：调研详情主体（拼入完整详情页内容） */}
            <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: "18px 20px" }}>
              {selectedId >= 0 ? (
                <SurveyDetailBody key={selectedId} id={selectedId} betColWidth={300} />
              ) : (
                <div style={{ padding: "80px 24px", textAlign: "center", color: "var(--muted)", fontSize: 14 }}>
                  请选择左侧关注的调研查看详情
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 右键菜单：取消关注 */}
      <UnfollowMenu state={ctxMenu} onUnfollow={unfollow} onClose={() => setCtxMenu(null)} />
    </div>
  );
}
