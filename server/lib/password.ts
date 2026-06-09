// 密码哈希工具 —— 使用 Node 内置 scrypt（无需额外依赖）。
// 存储格式：`salt:hash`，均为十六进制。仅在服务端（Node 运行时）使用。
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEYLEN = 64;

// 生成密码哈希
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, KEYLEN).toString("hex");
  return `${salt}:${hash}`;
}

// 校验密码（哈希为空或格式不符均返回 false；定长比较防时序攻击）
export function verifyPassword(password: string, stored: string | null | undefined): boolean {
  if (!stored) return false;
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(password, salt, KEYLEN);
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}
