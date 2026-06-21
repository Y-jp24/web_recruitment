const TZ = "Asia/Tokyo";

const dateFmt = new Intl.DateTimeFormat("ja-JP", {
  timeZone: TZ,
  year: "numeric",
  month: "long",
  day: "numeric",
  weekday: "short",
});

const timeFmt = new Intl.DateTimeFormat("ja-JP", {
  timeZone: TZ,
  hour: "2-digit",
  minute: "2-digit",
});

const dateKeyFmt = new Intl.DateTimeFormat("ja-JP", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** 2026年6月20日(土) */
export function formatDate(d: Date): string {
  return dateFmt.format(d);
}

/** 14:00 */
export function formatTime(d: Date): string {
  return timeFmt.format(d);
}

/** 2026年6月20日(土) 14:00〜15:00 */
export function formatSlotRange(start: Date, end: Date): string {
  return `${dateFmt.format(start)} ${timeFmt.format(start)}〜${timeFmt.format(end)}`;
}

/** 一覧の見出しグルーピング用キー（JSTの日付） */
export function dateKey(d: Date): string {
  return dateKeyFmt.format(d);
}

// "2026-06-22" 形式（en-CA は YYYY-MM-DD）
const ymdFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** JST の日付キー "YYYY-MM-DD" */
export function jstDateKey(d: Date): string {
  return ymdFmt.format(d);
}

/** 現在の JST 日付キー */
export function todayJstKey(): string {
  return ymdFmt.format(new Date());
}

/** "YYYY-MM-DD" を JST 正午の Date にする（表示・整形用、TZに依存しない） */
export function dateKeyToDate(key: string): Date {
  return new Date(`${key}T12:00:00+09:00`);
}

/** "YYYY-MM-DD" を「6月22日(日)」のように整形 */
export function formatDateKeyJa(key: string): string {
  return formatDate(dateKeyToDate(key));
}

/**
 * JST の「日付 + HH:MM」を UTC の Date に変換する。
 * 管理画面で入力された枠（JST想定）を timestamptz として保存するために使う。
 */
export function jstDateTimeToUTC(dateStr: string, timeStr: string): Date {
  // dateStr: "2026-06-20", timeStr: "14:00"
  const [y, mo, da] = dateStr.split("-").map(Number);
  const [h, mi] = timeStr.split(":").map(Number);
  // JST = UTC+9（日本は夏時間なし）。UTCのミリ秒を直接組み立てる。
  const utcMs = Date.UTC(y, mo - 1, da, h - 9, mi, 0, 0);
  return new Date(utcMs);
}
