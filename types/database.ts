// Supabase 数据库类型占位文件
// 说明：当前 Supabase 仅作占位，数据保持前端静态。
// 待真正接入数据库后，用以下命令生成真实类型覆盖本文件：
//   npx supabase gen types typescript --project-id <id> > types/database.ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// 占位的空数据库结构，保证类型可用、可编译
export interface Database {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
