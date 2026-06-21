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
