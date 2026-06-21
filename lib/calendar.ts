// カレンダーのグリッド計算（純粋な暦計算。表示は別途 JST で行う）

export const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export type YearMonth = { year: number; month: number }; // month: 1-12

/** "YYYY-MM-DD" から年月日を取り出す */
export function parseKey(key: string): { year: number; month: number; day: number } {
  const [y, m, d] = key.split("-").map(Number);
  return { year: y, month: m, day: d };
}

export function ymKey(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`;
}

/** 月を delta 分ずらす */
export function addMonth(ym: YearMonth, delta: number): YearMonth {
  const idx = (ym.year * 12 + (ym.month - 1) + delta);
  return { year: Math.floor(idx / 12), month: (idx % 12) + 1 };
}

export function compareYM(a: YearMonth, b: YearMonth): number {
  return a.year * 12 + a.month - (b.year * 12 + b.month);
}

/**
 * 月のカレンダー行列を返す。各セルは "YYYY-MM-DD" か null（前後の空白）。
 * 週は日曜始まり。
 */
export function monthMatrix(year: number, month: number): (string | null)[][] {
  // UTC を使って暦計算（タイムゾーンに依存させない）
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  const cells: (string | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(ymKey(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}
