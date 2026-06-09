// 模糊搜索打分 —— 大小写无关 + 分词 + 子序列容错
// 返回 0 表示不匹配；分值越高越相关（用于结果排序）。

function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

// q 的字符是否按顺序出现在 t 中（容忍中间夹杂其它字符，用于错字/缺字）
function isSubsequence(q: string, t: string): boolean {
  let i = 0;
  for (let j = 0; j < t.length && i < q.length; j++) {
    if (t[j] === q[i]) i++;
  }
  return i === q.length;
}

// query 对 text 的相关度打分
export function fuzzyScore(rawQuery: string, rawText: string): number {
  const q = normalize(rawQuery);
  const t = normalize(rawText);
  if (!q) return 1;      // 空查询：全部匹配
  if (!t) return 0;

  // 整串子串命中：最高分，且越接近完整文本越高
  if (t.includes(q)) return 100 - Math.min(t.length - q.length, 50) * 0.1;

  // 分词：每个词都需以「子串」或「子序列」命中文本，否则判为不匹配
  const tokens = q.split(" ").filter(Boolean);
  let score = 0;
  for (const tok of tokens) {
    if (t.includes(tok)) {
      score += 10;
    } else if (tok.length >= 2 && isSubsequence(tok, t)) {
      score += 4;
    } else {
      return 0;
    }
  }
  return score;
}
