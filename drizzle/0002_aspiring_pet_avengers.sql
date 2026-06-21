CREATE TABLE "posting_notes" (
	"slug" text PRIMARY KEY NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
