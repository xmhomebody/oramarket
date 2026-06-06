// 站点 Logo —— 顶栏品牌标识（图片版，替代原 SVG 图标 + 文字）
// 图片位于 public/img/logo.png，按站点根路径 /img/logo.png 引用
export function Logo() {
  return (
    <a className="logo" href="/">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/img/logo.png" alt="OraMarket" style={{ height: 39, width: "auto", display: "block" }} />
    </a>
  );
}
