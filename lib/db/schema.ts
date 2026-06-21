import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  integer,
  boolean,
} from "drizzle-orm/pg-core";

/**
 * 面談枠（全案件共通の単一プール）。1枠 = 1時間。
 */
export const slots = pgTable("slots", {
  id: uuid("id").primaryKey().defaultRandom(),
  startAt: timestamp("start_at", { withTimezone: true }).notNull(),
  endAt: timestamp("end_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * 応募（＝面談予約も兼ねる）。
 * slotId は UNIQUE で、全案件横断の二重予約を防止する。
 */
export const applications = pgTable("applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  // どの募集案件への応募か（lib/postings.ts の slug を参照）
  postingSlug: text("posting_slug").notNull(),
  // 予約枠。却下時は null にして枠を解放する。UNIQUE で二重予約防止。
  slotId: uuid("slot_id")
    .references(() => slots.id, { onDelete: "set null" })
    .unique(),
  // フォーム項目への回答（案件ごとに項目が可変のため JSONB）
  answers: jsonb("answers").$type<Record<string, string>>().notNull(),
  // 一覧表示用に氏名項目を非正規化して保持
  displayName: text("display_name"),
  // 応募者向け専用URL /a/[token] の推測困難なトークン
  token: text("token").notNull().unique(),
  // 応募時に自動発行するオンライン面談URL（Jitsi）。推測困難な部屋名を含む。
  meetingUrl: text("meeting_url"),
  // 'new' | 'auto_rejected'（自動却下） | 'rejected'（手動却下）
  status: text("status").notNull().default("new"),
  // 自動却下の理由（一致したブロック語 / 該当 blocked_client）
  autoReason: text("auto_reason"),
  // 管理者の自由メモ
  note: text("note"),
  // 注意ワード一致時に、一致した語を保存（一覧で「注意」表示）
  warnedTerms: jsonb("warned_terms").$type<string[]>(),
  // 応募元の識別（補助）
  clientIp: text("client_ip"),
  clientId: text("client_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * ブロック/注意ワード（管理画面で編集）。
 * scope は将来の共有リスト用の種。MVP では常に 'private'。
 */
export const blockTerms = pgTable("block_terms", {
  id: uuid("id").primaryKey().defaultRandom(),
  term: text("term").notNull(),
  // 'block' | 'warn'
  type: text("type").notNull().default("block"),
  // 'private' | 'shared'（将来の共有機能用。MVP は private 固定）
  scope: text("scope").notNull().default("private"),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * ブロック済みクライアント。一度捕捉した応募元（clientId / IP）は
 * 以後の応募もサイレントに自動却下する。
 */
export const blockedClients = pgTable("blocked_clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: text("client_id"),
  ip: text("ip"),
  reason: text("reason"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * 管理ログインの試行記録（ブルートフォース対策）。
 * IP ごとに失敗回数とロック解除時刻を保持する。
 */
export const loginAttempts = pgTable("login_attempts", {
  ip: text("ip").primaryKey(),
  failedCount: integer("failed_count").notNull().default(0),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
  lastFailedAt: timestamp("last_failed_at", { withTimezone: true }),
});

/**
 * 募集案件。管理画面から作成/編集できる。
 * note は管理者用メモ（応募者には非表示。例: クラウドワークスの募集URL）。
 */
export const postings = pgTable("postings", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  active: boolean("active").notNull().default(true),
  intro: text("intro"),
  note: text("note"),
  // 応募完了後の画面に表示する案内文（応募者向け。面談URLの使い方など）。
  afterApplyMessage: text("after_apply_message"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * 募集案件のフォーム項目。管理画面のフォームビルダーで編集する。
 */
export const postingFields = pgTable("posting_fields", {
  id: uuid("id").primaryKey().defaultRandom(),
  postingId: uuid("posting_id")
    .notNull()
    .references(() => postings.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  label: text("label").notNull(),
  // text | textarea | email | tel | select | radio | number
  type: text("type").notNull().default("text"),
  required: boolean("required").notNull().default(false),
  minLength: integer("min_length"),
  options: jsonb("options").$type<string[]>(),
  placeholder: text("placeholder"),
  help: text("help"),
  isName: boolean("is_name").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
});

// 旧: slug キーの案件メモ。note は postings.note に統合済み（後方互換のため残置・未使用）。
export const postingNotes = pgTable("posting_notes", {
  slug: text("slug").primaryKey(),
  note: text("note").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type PostingRow = typeof postings.$inferSelect;
export type PostingFieldRow = typeof postingFields.$inferSelect;

export type Application = typeof applications.$inferSelect;
export type Slot = typeof slots.$inferSelect;
export type BlockTerm = typeof blockTerms.$inferSelect;
export type BlockedClient = typeof blockedClients.$inferSelect;
