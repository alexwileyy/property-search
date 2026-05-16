import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import { properties, type NewProperty, type Property } from "@/db/schema";
import type { ParsedProperty } from "./extraction";

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
    .orderBy(sql`${properties.createdAt} desc`);
}
