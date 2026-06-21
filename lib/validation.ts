import type { Field, Posting } from "@/lib/postings";

export type ValidationResult = {
  answers: Record<string, string>;
  errors: Record<string, string>;
};

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateField(field: Field, raw: string): string | null {
  const value = raw.trim();

  if (!value) {
    return field.required ? "入力してください" : null;
  }

  if (field.minLength && value.length < field.minLength) {
    return `${field.minLength}文字以上で入力してください（現在 ${value.length} 文字）`;
  }

  if (field.type === "email" && !emailRe.test(value)) {
    return "メールアドレスの形式が正しくありません";
  }

  if (
    (field.type === "select" || field.type === "radio") &&
    field.options &&
    !field.options.includes(value)
  ) {
    return "選択肢から選んでください";
  }

  if (field.type === "number" && Number.isNaN(Number(value))) {
    return "数値を入力してください";
  }

  return null;
}

/** 募集案件の fields に基づいて FormData を検証する */
export function validateApplication(
  posting: Posting,
  formData: FormData,
): ValidationResult {
  const answers: Record<string, string> = {};
  const errors: Record<string, string> = {};

  for (const field of posting.fields) {
    const raw = (formData.get(field.name) as string | null) ?? "";
    const value = raw.trim();
    answers[field.name] = value;
    const err = validateField(field, raw);
    if (err) errors[field.name] = err;
  }

  return { answers, errors };
}
