"use client";

// 顶部右侧操作区：未登录显示「登录/注册」；登录后显示
// 调研组合 / 可用积分 / 兑换积分(礼物) / 通知(铃铛) / 用户头像(下拉菜单)
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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

// 通知类型（结合站点业务：赢/输结算、积分兑换、入分、关注动态、系统）
type NotifType = "win" | "lose" | "redeem" | "credit" | "follow" | "system";
interface Notif { id: number; type: NotifType; text: string; amount?: number; time: string; unread: boolean }
const INITIAL_NOTIFS: Notif[] = [
  { id: 1, type: "win",    text: "「美国公共医保是否扩大覆盖至全民」已结算，您预测正确，获得", amount: 1280, time: "2 小时前", unread: true },
  { id: 2, type: "credit", text: "每日签到奖励已到账，获得", amount: 200, time: "5 小时前", unread: true },
  { id: 3, type: "follow", text: "您关注的「全国教育经费预算上调 15%」将于 24 小时后截止，记得及时下注", time: "8 小时前", unread: true },
  { id: 4, type: "redeem", text: "您兑换的「滴滴出行 ¥20 打车券」已发放，可在兑换记录中查看卡密", time: "1 天前", unread: false },
  { id: 5, type: "lose",   text: "「城市住房可负担指数是否改善」已结算，本次预测未命中", time: "1 天前", unread: false },
  { id: 6, type: "follow", text: "您关注的「气候政策法案能否按期通过」积分池突破 50 万", time: "2 天前", unread: false },
  { id: 7, type: "win",    text: "「数字政务服务采用率是否超 80%」已结算，您预测正确，获得", amount: 860, time: "2 天前", unread: false },
  { id: 8, type: "system", text: "积分兑换上新：新增京东 E 卡、视频会员等多款热门权益，快来兑换吧", time: "3 天前", unread: false },
];

