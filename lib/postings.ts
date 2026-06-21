/**
 * 募集案件・フォーム項目の「型」と「初期シードデータ」。
 *
 * 実データは DB（postings / posting_fields）に保存され、管理画面のフォームビルダー
 * で編集します（lib/postings-db.ts 経由）。このファイルの DEFAULT_POSTINGS は
 * 初期投入用（npm run db:seed）です。
 */

export type FieldType =
  | "text"
  | "textarea"
  | "email"
  | "tel"
  | "select"
  | "radio"
  | "number";

export const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: "text", label: "1行テキスト" },
  { value: "textarea", label: "複数行テキスト" },
  { value: "email", label: "メールアドレス" },
  { value: "tel", label: "電話番号" },
  { value: "select", label: "プルダウン選択" },
  { value: "radio", label: "ラジオ選択" },
  { value: "number", label: "数値" },
];

export type Field = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  minLength?: number;
  options?: string[];
  placeholder?: string;
  help?: string;
  isName?: boolean;
};

export type Posting = {
  id?: string;
  slug: string;
  title: string;
  active: boolean;
  intro?: string | null;
  note?: string | null;
  fields: Field[];
};

/** 応募回答から一覧表示用の氏名を取り出す */
export function pickDisplayName(
  posting: Pick<Posting, "fields">,
  answers: Record<string, string>,
): string {
  const nameField =
    posting.fields.find((f) => f.isName) ??
    posting.fields.find((f) => f.type === "text");
  return (nameField && answers[nameField.name]?.trim()) || "（無名）";
}

/** 初期投入用のサンプル案件（npm run db:seed） */
export const DEFAULT_POSTINGS: Posting[] = [
  {
    slug: "sample",
    title: "サンプル募集（業務委託ライター）",
    active: true,
    intro:
      "ご応募ありがとうございます。選考のため、以下のフォーマットにそってご記入ください。内容を確認のうえ、面談のご案内をいたします。",
    fields: [
      { name: "full_name", label: "お名前", type: "text", required: true, isName: true, placeholder: "山田 太郎" },
      { name: "crowdworks_name", label: "クラウドワークスのユーザー名", type: "text", required: true, placeholder: "例: yamada_taro" },
      { name: "crowdworks_url", label: "クラウドワークスのプロフィールページURL", type: "text", required: true, placeholder: "https://crowdworks.jp/public/employees/xxxxxx" },
      { name: "email", label: "連絡先メールアドレス", type: "email", required: true, placeholder: "you@example.com" },
      { name: "experience", label: "これまでの職務経歴・実績", type: "textarea", required: true, minLength: 200, help: "200文字以上でご記入ください。" },
      { name: "self_pr", label: "自己PR", type: "textarea", required: true, minLength: 150, help: "150文字以上。あなたの強みを具体的に。" },
      { name: "motivation", label: "この案件への志望動機", type: "textarea", required: true, minLength: 100, help: "100文字以上。" },
      { name: "weekly_hours", label: "稼働可能時間（週あたり）", type: "select", required: true, options: ["〜10時間", "10〜20時間", "20〜30時間", "30時間以上"] },
    ],
  },
];
