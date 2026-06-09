// 认证相关 API —— 挂载在 /api/auth
// 自定义「手机号 + 密码 / 短信验证码」登录，数据来自 public.profiles。
// 说明：当前未接入真实短信服务商，开发环境下 send-code 会直接把验证码返回给前端。
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { createServiceClient } from "@/server/lib/supabase";
import { verifyPassword } from "@/server/lib/password";

// 中国大陆手机号：1 开头共 11 位
const phoneSchema = z.string().regex(/^1\d{10}$/, "手机号格式不正确");

const isDev = process.env.NODE_ENV !== "production";
const CODE_TTL_MS = 5 * 60 * 1000; // 验证码 5 分钟有效

// 对外返回的用户字段（绝不包含 password_hash）
const PUBLIC_COLS = "id, phone, display_name, avatar_url, balance, lang" as const;
type PublicUser = {
  id: string;
  phone: string;
  display_name: string | null;
  avatar_url: string | null;
  balance: number;
  lang: string;
};

export const authRoute = new Hono()
  // 发送验证码：生成 6 位数字，写入 verification_codes
  .post("/send-code", zValidator("json", z.object({ phone: phoneSchema })), async (c) => {
    const { phone } = c.req.valid("json");
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + CODE_TTL_MS).toISOString();

    const sb = createServiceClient();
    const { error } = await sb.from("verification_codes").insert({ phone, code, expires_at: expiresAt });
    if (error) return c.json({ error: "验证码发送失败，请稍后重试" }, 500);

    // TODO: 接入真实短信服务商后在此发送短信。开发环境直接回传验证码便于测试。
    console.log(`[auth] 验证码 for ${phone}: ${code}`);
    return c.json({ ok: true, ...(isDev ? { devCode: code } : {}) });
  })

  // 登录：mode=password（手机号+密码）或 mode=code（手机号+验证码，未注册则自动创建）
  .post(
    "/login",
    zValidator(
      "json",
      z.object({
        phone: phoneSchema,
        mode: z.enum(["password", "code"]),
        password: z.string().optional(),
        code: z.string().optional(),
      }),
    ),
    async (c) => {
      const { phone, mode, password, code } = c.req.valid("json");
      const sb = createServiceClient();

      if (mode === "password") {
        if (!password) return c.json({ error: "请输入密码" }, 400);
        const { data: profile } = await sb
          .from("profiles")
          .select(`${PUBLIC_COLS}, password_hash`)
          .eq("phone", phone)
          .maybeSingle();
        if (!profile || !verifyPassword(password, profile.password_hash)) {
          return c.json({ error: "手机号或密码错误" }, 401);
        }
        // 不回传 password_hash
        const user: PublicUser = {
          id: profile.id,
          phone: profile.phone,
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
          balance: profile.balance,
          lang: profile.lang,
        };
        return c.json({ user });
      }

      // mode === "code"
      if (!code) return c.json({ error: "请输入验证码" }, 400);
      const { data: rows } = await sb
        .from("verification_codes")
        .select("id")
        .eq("phone", phone)
        .eq("code", code)
        .eq("consumed", false)
        .gte("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1);
      const match = rows?.[0];
      if (!match) return c.json({ error: "验证码错误或已过期" }, 401);

      // 标记验证码已用
      await sb.from("verification_codes").update({ consumed: true }).eq("id", match.id);

      // 查找用户，不存在则自动创建（与「未注册手机号验证后自动创建账号」一致）
      let { data: profile } = await sb
        .from("profiles")
        .select(PUBLIC_COLS)
        .eq("phone", phone)
        .maybeSingle();
      if (!profile) {
        const tail = phone.slice(-4);
        const { data: created, error: insErr } = await sb
          .from("profiles")
          .insert({ phone, display_name: `预言家${tail}` })
          .select(PUBLIC_COLS)
          .single();
        if (insErr || !created) return c.json({ error: "账号创建失败" }, 500);
        profile = created;
      }
      return c.json({ user: profile as PublicUser });
    },
  );
