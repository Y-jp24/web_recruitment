/**
 * アプリ全体の設定（app_settings テーブル）の読み書きを担うモジュール。
 * 設定アクセスの責務をここに集約し、呼び出し側は型付きの値だけを扱う。
 */

import { db } from "@/lib/db";
import { appSettings } from "@/lib/db/schema";
import { SETTING_KEYS, SETTING_BOOL } from "@/lib/constants";

/** アプリ設定の型（真偽値に正規化済み） */
export type AppSettings = {
  // 予約確認ページにキャンセルボタンを表示するか
  reservationCancelEnabled: boolean;
  // 予約確認ページに日程変更ボタンを表示するか
  reservationRescheduleEnabled: boolean;
};

// 未設定時の既定値（公開直後は両方オフ＝安全側に倒す）
const DEFAULT_SETTINGS: AppSettings = {
  reservationCancelEnabled: false,
  reservationRescheduleEnabled: false,
};

/** text カラムの値を真偽値に変換 */
function parseBool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return value === SETTING_BOOL.TRUE;
}

/** 真偽値を保存用の text に変換 */
function boolToValue(value: boolean): string {
  return value ? SETTING_BOOL.TRUE : SETTING_BOOL.FALSE;
}

/** 全設定を取得し、既定値とマージして返す */
export async function getSettings(): Promise<AppSettings> {
  const rows = await db.select().from(appSettings);
  const map = new Map(rows.map((r) => [r.key, r.value]));
  return {
    reservationCancelEnabled: parseBool(
      map.get(SETTING_KEYS.RESERVATION_CANCEL_ENABLED),
      DEFAULT_SETTINGS.reservationCancelEnabled,
    ),
    reservationRescheduleEnabled: parseBool(
      map.get(SETTING_KEYS.RESERVATION_RESCHEDULE_ENABLED),
      DEFAULT_SETTINGS.reservationRescheduleEnabled,
    ),
  };
}

/** 1 件の設定を upsert する */
async function upsertSetting(key: string, value: string): Promise<void> {
  await db
    .insert(appSettings)
    .values({ key, value })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: { value, updatedAt: new Date() },
    });
}

/** 設定をまとめて保存する */
export async function saveSettings(settings: AppSettings): Promise<void> {
  await upsertSetting(
    SETTING_KEYS.RESERVATION_CANCEL_ENABLED,
    boolToValue(settings.reservationCancelEnabled),
  );
  await upsertSetting(
    SETTING_KEYS.RESERVATION_RESCHEDULE_ENABLED,
    boolToValue(settings.reservationRescheduleEnabled),
  );
  console.log("[settings] saved", settings);
}
