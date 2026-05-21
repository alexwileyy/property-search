"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { extractPropertyFromHtml } from "@/lib/extraction";
import {
  deleteProperty,
  getProperty,
  moveProperty,
  setFeatureImage,
  updateNotes,
  upsertParsedProperty,
} from "@/lib/properties";
import type { PropertyStatus } from "@/db/schema";
import { canServerFetch, detectSource } from "@/lib/source";
import { archivePropertyPhotos } from "@/lib/storage";

function scheduleArchive(propertyId: string) {
  after(async () => {
    try {
      await archivePropertyPhotos(propertyId);
    } catch (err) {
      console.warn(`[archive] background failed for ${propertyId}:`, err);
    }
  });
}

const REALISTIC_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15";

async function fetchPropertyHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": REALISTIC_UA,
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-GB,en;q=0.9",
    },
    redirect: "follow",
  });
  if (!res.ok) {
    throw new Error(`Upstream returned ${res.status} ${res.statusText}`);
  }
  return res.text();
}

export type AddByUrlResult = {
  imported: number;
  errors: { url: string; error: string }[];
};

async function importSingleUrl(
  rawUrl: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return { ok: false, error: "That doesn't look like a valid URL." };
  }

  const source = detectSource(url.toString());
  if (!source) {
    return { ok: false, error: "That doesn't look like a valid URL." };
  }

  if (!canServerFetch(source)) {
    return {
      ok: false,
      error: `${source} blocks server-side scraping. Open the listing in your browser and tap the bookmarklet (install it from Settings).`,
    };
  }

  let html: string;
  try {
    html = await fetchPropertyHtml(url.toString());
  } catch (err) {
    return { ok: false, error: `Listing fetch failed: ${String(err)}` };
  }

  try {
    const parsed = await extractPropertyFromHtml(html, url.toString(), source);
    const saved = await upsertParsedProperty(parsed);
    scheduleArchive(saved.id);
  } catch (err) {
    return { ok: false, error: `Extraction failed: ${String(err)}` };
  }

  return { ok: true };
}

export async function addPropertyByUrl(
  formData: FormData,
): Promise<AddByUrlResult> {
  const raw = formData.get("url");
  if (typeof raw !== "string" || !raw.trim()) {
    return {
      imported: 0,
      errors: [{ url: "", error: "Paste a property URL first." }],
    };
  }

  const urls = raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (urls.length === 0) {
    return {
      imported: 0,
      errors: [{ url: "", error: "Paste a property URL first." }],
    };
  }

  const outcomes = await Promise.all(
    urls.map(async (u) => ({ url: u, result: await importSingleUrl(u) })),
  );

  const errors = outcomes
    .filter((o) => !o.result.ok)
    .map((o) => ({
      url: o.url,
      error: (o.result as { ok: false; error: string }).error,
    }));
  const imported = outcomes.length - errors.length;

  if (imported > 0) {
    revalidatePath("/");
  }

  return { imported, errors };
}

export type MoveResult = { ok: true } | { ok: false; error: string };

export async function movePropertyAction(
  propertyId: string,
  toStatus: PropertyStatus,
): Promise<MoveResult> {
  try {
    await moveProperty(propertyId, toStatus);
  } catch (err) {
    return { ok: false, error: `Move failed: ${String(err)}` };
  }
  revalidatePath("/");
  return { ok: true };
}

export type SimpleResult = { ok: true } | { ok: false; error: string };

export async function saveNotesAction(
  propertyId: string,
  notes: string,
): Promise<SimpleResult> {
  try {
    const trimmed = notes.trim();
    await updateNotes(propertyId, trimmed.length === 0 ? null : trimmed);
  } catch (err) {
    return { ok: false, error: `Save failed: ${String(err)}` };
  }
  revalidatePath(`/property/${propertyId}`);
  return { ok: true };
}

export async function rescrapePropertyAction(
  propertyId: string,
): Promise<SimpleResult> {
  const property = await getProperty(propertyId);
  if (!property) return { ok: false, error: "Property not found." };

  if (!canServerFetch(property.source)) {
    return {
      ok: false,
      error: `${property.source} blocks server-side scraping. Open the listing in your browser and tap the bookmarklet to refresh.`,
    };
  }

  let html: string;
  try {
    html = await fetchPropertyHtml(property.url);
  } catch (err) {
    return { ok: false, error: `Listing fetch failed: ${String(err)}` };
  }

  try {
    const parsed = await extractPropertyFromHtml(
      html,
      property.url,
      property.source,
    );
    const saved = await upsertParsedProperty(parsed);
    scheduleArchive(saved.id);
  } catch (err) {
    return { ok: false, error: `Extraction failed: ${String(err)}` };
  }

  revalidatePath(`/property/${propertyId}`);
  revalidatePath("/");
  return { ok: true };
}

export async function deletePropertyAction(propertyId: string): Promise<void> {
  await deleteProperty(propertyId);
  revalidatePath("/");
  redirect("/");
}

export async function setFeatureImageAction(
  propertyId: string,
  imageUrl: string,
): Promise<SimpleResult> {
  try {
    await setFeatureImage(propertyId, imageUrl);
  } catch (err) {
    return { ok: false, error: `Set cover failed: ${String(err)}` };
  }
  revalidatePath(`/property/${propertyId}`);
  revalidatePath("/");
  return { ok: true };
}

export type ArchiveResult =
  | { ok: true; attempted: number; archived: number; remaining: number }
  | { ok: false; error: string };

export async function archivePhotosAction(
  propertyId: string,
): Promise<ArchiveResult> {
  try {
    const outcome = await archivePropertyPhotos(propertyId);
    if (!outcome) {
      return {
        ok: false,
        error:
          "Supabase Storage isn't configured. Set SUPABASE_URL and SUPABASE_SECRET_KEY (sb_secret_...) in .env.local.",
      };
    }
    revalidatePath(`/property/${propertyId}`);
    revalidatePath("/");
    return { ok: true, ...outcome };
  } catch (err) {
    return { ok: false, error: `Archive failed: ${String(err)}` };
  }
}
