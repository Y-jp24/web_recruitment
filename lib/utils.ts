export type ClassValue = string | false | null | undefined;

/** 小さな className 結合ヘルパー */
export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(" ");
}
