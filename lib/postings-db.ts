import { db } from "@/lib/db";
import {
  postings,
  postingFields,
  type PostingRow,
  type PostingFieldRow,
} from "@/lib/db/schema";
import { asc, eq } from "drizzle-orm";
import type { Field, FieldType, Posting } from "@/lib/postings";

function rowToField(r: PostingFieldRow): Field {
  return {
    name: r.name,
    label: r.label,
    type: r.type as FieldType,
    required: r.required,
    minLength: r.minLength ?? undefined,
    options: r.options ?? undefined,
    placeholder: r.placeholder ?? undefined,
    help: r.help ?? undefined,
    isName: r.isName,
  };
}

function toPosting(p: PostingRow, fields: PostingFieldRow[]): Posting {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    active: p.active,
    intro: p.intro,
    note: p.note,
    fields: fields
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(rowToField),
  };
}

/** slug から公開フォーム用の案件を取得 */
export async function getPostingBySlug(slug: string): Promise<Posting | null> {
  const rows = await db
    .select()
    .from(postings)
    .where(eq(postings.slug, slug))
    .limit(1);
  if (rows.length === 0) return null;
  const fields = await db
    .select()
    .from(postingFields)
    .where(eq(postingFields.postingId, rows[0].id));
  return toPosting(rows[0], fields);
}

/** 全案件（fields つき）。slug→Posting のマップ表示などに使う */
export async function getAllPostings(): Promise<Posting[]> {
  const pRows = await db
    .select()
    .from(postings)
    .orderBy(asc(postings.sortOrder), asc(postings.createdAt));
  const fRows = await db.select().from(postingFields);
  const byPosting = new Map<string, PostingFieldRow[]>();
  for (const f of fRows) {
    if (!byPosting.has(f.postingId)) byPosting.set(f.postingId, []);
    byPosting.get(f.postingId)!.push(f);
  }
  return pRows.map((p) => toPosting(p, byPosting.get(p.id) ?? []));
}

/** slug をキーにした案件マップ（管理一覧のラベル表示用） */
export async function getPostingsMap(): Promise<Record<string, Posting>> {
  const all = await getAllPostings();
  const map: Record<string, Posting> = {};
  for (const p of all) map[p.slug] = p;
  return map;
}

/** 編集用に生の行を取得 */
export async function getPostingRowsById(id: string): Promise<{
  posting: PostingRow;
  fields: PostingFieldRow[];
} | null> {
  const rows = await db
    .select()
    .from(postings)
    .where(eq(postings.id, id))
    .limit(1);
  if (rows.length === 0) return null;
  const fields = await db
    .select()
    .from(postingFields)
    .where(eq(postingFields.postingId, id))
    .orderBy(asc(postingFields.sortOrder));
  return { posting: rows[0], fields };
}

/** 案件一覧（メタのみ） */
export async function listPostingRows(): Promise<PostingRow[]> {
  return db
    .select()
    .from(postings)
    .orderBy(asc(postings.sortOrder), asc(postings.createdAt));
}
