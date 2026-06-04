"use client";

// 登录状态上下文：模拟手机号登录，状态持久化到 localStorage
import { createContext, useCallback, useContext, useEffect, useState } from "react";

// 登录用户信息
export interface AuthUser {
  nickname: string; // 昵称
  phone: string; // 手机号
  avatarColor: string; // 头像底色
}

interface AuthContextValue {
  user: AuthUser | null; // 当前登录用户（null 表示未登录）
  portfolio: number; // 调查组合
  points: number; // 可用积分
  login: (phone: string) => void; // 模拟登录
  logout: () => void; // 退出登录
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "oramarket_user";
// 头像可选底色
const AVATAR_COLORS = ["#1E40AF", "#DC2626", "#16A34A", "#7C3AED", "#D97706"];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  // 挂载后从 localStorage 恢复登录态（避免 SSR 水合不一致，首屏统一未登录）
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

  // 模拟登录：根据手机号后四位生成昵称
  const login = useCallback((phone: string) => {
    const tail = phone.slice(-4) || "0000";
    const next: AuthUser = {
      nickname: `预言家${tail}`,
      phone,
      avatarColor: AVATAR_COLORS[Number(tail) % AVATAR_COLORS.length],
    };
    setUser(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  // 退出登录
  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ user, portfolio: 2000, points: 5000, login, logout }}>
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
