import {
  pgEnum,
  pgTable,
  text,
  integer,
  numeric,
  jsonb,
  uuid,
  timestamp,
  doublePrecision,
  index,
} from "drizzle-orm/pg-core";

export const propertyStatus = pgEnum("property_status", [
  "interested",
  "viewing_booked",
  "viewing_attended",
  "second_viewing_booked",
  "second_viewing_attended",
  "offer_made",
  "rejected",
]);

export const propertySource = pgEnum("property_source", [
  "rightmove",
  "zoopla",
  "other",
]);

export type PropertyStatus = (typeof propertyStatus.enumValues)[number];
export type PropertySource = (typeof propertySource.enumValues)[number];

export type PropertyImage = {
  /** The URL to display. Points to the archived copy when sourceUrl is set, otherwise the original. */
  url: string;
  /** Original source URL. Set after the image has been mirrored to our own storage. */
  sourceUrl?: string;
  caption?: string;
};

export const properties = pgTable(
  "properties",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    url: text("url").notNull().unique(),
    source: propertySource("source").notNull(),
    externalId: text("external_id"),

    title: text("title"),
    addressLine: text("address_line"),
    postcode: text("postcode"),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),

    price: numeric("price", { precision: 12, scale: 2 }),
    priceQualifier: text("price_qualifier"),
    bedrooms: integer("bedrooms"),
    bathrooms: integer("bathrooms"),
    sqft: integer("sqft"),
    propertyType: text("property_type"),
    tenure: text("tenure"),
    description: text("description"),

    images: jsonb("images").$type<PropertyImage[]>().default([]).notNull(),

    agentName: text("agent_name"),
    agentPhone: text("agent_phone"),

    listedAt: timestamp("listed_at", { withTimezone: true }),

    status: propertyStatus("status").notNull().default("interested"),
    boardPosition: integer("board_position").notNull().default(0),

    notes: text("notes"),

    lastScrapedAt: timestamp("last_scraped_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("properties_status_position_idx").on(
      table.status,
      table.boardPosition,
    ),
  ],
);

export const statusHistory = pgTable(
  "status_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    fromStatus: propertyStatus("from_status"),
    toStatus: propertyStatus("to_status").notNull(),
    changedAt: timestamp("changed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("status_history_property_idx").on(table.propertyId)],
);

export type Property = typeof properties.$inferSelect;
export type NewProperty = typeof properties.$inferInsert;
