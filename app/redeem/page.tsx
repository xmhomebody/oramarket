import type { Metadata } from "next";
import { RedeemPage } from "@/components/features/redeem/redeem-page";

export const metadata: Metadata = {
  title: "积分兑换 — OraMarket",
  description: "用预测赢得的积分，兑换打车券、话费、购物卡、视频会员等虚拟权益。",
};

export default function RedeemRoutePage() {
  return <RedeemPage />;
}
