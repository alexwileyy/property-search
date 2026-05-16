CREATE TYPE "public"."property_source" AS ENUM('rightmove', 'zoopla', 'other');--> statement-breakpoint
CREATE TYPE "public"."property_status" AS ENUM('interested', 'viewing_booked', 'viewing_attended', 'second_viewing_booked', 'second_viewing_attended', 'offer_made', 'rejected');--> statement-breakpoint
CREATE TABLE "properties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"url" text NOT NULL,
	"source" "property_source" NOT NULL,
	"external_id" text,
	"title" text,
	"address_line" text,
	"postcode" text,
	"latitude" double precision,
	"longitude" double precision,
	"price" numeric(12, 2),
	"price_qualifier" text,
	"bedrooms" integer,
	"bathrooms" integer,
	"sqft" integer,
	"property_type" text,
	"tenure" text,
	"description" text,
	"images" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"agent_name" text,
	"agent_phone" text,
	"listed_at" timestamp with time zone,
	"status" "property_status" DEFAULT 'interested' NOT NULL,
	"board_position" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"last_scraped_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "properties_url_unique" UNIQUE("url")
);
--> statement-breakpoint
CREATE TABLE "status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"from_status" "property_status",
	"to_status" "property_status" NOT NULL,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "status_history" ADD CONSTRAINT "status_history_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "properties_status_position_idx" ON "properties" USING btree ("status","board_position");--> statement-breakpoint
CREATE INDEX "status_history_property_idx" ON "status_history" USING btree ("property_id");