"use client";

// 顶部搜索框：回车跳转到搜索结果页 /search?q=
// variant="dark"：用于深色表头（沿用 .search-wrap 样式）
// variant="light"：用于浅色卡片（白底/深色文字/左侧放大镜），避免在白卡上看不见
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export function HeaderSearch({
  defaultValue = "",
  variant = "dark",
}: {
  defaultValue?: string;
  variant?: "dark" | "light";
}) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  // 提交搜索
  function submit() {
    const q = value.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  }

  // 放大镜图标
  const magnifier = (extra: React.CSSProperties) => (
    <svg
      width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      style={extra}
      onClick={submit}
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );

  // ── 浅色变体：用于侧栏白色卡片 ──
  if (variant === "light") {
    return (
      <div style={{ position: "relative", width: "100%" }}>
        {magnifier({
          position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)",
          color: "var(--muted)", cursor: "pointer",
        })}
        <input
          ref={inputRef}
          type="text"
          placeholder="搜索调研、话题、事件…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
          style={{
            width: "100%", height: 40, borderRadius: 8,
            border: "1px solid var(--border)", background: "var(--card)",
            padding: "0 34px 0 36px", color: "var(--blue-d)", fontSize: 13.5,
            outline: "none", fontFamily: "inherit",
          }}
        />
        {/* 清空按钮（有内容时显示）*/}
        {value && (
          <button
            type="button"
            aria-label="清空"
            onClick={() => { setValue(""); inputRef.current?.focus(); }}
            style={{
              position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
              width: 20, height: 20, borderRadius: "50%", border: "none",
              background: "rgba(0,0,0,.06)", color: "var(--muted)", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>
    );
  }

  // ── 深色变体：用于表头（沿用原 .search-wrap 样式，放大镜在右侧）──
  return (
    <div className="search-wrap" style={{ marginLeft: 20 }}>
      <input
        type="text"
        placeholder="搜索调研、话题、事件…"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
      />
      {magnifier({
        position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)",
        color: "rgba(255,255,255,.45)", cursor: "pointer",
      })}
    </div>
  );
}
