"use client";

// 调研详情页组件 —— 设计风格与首页完全一致
// 标题区 / 积分池 / 走势图 / 最近下注 / 积分下注 等主体抽离至 SurveyDetailBody，与关注的调研页共用
import { useRouter } from "next/navigation";
import { HeaderActions } from "@/components/layouts/header-actions";
import { Logo } from "@/components/layouts/site-logo";
import { HeaderSearch } from "@/components/layouts/header-search";
import { SurveyDetailBody } from "@/components/features/survey/survey-detail-body";

interface SurveyDetailProps {
  id: number;
}

export function SurveyDetail({ id }: SurveyDetailProps) {
  const router = useRouter();

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", fontFamily: "var(--font-fira-sans),sans-serif", color: "var(--text)" }}>

      {/* ── 顶部导航栏（与首页 header 保持一致样式）── */}
      <header>
        <div className="h-inner" style={{ gap: 16 }}>
          {/* Logo */}
          <Logo />

          {/* 搜索框 */}
          <HeaderSearch />

          <HeaderActions />
        </div>
      </header>

      {/* ── 主内容区 ── */}
      <div className="wrap" style={{ padding: "16px 24px 40px" }}>

        {/* 返回调研市场 —— 次级按钮 */}
        <button
          onClick={() => router.push("/")}
          style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            background: "var(--card)", border: "1px solid var(--border)",
            color: "var(--text2)", fontSize: 12.5, cursor: "pointer",
            fontFamily: "inherit", fontWeight: 500,
            padding: "6px 12px", borderRadius: 6, marginBottom: 16,
            transition: ".15s",
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          返回
        </button>

        {/* 详情主体 */}
        <SurveyDetailBody id={id} />
      </div>
    </div>
  );
}
