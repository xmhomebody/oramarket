"use client";

// 登录状态上下文：手机号「密码 / 验证码」登录，经后端 /api/auth 校验，
// 用户信息持久化到 localStorage（首屏统一未登录以避免 SSR 水合不一致）。
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api/client";
import { portfolioFromBets, type Bet, type BetSide } from "@/lib/types/bet";

// 登录用户信息
export interface AuthUser {
  id: string; // 用户 ID
  nickname: string; // 昵称
  phone: string; // 手机号
  avatarColor: string; // 头像底色
  balance: number; // 积分余额
}

// 操作结果：成功或带错误信息
type Result = { ok: true } | { ok: false; error: string };
// 发送验证码结果：开发环境会带回 devCode 便于测试
type SendResult = { ok: true; devCode?: string } | { ok: false; error: string };

interface AuthContextValue {
  user: AuthUser | null; // 当前登录用户（null 表示未登录）
  portfolio: number; // 调研组合积分 = 进行中下注金额之和
  points: number; // 积分余额（取自用户余额）
  bets: Bet[]; // 当前用户的全部下注
  betFor: (surveyId: number) => Bet | undefined; // 查询某调研的下注（用于方向锁定/「已下注」标记）
  placeBet: (surveyId: number, side: BetSide, amount: number, odds: number) => Promise<Result>; // 下注
  refreshBets: () => void; // 重新拉取下注列表
  sendCode: (phone: string) => Promise<SendResult>; // 发送短信验证码
  loginWithPassword: (phone: string, password: string) => Promise<Result>; // 密码登录
  loginWithCode: (phone: string, code: string) => Promise<Result>; // 验证码登录
  logout: () => void; // 退出登录
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "oramarket_user";
// 头像可选底色
const AVATAR_COLORS = ["#1E40AF", "#DC2626", "#16A34A", "#7C3AED", "#D97706"];

// 后端返回的用户 → 前端 AuthUser
function toAuthUser(u: {
  id: string;
  phone: string;
  display_name: string | null;
  balance: number;
}): AuthUser {
  const tail = u.phone.slice(-4) || "0000";
  return {
    id: u.id,
    nickname: u.display_name || `预言家${tail}`,
    phone: u.phone,
    avatarColor: AVATAR_COLORS[Number(tail) % AVATAR_COLORS.length],
    balance: Number(u.balance) || 0,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [bets, setBets] = useState<Bet[]>([]);

  // 挂载后从 localStorage 恢复登录态
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch {
        // 解析失败则忽略
      }
    }
  }, []);

  const persist = useCallback((u: AuthUser) => {
    setUser(u);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
  }, []);

  // 拉取当前用户的下注列表
  const refreshBets = useCallback(() => {
    const uid = user?.id;
    if (!uid) { setBets([]); return; }
    fetch(`/api/bets?user_id=${encodeURIComponent(uid)}`)
      .then((r) => r.json())
      .then((json: { data?: Bet[] }) => setBets(json.data ?? []))
      .catch(() => {});
  }, [user?.id]);

  // 登录态变化时同步下注列表
  useEffect(() => { refreshBets(); }, [refreshBets]);

  // 下注：原子写入后端，成功则同步余额与本地下注列表
  const placeBet = useCallback(
    async (surveyId: number, side: BetSide, amount: number, odds: number): Promise<Result> => {
      if (!user?.id) return { ok: false, error: "请先登录" };
      try {
        const res = await fetch("/api/bets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: user.id, survey_id: surveyId, side, amount, odds }),
        });
        const data = await res.json();
        if (!res.ok || !data?.ok) {
          return { ok: false, error: typeof data?.error === "string" ? data.error : "下注失败" };
        }
        // 余额来自后端（已扣除下注积分）
        persist({ ...user, balance: Number(data.balance) });
        // 合并下注：同一调研累加，否则新增
        setBets((prev) => {
          const next = prev.filter((b) => b.survey_id !== surveyId);
          return [{ survey_id: surveyId, side, amount: Number(data.bet?.amount ?? amount), odds: Number(data.bet?.odds ?? odds), status: "active", won: null }, ...next];
        });
        return { ok: true };
      } catch {
        return { ok: false, error: "网络错误，请稍后重试" };
      }
    },
    [user, persist],
  );

  const betFor = useCallback((surveyId: number) => bets.find((b) => b.survey_id === surveyId), [bets]);
  const portfolio = useMemo(() => portfolioFromBets(bets), [bets]);

  // 发送验证码
  const sendCode = useCallback(async (phone: string): Promise<SendResult> => {
    try {
      const res = await api.auth["send-code"].$post({ json: { phone } });
      const data = await res.json();
      if (!res.ok || !("ok" in data)) {
        const error = "error" in data && typeof data.error === "string" ? data.error : "发送失败";
        return { ok: false, error };
      }
      return { ok: true, devCode: "devCode" in data ? data.devCode : undefined };
    } catch {
      return { ok: false, error: "网络错误，请稍后重试" };
    }
  }, []);

  // 统一处理登录请求
  const doLogin = useCallback(
    async (
      body:
        | { phone: string; mode: "password"; password: string }
        | { phone: string; mode: "code"; code: string },
    ): Promise<Result> => {
      try {
        const res = await api.auth.login.$post({ json: body });
        const data = await res.json();
        if (!res.ok || !("user" in data)) {
          const error = "error" in data && typeof data.error === "string" ? data.error : "登录失败";
          return { ok: false, error };
        }
        persist(toAuthUser(data.user));
        return { ok: true };
      } catch {
        return { ok: false, error: "网络错误，请稍后重试" };
      }
    },
    [persist],
  );

  const loginWithPassword = useCallback(
    (phone: string, password: string) => doLogin({ phone, mode: "password", password }),
    [doLogin],
  );
  const loginWithCode = useCallback(
    (phone: string, code: string) => doLogin({ phone, mode: "code", code }),
    [doLogin],
  );

  // 退出登录
  const logout = useCallback(() => {
    setUser(null);
    setBets([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        portfolio,
        points: user?.balance ?? 0,
        bets,
        betFor,
        placeBet,
        refreshBets,
        sendCode,
        loginWithPassword,
        loginWithCode,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// 读取登录上下文的 Hook
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth 必须在 AuthProvider 内使用");
  return ctx;
}