export function HeaderActions() {
  const { user, portfolio, points, login, logout } = useAuth();
  const { t, lang, setLang } = useLanguage();
  const router = useRouter();

  // 登录弹窗 / 下拉菜单 / 语言子菜单 / 通知面板 的开关
  const [modalOpen, setModalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [langExpand, setLangExpand] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>(INITIAL_NOTIFS);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");

  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifs.filter((n) => n.unread).length;
  const markRead = (id: number) => setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)));
  const markAllRead = () => setNotifs((prev) => prev.map((n) => ({ ...n, unread: false })));

  // 点击菜单/通知面板外部关闭下拉
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setLangExpand(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
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
          {/* 调研组合（可点击进入组合页，hover 高亮） */}
          <button
            onClick={() => router.push("/portfolio")}
            title="查看我的调研组合"
            style={{
              textAlign: "right", lineHeight: 1.2, cursor: "pointer",
              background: "transparent", border: "none", fontFamily: "inherit",
              padding: "5px 10px", borderRadius: 8, transition: ".15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,.12)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <div style={{ fontSize: 10, color: "rgba(255,255,255,.6)" }}>调研组合</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: "var(--font-fira-code),monospace" }}>
              {fmt(portfolio)}
            </div>
          </button>
          {/* 积分余额（可点击查看积分记录，hover 高亮） */}
          <button
            onClick={() => router.push("/points")}
            title="查看积分记录"
            style={{
              textAlign: "right", lineHeight: 1.2, cursor: "pointer",
              background: "transparent", border: "none", fontFamily: "inherit",
              padding: "5px 10px", borderRadius: 8, transition: ".15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,.12)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <div style={{ fontSize: 10, color: "rgba(255,255,255,.6)" }}>积分余额</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#FCD34D", fontFamily: "var(--font-fira-code),monospace" }}>
              {fmt(points)}
            </div>
          </button>

          {/* 礼物 + 铃铛 图标组（两者间距为整体 gap 的一半 9px） */}
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            {/* 兑换积分（礼物） */}
            <IconBtn title="兑换积分" onClick={() => router.push("/redeem")}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8">
                <polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" />
                <line x1="12" y1="22" x2="12" y2="7" />
                <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
              </svg>
            </IconBtn>

            {/* 通知（铃铛） + 通知面板 */}
            <div style={{ position: "relative" }} ref={notifRef}>
              <IconBtn title="通知" onClick={() => setNotifOpen((v) => !v)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" />
                </svg>
                {/* 未读小红点 */}
                {unreadCount > 0 && (
                  <span style={{ position: "absolute", top: 4, right: 4, width: 7, height: 7, borderRadius: "50%", background: "var(--red)", border: "1.5px solid var(--blue-d)" }} />
                )}
              </IconBtn>

              {/* 通知下拉面板 */}
              {notifOpen && (
                <div style={{
                  position: "absolute", top: "calc(100% + 12px)", right: 0, zIndex: 1100,
                  width: 384, background: "var(--card)", borderRadius: 12,
                  boxShadow: "0 12px 40px rgba(0,0,0,.18)", border: "1px solid var(--border)", overflow: "hidden",
                }}>
                  {/* 面板头部 */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 16px", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: "var(--blue-d)" }}>通知</span>
                      {unreadCount > 0 && (
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", background: "var(--red)", borderRadius: 10, padding: "1px 7px", lineHeight: 1.6 }}>
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllRead}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--blue)", fontSize: 12, fontWeight: 600, fontFamily: "inherit", padding: "4px 6px", borderRadius: 6 }}
                        >
                          全部已读
                        </button>
                      )}
                      <button title="通知设置" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 4, display: "flex" }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <circle cx="12" cy="12" r="3" />
                          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* 通知列表 */}
                  <div style={{ maxHeight: 440, overflowY: "auto" }}>
                    {notifs.length === 0 ? (
                      <div style={{ padding: "48px 20px", textAlign: "center", color: "var(--muted)", fontSize: 13 }}>暂无通知</div>
                    ) : notifs.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markRead(n.id)}
                        style={{
                          display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 16px",
                          borderBottom: "1px solid var(--border)", cursor: "pointer", transition: ".1s",
                          background: n.unread ? "rgba(37,99,235,.045)" : "transparent",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = n.unread ? "rgba(37,99,235,.045)" : "transparent")}
                      >
                        {/* 未读圆点 */}
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: n.unread ? "var(--blue)" : "transparent", flexShrink: 0, marginTop: 13 }} />
                        {/* 类型图标 */}
                        <span style={{
                          width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          background: notifTint(n.type), color: notifColor(n.type),
                        }}>
                          <NotifIcon type={n.type} />
                        </span>
                        {/* 内容 + 时间 */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: 13, lineHeight: 1.5, color: "var(--text)",
                            display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden",
                          }}>
                            {n.text}
                            {n.amount != null && (
                              <b style={{ color: "var(--green)", fontFamily: "var(--font-fira-code),monospace", marginLeft: 4 }}>
                                +{fmt(n.amount)} 积分
                              </b>
                            )}
                          </div>
                          <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 4 }}>{n.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
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
                <MenuItem icon="star" label="关注的调研" onClick={() => { router.push("/follows?from=home"); setMenuOpen(false); }} />
                <MenuItem icon="grid" label="调研组合" onClick={() => { router.push("/portfolio"); setMenuOpen(false); }} />
                <MenuItem icon="gift" label="积分兑换" onClick={() => { router.push("/redeem"); setMenuOpen(false); }} />
                <MenuItem icon="trophy" label="排行榜" onClick={() => { router.push("/leaderboard"); setMenuOpen(false); }} />

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

            {/* Logo（图片版） */}
            <div style={{ marginBottom: 22 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/img/logo_login.png" alt="OraMarket" style={{ height: 48, width: "auto", display: "block" }} />
            </div>

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
function IconBtn({ children, title, onClick }: { children: React.ReactNode; title: string; onClick?: () => void }) {
  return (
    <button
      title={title}
      onClick={onClick}
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

// ── 通知类型颜色 / 底色 / 图标 ──
function notifColor(type: NotifType): string {
  switch (type) {
    case "win":    return "var(--green)";
    case "lose":   return "var(--red)";
    case "redeem": return "var(--amber)";
    case "credit": return "var(--green)";
    case "follow": return "var(--blue)";
    default:       return "var(--text2)";
  }
}
function notifTint(type: NotifType): string {
  switch (type) {
    case "win":    return "rgba(22,163,74,.12)";
    case "lose":   return "rgba(220,38,38,.12)";
    case "redeem": return "rgba(217,119,6,.13)";
    case "credit": return "rgba(22,163,74,.12)";
    case "follow": return "rgba(37,99,235,.12)";
    default:       return "rgba(100,116,139,.12)";
  }
}
function NotifIcon({ type }: { type: NotifType }) {
  const common = { width: 17, height: 17, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2 } as const;
  switch (type) {
    case "win":
      return <svg {...common}><path d="M6 9H4.5a2.5 2.5 0 010-5H6" /><path d="M18 9h1.5a2.5 2.5 0 000-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0012 0V2z" /></svg>;
    case "lose":
      return <svg {...common}><polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" /></svg>;
    case "redeem":
      return <svg {...common}><polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" /><line x1="12" y1="22" x2="12" y2="7" /><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" /></svg>;
    case "credit":
      return <svg {...common}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;
    case "follow":
      return <svg {...common}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>;
    default:
      return <svg {...common}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>;
  }
}

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 600, color: "var(--text2)", marginBottom: 6,
};
const inputStyle: React.CSSProperties = {
  flex: 1, height: 40, border: "none", outline: "none", background: "transparent",
  fontSize: 13.5, color: "var(--blue-d)", fontFamily: "inherit", padding: "0 12px",
};
