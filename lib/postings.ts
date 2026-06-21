/**
 * 募集案件とフォーム項目の定義。
 *
 * このファイルが「差し替えポイント」です。案件を増やすときは postings に
 * Posting を 1 つ追記してください。slug がそのまま公開URL `/p/[slug]` になります。
 * 公開フォームの描画・サーバ側バリデーション・管理画面のラベル表示は、
 * すべてこの定義を参照します。
 */

export type FieldType =
  | "text"
  | "textarea"
  | "email"
  | "tel"
  | "select"
  | "radio"
  | "number";

export type Field = {
  /** answers のキー（英数字スネークケース推奨） */
  name: string;
  /** 表示ラベル */
  label: string;
  type: FieldType;
  /** 必須/任意（項目ごとに選択。既定は任意） */
  required?: boolean;
  /** 自由記述の最低文字数（AI・コピペ対策） */
  minLength?: number;
  /** select / radio の選択肢 */
  options?: string[];
  placeholder?: string;
  /** 補足説明（ラベル下に表示） */
  help?: string;
  /** 一覧表示に使う氏名項目の印（最初の 1 つを displayName に使用） */
  isName?: boolean;
};

export type Posting = {
  /** 公開URL: /p/[slug]（応募者に送るURL） */
  slug: string;
  title: string;
  /** false にすると受付停止 */
  active: boolean;
  /** フォーム冒頭の説明文 */
  intro?: string;
  /** この案件の質問項目 */
  fields: Field[];
};

export const postings: Posting[] = [
  {
    slug: "sample",
    title: "サンプル募集（業務委託ライター）",
    active: true,
    intro:
      "ご応募ありがとうございます。選考のため、以下のフォーマットにそってご記入ください。内容を確認のうえ、面談のご案内をいたします。",
    fields: [
      {
        name: "full_name",
        label: "お名前",
        type: "text",
        required: true,
        isName: true,
        placeholder: "山田 太郎",
      },
      {
        name: "crowdworks_name",
        label: "クラウドワークスのユーザー名",
        type: "text",
        required: true,
        placeholder: "例: yamada_taro",
      },
      {
        name: "crowdworks_url",
        label: "クラウドワークスのプロフィールページURL",
        type: "text",
        required: true,
        placeholder: "https://crowdworks.jp/public/employees/xxxxxx",
      },
      {
        name: "email",
        label: "連絡先メールアドレス",
        type: "email",
        required: true,
        placeholder: "you@example.com",
      },
      {
        name: "experience",
        label: "これまでの職務経歴・実績",
        type: "textarea",
        required: true,
        minLength: 200,
        help: "200文字以上でご記入ください。具体的な実績や担当範囲が分かるように書いてください。",
      },
      {
        name: "self_pr",
        label: "自己PR",
        type: "textarea",
        required: true,
        minLength: 150,
        help: "150文字以上。あなたの強みを具体的に教えてください。",
      },
      {
        name: "motivation",
        label: "この案件への志望動機",
        type: "textarea",
        required: true,
        minLength: 100,
        help: "100文字以上。なぜこの募集に応募したのかを教えてください。",
      },
      {
        name: "weekly_hours",
        label: "稼働可能時間（週あたり）",
        type: "select",
        required: true,
        options: ["〜10時間", "10〜20時間", "20〜30時間", "30時間以上"],
      },
    ],
  },
];

export function getPosting(slug: string): Posting | undefined {
  return postings.find((p) => p.slug === slug);
}

/** 応募回答から一覧表示用の氏名を取り出す */
export function pickDisplayName(
  posting: Posting,
  answers: Record<string, string>,
): string {
  const nameField =
    posting.fields.find((f) => f.isName) ??
    posting.fields.find((f) => f.type === "text");
  return (nameField && answers[nameField.name]?.trim()) || "（無名）";
}
