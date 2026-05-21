import "server-only";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import {
  properties,
  statusHistory,
  type NewProperty,
  type Property,
  type PropertyStatus,
} from "@/db/schema";
import type { ParsedProperty } from "./extraction";
import type { Board } from "./status";

function emptyBoard(): Board {
  return {
    interested: [],
    enquired: [],
    viewing_booked: [],
    viewing_attended: [],
    second_viewing_booked: [],
    second_viewing_attended: [],
    offer_made: [],
    rejected: [],
  };
}

function toInsert(parsed: ParsedProperty): NewProperty {
  return {
    url: parsed.url,
    source: parsed.source,
    externalId: parsed.externalId,
    title: parsed.title,
    addressLine: parsed.addressLine,
    postcode: parsed.postcode,
    latitude: parsed.latitude,
    longitude: parsed.longitude,
    price: parsed.price,
    priceQualifier: parsed.priceQualifier,
    bedrooms: parsed.bedrooms,
    bathrooms: parsed.bathrooms,
    sqft: parsed.sqft,
    propertyType: parsed.propertyType,
    tenure: parsed.tenure,
    description: parsed.description,
    images: parsed.images,
    agentName: parsed.agentName,
    agentPhone: parsed.agentPhone,
    listedAt: parsed.listedAt,
    lastScrapedAt: new Date(),
  };
}

export async function upsertParsedProperty(
  parsed: ParsedProperty,
): Promise<Property> {
  const insert = toInsert(parsed);

  const [row] = await db
    .insert(properties)
    .values(insert)
    .onConflictDoUpdate({
      target: properties.url,
      set: {
        externalId: insert.externalId,
        title: insert.title,
        addressLine: insert.addressLine,
        postcode: insert.postcode,
        latitude: insert.latitude,
        longitude: insert.longitude,
        price: insert.price,
        priceQualifier: insert.priceQualifier,
        bedrooms: insert.bedrooms,
        bathrooms: insert.bathrooms,
        sqft: insert.sqft,
        propertyType: insert.propertyType,
        tenure: insert.tenure,
        description: insert.description,
        images: insert.images,
        agentName: insert.agentName,
        agentPhone: insert.agentPhone,
        listedAt: insert.listedAt,
        lastScrapedAt: insert.lastScrapedAt,
        updatedAt: sql`now()`,
      },
    })
    .returning();

  return row;
}

export async function listProperties(): Promise<Property[]> {
  return db
    .select()
    .from(properties)
    .orderBy(sql`${properties.updatedAt} desc`);
}

export async function getBoard(): Promise<Board> {
  const rows = await listProperties();
  const board = emptyBoard();
  for (const row of rows) {
    board[row.status].push(row);
  }
  return board;
}

export async function getProperty(id: string): Promise<Property | null> {
  const [row] = await db
    .select()
    .from(properties)
    .where(eq(properties.id, id));
  return row ?? null;
}

export async function updateNotes(
  id: string,
  notes: string | null,
): Promise<void> {
  await db
    .update(properties)
    .set({ notes, updatedAt: sql`now()` })
    .where(eq(properties.id, id));
}

export async function deleteProperty(id: string): Promise<void> {
  await db.delete(properties).where(eq(properties.id, id));
}

export async function setFeatureImage(
  id: string,
  imageUrl: string,
): Promise<void> {
  const property = await getProperty(id);
  if (!property) throw new Error("Property not found");
  const idx = property.images.findIndex((img) => img.url === imageUrl);
  if (idx <= 0) return;
  const reordered = [
    property.images[idx],
    ...property.images.slice(0, idx),
    ...property.images.slice(idx + 1),
  ];
  await db
    .update(properties)
    .set({ images: reordered, updatedAt: sql`now()` })
    .where(eq(properties.id, id));
}

export async function moveProperty(
  propertyId: string,
  toStatus: PropertyStatus,
): Promise<Property> {
  return db.transaction(async (tx) => {
    const [current] = await tx
      .select({ status: properties.status })
      .from(properties)
      .where(eq(properties.id, propertyId));

    if (!current) {
      throw new Error("Property not found");
    }

    if (current.status === toStatus) {
      const [unchanged] = await tx
        .select()
        .from(properties)
        .where(eq(properties.id, propertyId));
      return unchanged;
    }

    const [updated] = await tx
      .update(properties)
      .set({ status: toStatus, updatedAt: sql`now()` })
      .where(eq(properties.id, propertyId))
      .returning();

    await tx.insert(statusHistory).values({
      propertyId,
      fromStatus: current.status,
      toStatus,
    });

    return updated;
  });
}
