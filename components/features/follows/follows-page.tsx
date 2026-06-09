"use client";

// 关注的调研页 —— 左侧关注列表（样式同调研组合页的关注列表，右键可取消关注）；右侧拼入完整调研详情主体
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { useLanguage } from "@/components/providers/language-provider";
import { HeaderActions } from "@/components/layouts/header-actions";
import { Logo } from "@/components/layouts/site-logo";
import { HeaderSearch } from "@/components/layouts/header-search";
import { UnfollowMenu, ctxMenuFrom, type CtxMenuState } from "@/components/layouts/unfollow-menu";
import { SurveyDetailBody } from "@/components/features/survey/survey-detail-body";
import { surveyToCardData, type Survey, type CardData } from "@/lib/types/survey";

const NAV_ITEMS = [
  { label: "公共服务",   slug: "public-services" },
  { label: "政策研究",   slug: "policy-research" },
  { label: "满意度调查", slug: "satisfaction-survey" },
  { label: "教育",       slug: "education" },
  { label: "健康医疗",   slug: "health-medical" },
  { label: "商业调查",   slug: "business-survey" },
  { label: "个人/企业",  slug: "personal-enterprise" },
];

export function FollowsPage({ from }: { from?: string }) {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const router = useRouter();
  const lng = lang as "zh-CN" | "zh-TW" | "en";

  // 返回目标：来自调研组合则回调研组合，否则（下拉菜单等）回首页
  const backTo = from === "portfolio" ? "/portfolio" : "/";

  const [followIds, setFollowIds] = useState<number[]>([]);
  const [selectedId, setSelectedId] = useState<number>(-1);
  const [ctxMenu, setCtxMenu] = useState<CtxMenuState | null>(null);
  const surveyMap = useRef<Map<number, CardData>>(new Map());
  const [, forceRender] = useState(0);

  // 拉取关注列表，然后按 IDs 批量拉取调研详情
  useEffect(() => {
    if (!user?.id) return;
    fetch(`/api/follows?user_id=${encodeURIComponent(user.id)}`)
      .then((r) => r.json())
      .then((json: { data?: number[] }) => {
        const ids = json.data ?? [];
        setFollowIds(ids);
        setSelectedId(ids[0] ?? -1);
        if (ids.length === 0) return;
        return fetch(`/api/surveys/list?ids=${ids.join(",")}`)
          .then((r) => r.json())
          .then((res: { data?: Survey[] }) => {
            (res.data ?? []).forEach((s) => surveyMap.current.set(s.id, surveyToCardData(s, lng)));
            forceRender((n) => n + 1);
          });
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, lng]);

  // 取消关注：从列表移除并同步到 DB
  function unfollow(id: number) {
    setFollowIds((prev) => {
      const next = prev.filter((x) => x !== id);
      if (id === selectedId) setSelectedId(next[0] ?? -1);
      return next;
    });
    if (user?.id) {
      fetch(`/api/follows/${id}?user_id=${encodeURIComponent(user.id)}`, { method: "DELETE" }).catch(() => {});
    }
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
                <span className="p-title">
                  关注的调研
                  <span style={{ marginLeft: 7, background: "rgba(255,255,255,.22)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "1px 7px", borderRadius: 10, verticalAlign: "middle" }}>
                    {followIds.length}
                  </span>
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
                    const s = surveyMap.current.get(id);
                    const isSel = id === selectedId;
                    return (
                      <div
                        key={id}
                        className="side-survey"
                        onClick={() => setSelectedId(id)}
                        onContextMenu={(e) => { e.preventDefault(); setCtxMenu(ctxMenuFrom(e, id)); }}
                        style={{ background: isSel ? "rgba(37,99,235,.13)" : undefined, borderBottomColor: "var(--border)" }}
                      >
                        <div className="side-ttl">{s?.title ?? "加载中…"}</div>
                        <div className="side-opts">
                          <div className="s-opt y"><span className="so-lbl">YES</span><span className="so-pct">{s?.yesPct ?? "--"}%</span><span className="so-odds">{s?.yesOdds ?? "--"}x</span></div>
                          <div className="s-opt n"><span className="so-lbl">NO</span><span className="so-pct">{s?.noPct ?? "--"}%</span><span className="so-odds">{s?.noOdds ?? "--"}x</span></div>
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
                <SurveyDetailBody key={selectedId} id={selectedId} betColWidth={300} onUnfollow={unfollow} />
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
