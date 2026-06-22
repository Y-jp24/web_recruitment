/**
 * アプリ全体で共有する定数。
 * マジックナンバー/固定文字列を排除し、意味のある名前で一元管理する。
 */

/**
 * 応募（＝予約）のステータス。
 * - new: 新規（有効な予約中）
 * - auto_rejected: スクリーニングによる自動却下
 * - rejected: 管理者による手動却下
 * - cancelled: 応募者本人によるキャンセル（論理削除。記録は残す）
 */
export const APPLICATION_STATUS = {
  NEW: "new",
  AUTO_REJECTED: "auto_rejected",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
} as const;

export type ApplicationStatus =
  (typeof APPLICATION_STATUS)[keyof typeof APPLICATION_STATUS];

// Drizzle の text enum 制約や inArray に渡す用の値リスト
export const APPLICATION_STATUS_VALUES = [
  APPLICATION_STATUS.NEW,
  APPLICATION_STATUS.AUTO_REJECTED,
  APPLICATION_STATUS.REJECTED,
  APPLICATION_STATUS.CANCELLED,
] as const;

/**
 * 重複応募・再応募のブロック対象とみなす「既存応募」のステータス。
 * cancelled は対象外（キャンセル後の再予約＝日程変更を許可するため）。
 */
export const BLOCKING_APPLICATION_STATUSES = [
  APPLICATION_STATUS.NEW,
  APPLICATION_STATUS.AUTO_REJECTED,
  APPLICATION_STATUS.REJECTED,
] as const;

/**
 * 管理画面の設定キー（app_settings テーブルの key）。
 */
export const SETTING_KEYS = {
  // 予約確認ページにキャンセルボタンを表示するか
  RESERVATION_CANCEL_ENABLED: "reservation_cancel_enabled",
  // 予約確認ページに日程変更ボタンを表示するか
  RESERVATION_RESCHEDULE_ENABLED: "reservation_reschedule_enabled",
} as const;

// 設定値（真偽）を text カラムへ保存する際の表現
export const SETTING_BOOL = {
  TRUE: "true",
  FALSE: "false",
} as const;

// 日程変更で旧入力をプリフィルする際に使う、応募ページのクエリパラメータ名
export const RESCHEDULE_FROM_PARAM = "from";
