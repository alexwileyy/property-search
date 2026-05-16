import "server-only";
import { createHash } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { properties, type PropertyImage } from "@/db/schema";
import { getProperty } from "./properties";

const BUCKET = "property-photos";
const CONCURRENCY = 5;
const PER_IMAGE_TIMEOUT_MS = 15_000;

const REALISTIC_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15";

let cachedClient: SupabaseClient | null = null;

function getSecretKey(): string | undefined {
  // SUPABASE_SECRET_KEY is the current Supabase secret-key name (sb_secret_...).
  // Fall back to SUPABASE_SERVICE_ROLE_KEY for projects still on the legacy
  // JWT service_role key.
  return process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
}

function getStorageClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;
  const url = process.env.SUPABASE_URL;
  const key = getSecretKey();
  if (!url || !key) return null;
  cachedClient = createClient(url, key, { auth: { persistSession: false } });
  return cachedClient;
}

export function isStorageConfigured(): boolean {
  return !!process.env.SUPABASE_URL && !!getSecretKey();
}

function isArchived(img: PropertyImage): boolean {
  return typeof img.sourceUrl === "string" && img.sourceUrl.length > 0;
}

function extractMimeAndExt(
  url: string,
  contentType: string | null,
): { mime: string; ext: string } {
  if (contentType && contentType.toLowerCase().startsWith("image/")) {
    const mime = contentType.split(";")[0].trim().toLowerCase();
    const subtype = mime.split("/")[1].split("+")[0];
    const ext = subtype === "jpeg" ? "jpg" : subtype;
    return { mime, ext };
  }
  const match = url.match(/\.([a-zA-Z0-9]{2,5})(?:\?|#|$)/);
  if (match) {
    const ext = match[1].toLowerCase() === "jpeg" ? "jpg" : match[1].toLowerCase();
    const mime = `image/${ext === "jpg" ? "jpeg" : ext}`;
    return { ext, mime };
  }
  return { ext: "jpg", mime: "image/jpeg" };
}

async function fetchWithTimeout(url: string, ms: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, {
      headers: {
        "User-Agent": REALISTIC_UA,
        Accept: "image/*,*/*;q=0.8",
      },
      redirect: "follow",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function archiveOne(
  client: SupabaseClient,
  propertyId: string,
  img: PropertyImage,
): Promise<PropertyImage> {
  if (isArchived(img)) return img;
  try {
    const res = await fetchWithTimeout(img.url, PER_IMAGE_TIMEOUT_MS);
    if (!res.ok) return img;
    const buffer = await res.arrayBuffer();
    if (buffer.byteLength === 0) return img;

    const { mime, ext } = extractMimeAndExt(img.url, res.headers.get("content-type"));
    const hash = createHash("sha256").update(img.url).digest("hex").slice(0, 16);
    const path = `${propertyId}/${hash}.${ext}`;

    const { error } = await client.storage.from(BUCKET).upload(path, buffer, {
      contentType: mime,
      upsert: true,
      cacheControl: "31536000",
    });
    if (error) {
      console.warn(`[archive] upload failed for ${img.url}:`, error.message);
      return img;
    }

    const { data } = client.storage.from(BUCKET).getPublicUrl(path);
    return { ...img, sourceUrl: img.url, url: data.publicUrl };
  } catch (err) {
    console.warn(`[archive] error for ${img.url}:`, err);
    return img;
  }
}

export type ArchiveOutcome = {
  attempted: number;
  archived: number;
  remaining: number;
};

export async function archivePropertyPhotos(
  propertyId: string,
): Promise<ArchiveOutcome | null> {
  const client = getStorageClient();
  if (!client) return null;

  const property = await getProperty(propertyId);
  if (!property) return null;

  const toArchive = property.images.filter((img) => !isArchived(img));
  if (toArchive.length === 0) {
    return { attempted: 0, archived: 0, remaining: 0 };
  }

  const archivedBySourceUrl = new Map<string, PropertyImage>();
  for (let i = 0; i < toArchive.length; i += CONCURRENCY) {
    const batch = toArchive.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map((img) => archiveOne(client, propertyId, img)),
    );
    for (const result of results) {
      if (result.sourceUrl) archivedBySourceUrl.set(result.sourceUrl, result);
    }
  }

  if (archivedBySourceUrl.size > 0) {
    await db.transaction(async (tx) => {
      const [current] = await tx
        .select({ images: properties.images })
        .from(properties)
        .where(eq(properties.id, propertyId));
      if (!current) return;
      const merged = current.images.map(
        (img) => archivedBySourceUrl.get(img.url) ?? img,
      );
      await tx
        .update(properties)
        .set({ images: merged })
        .where(eq(properties.id, propertyId));
    });
  }

  return {
    attempted: toArchive.length,
    archived: archivedBySourceUrl.size,
    remaining: toArchive.length - archivedBySourceUrl.size,
  };
}

export function imagesArchivedCount(images: PropertyImage[]): number {
  return images.filter(isArchived).length;
}
