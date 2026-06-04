"use client";

// 顶部右侧操作区：未登录显示「登录/注册」；登录后显示
// 调研组合 / 可用积分 / 兑换积分(礼物) / 通知(铃铛) / 用户头像(下拉菜单)
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { useLanguage } from "@/components/providers/language-provider";
import { type Lang } from "@/lib/i18n/dict";
import { fmt } from "@/lib/data/home";

// 语言选项
const LANGS: { key: Lang; label: string }[] = [
  { key: "zh-CN", label: "简体中文" },
  { key: "zh-TW", label: "繁體中文" },
  { key: "en", label: "English" },
];

export function HeaderActions() {
  const { user, portfolio, points, login, logout } = useAuth();
  const { t, lang, setLang } = useLanguage();

  // 登录弹窗 / 下拉菜单 / 语言子菜单 的开关
  const [modalOpen, setModalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [langExpand, setLangExpand] = useState(false);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");

  const menuRef = useRef<HTMLDivElement>(null);

  // 点击菜单外部关闭下拉
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setLangExpand(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // 提交登录
  function handleLogin() {
    if (!/^\d{6,}$/.test(phone)) {
      alert("请输入有效的手机号");
      return;
    }
    login(phone);
    setModalOpen(false);
    setPhone("");
    setCode("");
  }

  const curLangLabel = LANGS.find((l) => l.key === lang)?.label ?? "简体中文";

  return (
    <>
      {/* ── 未登录：登录 / 注册 ── */}
      {!user && (
        <div className="h-actions">
          <button className="btn-ln" onClick={() => setModalOpen(true)}>{t("sign_in")}</button>
          <button className="btn-rg" onClick={() => setModalOpen(true)}>{t("register")}</button>
        </div>
      )}

      {/* ── 已登录：积分组合 + 图标 + 头像 ── */}
      {user && (
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginLeft: "auto" }}>
          {/* 调研组合 */}
          <div style={{ textAlign: "right", lineHeight: 1.2 }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,.6)" }}>调研组合</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: "var(--font-fira-code),monospace" }}>
              {fmt(portfolio)}
            </div>
          </div>
          {/* 可用积分 */}
          <div style={{ textAlign: "right", lineHeight: 1.2 }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,.6)" }}>可用积分</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#FCD34D", fontFamily: "var(--font-fira-code),monospace" }}>
              {fmt(points)}
            </div>
          </div>

          {/* 礼物 + 铃铛 图标组（两者间距为整体 gap 的一半 9px） */}
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            {/* 兑换积分（礼物） */}
            <IconBtn title="兑换积分">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8">
                <polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" />
                <line x1="12" y1="22" x2="12" y2="7" />
                <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
              </svg>
            </IconBtn>

            {/* 通知（铃铛） */}
            <IconBtn title="通知">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" />
              </svg>
              {/* 未读小红点 */}
              <span style={{ position: "absolute", top: 4, right: 4, width: 7, height: 7, borderRadius: "50%", background: "var(--red)", border: "1.5px solid var(--blue-d)" }} />
            </IconBtn>
          </div>

          {/* 用户头像 + 下拉菜单 */}
          <div style={{ position: "relative" }} ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              style={{
                width: 34, height: 34, borderRadius: "50%", border: "2px solid rgba(255,255,255,.25)",
                background: user.avatarColor, color: "#fff", fontWeight: 700, fontSize: 14,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              {user.nickname[0]}
            </button>

            {/* 下拉菜单 */}
            {menuOpen && (
              <div style={{
                position: "absolute", top: "calc(100% + 10px)", right: 0, zIndex: 1100,
                width: 240, background: "var(--card)", borderRadius: 12,
                boxShadow: "0 12px 40px rgba(0,0,0,.18)", border: "1px solid var(--border)",
                overflow: "hidden",
              }}>
                {/* 报告头像 + 昵称 */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", background: "var(--bg)" }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: "50%", background: user.avatarColor,
                    color: "#fff", fontWeight: 700, fontSize: 16, flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {user.nickname[0]}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--blue-d)" }}>{user.nickname}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>{user.phone}</div>
                  </div>
                </div>

                <Divider />

                {/* 第一组：业务入口 */}
                <MenuItem icon="star" label="关注的调研" onClick={() => setMenuOpen(false)} />
                <MenuItem icon="grid" label="调研组合" onClick={() => setMenuOpen(false)} />
                <MenuItem icon="gift" label="积分兑换" onClick={() => setMenuOpen(false)} />
                <MenuItem icon="trophy" label="排行榜" onClick={() => setMenuOpen(false)} />

                <Divider />

                {/* 第二组：设置 */}
                {/* 语言（可展开切换，默认简体中文） */}
                <button onClick={() => setLangExpand((v) => !v)} style={menuItemStyle}>
                  <MenuIcon name="globe" />
                  <span style={{ flex: 1, textAlign: "left" }}>语言</span>
                  <span style={{ fontSize: 12, color: "var(--muted)", marginRight: 4 }}>{curLangLabel}</span>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                    style={{ opacity: .4, transition: ".15s", transform: langExpand ? "rotate(180deg)" : "none" }}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {langExpand && (
                  <div style={{ background: "var(--bg)" }}>
                    {LANGS.map((l) => (
                      <button
                        key={l.key}
                        onClick={() => { setLang(l.key); setLangExpand(false); }}
                        style={{
                          ...menuItemStyle, paddingLeft: 42, fontSize: 12.5,
                          color: l.key === lang ? "var(--blue)" : "var(--text2)",
                          fontWeight: l.key === lang ? 700 : 500,
                        }}
                      >
                        {l.label}
                        {l.key === lang && (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ marginLeft: "auto" }}>
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                )}
                <MenuItem icon="help" label="使用帮助" onClick={() => setMenuOpen(false)} />
                <MenuItem icon="message" label="问题反馈" onClick={() => setMenuOpen(false)} />
                <MenuItem icon="logout" label="退出登录" danger onClick={() => { logout(); setMenuOpen(false); }} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 登录弹窗 ── */}
      {modalOpen && (
        <div
          onClick={() => setModalOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 2000,
            background: "rgba(15,23,42,.55)", backdropFilter: "blur(2px)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 380, background: "var(--card)", borderRadius: 16,
              padding: "28px 28px 24px", position: "relative",
              boxShadow: "0 24px 60px rgba(0,0,0,.3)",
            }}
          >
            {/* 关闭按钮 */}
            <button onClick={() => setModalOpen(false)} style={{
              position: "absolute", top: 16, right: 16, background: "none", border: "none",
              cursor: "pointer", color: "var(--muted)", padding: 4,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* Logo + 标题 */}
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 6 }}>
              <div className="logo-icon" style={{ width: 30, height: 30 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="3.5" fill="#fff" />
                  <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </div>
              <span style={{ fontFamily: "var(--font-fira-code),monospace", fontWeight: 700, fontSize: 18, color: "var(--blue-d)" }}>
                Ora<span style={{ color: "var(--red)" }}>Market</span>
              </span>
            </div>
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 22 }}>手机号登录 / 注册</p>

            {/* 手机号 */}
            <label style={labelStyle}>手机号</label>
            <div style={{ display: "flex", alignItems: "center", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden", marginBottom: 14 }}>
              <span style={{ padding: "0 10px", fontSize: 13.5, color: "var(--text2)", borderRight: "1px solid var(--border)", lineHeight: "40px" }}>+86</span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                placeholder="请输入手机号"
                maxLength={11}
                style={inputStyle}
              />
            </div>

            {/* 验证码 */}
            <label style={labelStyle}>验证码</label>
            <div style={{ display: "flex", gap: 8, marginBottom: 22 }}>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="请输入验证码"
                maxLength={6}
                style={{ ...inputStyle, border: "1px solid var(--border)", borderRadius: 8, padding: "0 12px" }}
              />
              <button style={{
                flexShrink: 0, padding: "0 14px", borderRadius: 8, cursor: "pointer",
                border: "1px solid var(--blue)", background: "transparent", color: "var(--blue)",
                fontSize: 12.5, fontWeight: 600, fontFamily: "inherit", whiteSpace: "nowrap",
              }}>
                获取验证码
              </button>
            </div>

            {/* 登录按钮 */}
            <button onClick={handleLogin} style={{
              width: "100%", padding: "11px 0", borderRadius: 8, border: "none",
              background: "var(--blue)", color: "#fff", fontSize: 14.5, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit", letterSpacing: ".3px",
            }}>
              登录
            </button>
            <p style={{ marginTop: 14, fontSize: 11, color: "var(--muted)", textAlign: "center", lineHeight: 1.6 }}>
              未注册的手机号验证后将自动创建账号<br />登录即代表同意《用户协议》与《隐私政策》
            </p>
          </div>
        </div>
      )}
    </>
  );
}

// ── 头部圆形图标按钮 ──
function IconBtn({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <button
      title={title}
      style={{
        position: "relative", width: 34, height: 34, borderRadius: 8,
        background: "rgba(255,255,255,.08)", border: "none", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", transition: ".15s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,.18)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,.08)")}
    >
      {children}
    </button>
  );
}

// ── 菜单项样式 ──
const menuItemStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 10, width: "100%",
  padding: "10px 16px", border: "none", background: "transparent",
  cursor: "pointer", fontFamily: "inherit", fontSize: 13,
  color: "var(--text2)", transition: ".1s", textAlign: "left",
};

function Divider() {
  return <div style={{ height: 1, background: "var(--border)" }} />;
}

// ── 菜单项 ──
function MenuItem({ icon, label, onClick, danger }: {
  icon: string; label: string; onClick: () => void; danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{ ...menuItemStyle, color: danger ? "var(--red)" : "var(--text2)" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <MenuIcon name={icon} danger={danger} />
      <span>{label}</span>
    </button>
  );
}

// ── 菜单图标 ──
function MenuIcon({ name, danger }: { name: string; danger?: boolean }) {
  const color = danger ? "var(--red)" : "var(--text2)";
  const common = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 1.8 } as const;
  const paths: Record<string, React.ReactNode> = {
    star: <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />,
    grid: <><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></>,
    gift: <><polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" /><line x1="12" y1="22" x2="12" y2="7" /><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" /></>,
    trophy: <><path d="M6 9H4.5a2.5 2.5 0 010-5H6" /><path d="M18 9h1.5a2.5 2.5 0 000-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0012 0V2z" /></>,
    globe: <><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></>,
    help: <><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></>,
    message: <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />,
    logout: <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
}

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 600, color: "var(--text2)", marginBottom: 6,
};
const inputStyle: React.CSSProperties = {
  flex: 1, height: 40, border: "none", outline: "none", background: "transparent",
  fontSize: 13.5, color: "var(--blue-d)", fontFamily: "inherit", padding: "0 12px",
};
