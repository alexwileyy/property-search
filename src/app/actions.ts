"use server";

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

export type AddByUrlResult = { ok: true } | { ok: false; error: string };

export async function addPropertyByUrl(
  formData: FormData,
): Promise<AddByUrlResult> {
  const raw = formData.get("url");
  if (typeof raw !== "string" || !raw.trim()) {
    return { ok: false, error: "Paste a property URL first." };
  }

  let url: URL;
  try {
    url = new URL(raw.trim());
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
    await upsertParsedProperty(parsed);
  } catch (err) {
    return { ok: false, error: `Extraction failed: ${String(err)}` };
  }

  revalidatePath("/");
  return { ok: true };
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
    await upsertParsedProperty(parsed);
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
