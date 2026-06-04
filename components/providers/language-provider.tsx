"use client";

// 语言上下文：管理当前语言、持久化到 localStorage，并提供翻译函数 t()
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { type Lang, translate } from "@/lib/i18n/dict";

interface LanguageContextValue {
  lang: Lang; // 当前语言
  setLang: (lang: Lang) => void; // 切换语言（会持久化）
  t: (key: string) => string; // 翻译函数
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

// localStorage 存储键，沿用原站的键名
const STORAGE_KEY = "oramarket_lang";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // 服务端与首屏统一默认简体中文，避免水合不一致；挂载后再读取本地存储
  const [lang, setLangState] = useState<Lang>("zh-CN");

  // 挂载后从 localStorage 恢复用户上次选择的语言
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (saved && saved !== lang) setLangState(saved);
    // 仅在挂载时执行一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 切换语言并写入 localStorage
  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    localStorage.setItem(STORAGE_KEY, next);
  }, []);

  // 绑定当前语言的翻译函数
  const t = useCallback((key: string) => translate(lang, key), [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

// 读取语言上下文的 Hook
export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage 必须在 LanguageProvider 内使用");
  return ctx;
}
