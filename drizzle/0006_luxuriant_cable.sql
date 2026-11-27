CREATE TABLE "analytics_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"ts" timestamp with time zone DEFAULT now() NOT NULL,
	"vid" text DEFAULT '' NOT NULL,
	"sid" text DEFAULT '' NOT NULL,
	"pvid" text DEFAULT '' NOT NULL,
	"type" text NOT NULL,
	"path" text DEFAULT '' NOT NULL,
	"label" text DEFAULT '' NOT NULL,
	"href" text DEFAULT '' NOT NULL,
	"outbound" boolean DEFAULT false NOT NULL,
	"user_id" text,
	"country" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_pageviews" (
	"pvid" text PRIMARY KEY NOT NULL,
	"ts" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen" timestamp with time zone DEFAULT now() NOT NULL,
	"vid" text NOT NULL,
	"sid" text NOT NULL,
	"user_id" text,
	"path" text NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"referrer" text DEFAULT '' NOT NULL,
	"ref_host" text DEFAULT '' NOT NULL,
	"ref_source" text DEFAULT 'direct' NOT NULL,
	"utm_source" text DEFAULT '' NOT NULL,
	"utm_medium" text DEFAULT '' NOT NULL,
	"utm_campaign" text DEFAULT '' NOT NULL,
	"country" text DEFAULT 'XX' NOT NULL,
	"region" text DEFAULT '' NOT NULL,
	"city" text DEFAULT '' NOT NULL,
	"ip_masked" text DEFAULT '' NOT NULL,
	"ip_hash" text DEFAULT '' NOT NULL,
	"device" text DEFAULT 'desktop' NOT NULL,
	"browser" text DEFAULT '' NOT NULL,
	"os" text DEFAULT '' NOT NULL,
	"screen_w" integer DEFAULT 0 NOT NULL,
	"lang" text DEFAULT '' NOT NULL,
	"is_entry" boolean DEFAULT false NOT NULL,
	"duration_s" integer DEFAULT 0 NOT NULL,
	"max_scroll" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX "ev_ts_idx" ON "analytics_events" USING btree ("ts");--> statement-breakpoint
CREATE INDEX "ev_type_idx" ON "analytics_events" USING btree ("type");--> statement-breakpoint
CREATE INDEX "pv_ts_idx" ON "analytics_pageviews" USING btree ("ts");--> statement-breakpoint
CREATE INDEX "pv_vid_idx" ON "analytics_pageviews" USING btree ("vid");--> statement-breakpoint
CREATE INDEX "pv_sid_idx" ON "analytics_pageviews" USING btree ("sid");--> statement-breakpoint
CREATE INDEX "pv_last_seen_idx" ON "analytics_pageviews" USING btree ("last_seen");