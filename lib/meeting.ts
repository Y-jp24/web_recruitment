/**
 * オンライン面談URL（Jitsi Meet）の発行ユーティリティ。
 *
 * meet.jit.si は登録もAPIキーも不要で、ユニークな部屋名を持つURLにアクセスする
 * だけで通話を開始できる。URLを知っていれば誰でも入室できる仕様のため、
 * 部屋名には推測困難なランダム文字列を用いる。
 */

import { customAlphabet } from "nanoid";

// Jitsi の公開サーバー。将来セルフホストへ切り替える場合はここだけ変更する。
const JITSI_BASE_URL = "https://meet.jit.si";

// 部屋名のランダム部分の長さ。推測困難にするため十分に長くとる。
const ROOM_ID_LENGTH = 24;

// URL や Jitsi の部屋名で安全に使える英数字のみのアルファベット。
const roomId = customAlphabet(
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
  ROOM_ID_LENGTH,
);

/**
 * 推測困難なユニーク部屋名を持つ Jitsi 面談URLを生成して返す。
 */
export function generateMeetingUrl(): string {
  const url = `${JITSI_BASE_URL}/${roomId()}`;
  return url;
}
