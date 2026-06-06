"use client";

// 关注列表右键菜单 —— 在「关注的调研」列表上右键弹出「取消关注」
// 调研组合页与关注的调研页共用，保证交互一致
import { useEffect } from "react";

export interface CtxMenuState {
  x: number;
  y: number;
  id: number;
}

// 在右键事件中计算菜单位置（贴近光标，并避免溢出右/下边缘）
export function ctxMenuFrom(e: React.MouseEvent, id: number): CtxMenuState {
  const w = typeof window !== "undefined" ? window.innerWidth : 9999;
  const h = typeof window !== "undefined" ? window.innerHeight : 9999;
  return { x: Math.min(e.clientX, w - 150), y: Math.min(e.clientY, h - 60), id };
}

export function UnfollowMenu({
  state, onUnfollow, onClose,
}: {
  state: CtxMenuState | null;
  onUnfollow: (id: number) => void;
  onClose: () => void;
}) {
  // 点击别处 / 滚动 / Esc 关闭菜单
  useEffect(() => {
    if (!state) return;
    const close = () => onClose();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("click", close);
    document.addEventListener("scroll", close, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", close);
      document.removeEventListener("scroll", close, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [state, onClose]);

  if (!state) return null;

  return (
    <div
      style={{
        position: "fixed", top: state.y, left: state.x, zIndex: 3000,
        background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8,
        boxShadow: "0 10px 30px rgba(0,0,0,.16)", padding: 4, minWidth: 132,
      }}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      <button
        onClick={() => { onUnfollow(state.id); onClose(); }}
        style={{
          display: "flex", alignItems: "center", gap: 8, width: "100%",
          padding: "8px 12px", border: "none", background: "transparent", cursor: "pointer",
          fontFamily: "inherit", fontSize: 13, fontWeight: 500, color: "var(--red)",
          borderRadius: 6, textAlign: "left",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(220,38,38,.08)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
        取消关注
      </button>
    </div>
  );
}
