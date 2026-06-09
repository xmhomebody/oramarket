"use client";

// 预测卡片（共享）—— 接受扁平 CardData，供 trending / latest / category / search / home 复用。
import { useRouter } from "next/navigation";
import { AV_COLORS, fmt } from "@/lib/data/home";
import type { CardData } from "@/lib/types/survey";

export function SurveyCard({
  d,
  t,
}: {
  d: CardData;
  t: (k: string) => string;
}) {
  const router = useRouter();

  return (
    <div
      className="group relative cursor-pointer overflow-hidden rounded-[9px] border border-brand-border bg-brand-card p-[13px] transition-all duration-[250ms] [animation:fadeUp_0.35s_ease_forwards] hover:-translate-y-[3px] hover:border-brand-blue-l hover:shadow-[0_8px_20px_rgba(30,64,175,.13)]"
      style={{ animationDelay: `${(d.id % 40) * 20}ms` }}
      onClick={() => router.push(`/survey/${d.id}`)}
    >
      {/* 顶部渐变高亮条（悬停展开） */}
      <span className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-gradient-to-r from-brand-blue to-brand-blue-l transition-transform duration-300 group-hover:scale-x-100" />

      {/* 标题 */}
      <div className="mb-[9px] line-clamp-2 text-[12.5px] font-semibold leading-[1.4] text-brand-blue-d">
        {d.title}
      </div>

      {/* 积分池 */}
      <div className="mb-2 flex items-center gap-1">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2">
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="4" />
        </svg>
        <span className="font-mono text-[12.5px] font-semibold text-brand-blue">{fmt(d.pool)}</span>
        <span className="text-[10.5px] text-brand-muted">{t("card_pts_pool")}</span>
      </div>

      {/* 投票 YES / NO */}
      <div className="mb-2">
        <div className="mb-0.5 flex items-center justify-between">
          <div className="flex items-center gap-[5px]">
            <span className="text-[10.5px] font-bold tracking-[0.5px] text-[#2563EB]">YES</span>
            <span className="text-[9.5px] text-brand-muted">×{d.yesOdds}</span>
          </div>
          <span className="font-mono text-[14px] font-bold text-[#2563EB]">{d.yesPct}%</span>
        </div>
        <div className="mb-[3px] h-1 overflow-hidden rounded-sm bg-brand-border">
          <div className="h-full rounded-sm bg-[#2563EB]" style={{ width: `${d.yesPct}%` }} />
        </div>
        <div className="mt-[3px] flex items-center justify-between">
          <div className="flex items-center gap-[5px]">
            <span className="text-[10.5px] font-bold tracking-[0.5px] text-brand-red">NO</span>
            <span className="text-[9.5px] text-brand-muted">×{d.noOdds}</span>
          </div>
          <span className="font-mono text-[14px] font-bold text-brand-red">{d.noPct}%</span>
        </div>
      </div>

      {/* 参与者头像 + 计数 */}
      <div className="mb-[7px] flex items-center gap-[5px]">
        <div className="flex">
          {AV_COLORS.slice(0, 3).map((c, i) => (
            <div
              key={i}
              className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-[1.5px] border-white text-[7px] font-bold text-white first:ml-0 [&:not(:first-child)]:-ml-[5px]"
              style={{ background: c }}
            >
              {String.fromCharCode(65 + i)}
            </div>
          ))}
        </div>
        <span className="text-[11.5px] font-medium text-brand-text2">
          {fmt(d.parts)} {t("card_joined")}
        </span>
      </div>

      {/* 标签 */}
      <div className="mb-[7px] flex flex-wrap gap-[3px]">
        {d.tags.map((tg, i) => (
          <span
            key={i}
            className="rounded-[9px] bg-brand-blue/[0.07] px-[6px] py-[1.5px] text-[9.5px] font-medium text-brand-blue"
          >
            {tg}
          </span>
        ))}
      </div>

      {/* 页脚：发布 / 截止 */}
      <div className="mt-0.5 flex justify-between border-t border-brand-border pt-[6px] text-[9.5px] text-brand-muted">
        <span className="font-mono">
          {t("card_published")}: {d.pub}
        </span>
        <span className="font-mono font-semibold text-brand-red">
          {t("card_closes")}: {d.dl}
        </span>
      </div>
    </div>
  );
}
