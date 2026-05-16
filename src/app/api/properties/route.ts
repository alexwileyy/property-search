import { after, NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { extractPropertyFromHtml } from "@/lib/extraction";
import { upsertParsedProperty } from "@/lib/properties";
import { canServerFetch, detectSource } from "@/lib/source";
import { archivePropertyPhotos } from "@/lib/storage";

export const maxDuration = 60;

const BodySchema = z.object({
  url: z.string().url(),
  html: z.string().optional(),
});

const REALISTIC_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Max-Age": "86400",
} as const;

function corsJson(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: { ...CORS_HEADERS, ...(init?.headers ?? {}) },
  });
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

async function fetchHtml(url: string): Promise<string> {
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

export async function POST(req: NextRequest) {
  let body: z.infer<typeof BodySchema>;
  try {
    const json = await req.json();
    body = BodySchema.parse(json);
  } catch (err) {
    return corsJson(
      { error: "Invalid request body", detail: String(err) },
      { status: 400 },
    );
  }

  const source = detectSource(body.url);
  if (!source) {
    return corsJson({ error: "Invalid URL" }, { status: 400 });
  }

  if (!body.html && !canServerFetch(source)) {
    return corsJson(
      {
        error: `${source} blocks server-side scraping. Use the bookmarklet from Settings to save from a page your browser has already loaded.`,
      },
      { status: 400 },
    );
  }

  let html: string;
  try {
    html = body.html ?? (await fetchHtml(body.url));
  } catch (err) {
    return corsJson(
      { error: "Failed to fetch listing page", detail: String(err) },
      { status: 502 },
    );
  }

  let parsed;
  try {
    parsed = await extractPropertyFromHtml(html, body.url, source);
  } catch (err) {
    return corsJson(
      { error: "Extraction failed", detail: String(err) },
      { status: 422 },
    );
  }

  const saved = await upsertParsedProperty(parsed);

  after(async () => {
    try {
      await archivePropertyPhotos(saved.id);
    } catch (err) {
      console.warn(`[archive] background failed for ${saved.id}:`, err);
    }
  });

  return corsJson({ property: saved }, { status: 200 });
}
