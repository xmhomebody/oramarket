// 站点顶栏（共享）—— 深蓝底 + 红色下边框，内含 Logo / 搜索框 / 右侧操作区。
// 各页面统一引用此组件，避免重复 header 结构。样式由 Tailwind 工具类复刻原站 .h-inner。
import { Logo } from "@/components/layouts/site-logo";
import { HeaderSearch } from "@/components/layouts/header-search";
import { HeaderActions } from "@/components/layouts/header-actions";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-[1000] border-b-2 border-brand-red bg-brand-blue-d">
      <div className="mx-auto flex h-[58px] max-w-[1400px] items-center gap-4 px-6">
        <Logo />
        <HeaderSearch />
        <HeaderActions />
      </div>
    </header>
  );
}
