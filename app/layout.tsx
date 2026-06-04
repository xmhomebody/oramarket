import type { Metadata } from "next";
import { Fira_Sans, Fira_Code } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/components/providers/language-provider";
import { AuthProvider } from "@/components/providers/auth-provider";

// 正文字体 Fira Sans —— 暴露为 CSS 变量 --font-fira-sans，供移植的全局样式使用
const firaSans = Fira_Sans({
  variable: "--font-fira-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

// 等宽字体 Fira Code —— 用于数字、积分等等宽展示
const firaCode = Fira_Code({
  variable: "--font-fira-code",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// 页面元数据（SEO）—— 默认简体中文，与原站标题保持一致
export const metadata: Metadata = {
  title: "OraMarket — 中国预言机",
  description: "领先的中国预言机，专注政策结果、公众调查与社区预测。",
};

// 根布局：注入字体变量与语言上下文
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${firaSans.variable} ${firaCode.variable}`}>
      <body>
        <LanguageProvider>
          <AuthProvider>{children}</AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
