import "dotenv/config";
import { db } from "../lib/db";
import { postings, postingFields } from "../lib/db/schema";
import { DEFAULT_POSTINGS } from "../lib/postings";

async function main() {
  const existing = await db.select().from(postings).limit(1);
  if (existing.length > 0) {
    console.log("postings は既に存在します。シードをスキップしました。");
    return;
  }

  let order = 1;
  for (const p of DEFAULT_POSTINGS) {
    const [row] = await db
      .insert(postings)
      .values({
        slug: p.slug,
        title: p.title,
        active: p.active,
        intro: p.intro ?? null,
        note: p.note ?? null,
        sortOrder: order++,
      })
      .returning({ id: postings.id });

    let fieldOrder = 1;
    for (const f of p.fields) {
      await db.insert(postingFields).values({
        postingId: row.id,
        name: f.name,
        label: f.label,
        type: f.type,
        required: f.required ?? false,
        minLength: f.minLength ?? null,
        options: f.options ?? null,
        placeholder: f.placeholder ?? null,
        help: f.help ?? null,
        isName: f.isName ?? false,
        sortOrder: fieldOrder++,
      });
    }
    console.log(`seeded: ${p.slug}（項目 ${p.fields.length} 件）`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
