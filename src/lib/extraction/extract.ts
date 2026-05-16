import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { PropertyImage, PropertySource } from "@/db/schema";
import type { ParsedProperty } from "./types";
import { PropertyExtractionSchema, type PropertyExtraction } from "./schema";
import {
  extractImageCandidates,
  htmlToMarkdown,
  truncateForLLM,
  type ImageCandidate,
} from "./clean-html";

const SYSTEM_PROMPT = `You extract structured data from UK property listing pages.

You will receive:
- The listing URL
- A pre-extracted list of candidate image URLs found in the page HTML (with alt text where available). Many sites lazy-load images, so this list is more reliable than the markdown for finding photos.
- The visible page content as markdown

Return JSON matching the provided schema. Rules:

- Extract values verbatim where possible; do not paraphrase the description.
- For numeric fields (price, bedrooms, bathrooms, sqft), return plain numbers with no units, currency symbols, or commas.
- For studios, set bedrooms to 0.
- If a field is missing, unclear, or only partially available, set it to null. Do not guess.
- For images, select from the candidate URL list. Include only property photographs (the gallery/carousel). Exclude floorplans, EPC charts, brochure thumbnails, agent or brand logos, sponsored content, map tiles, icons, avatars, and decorative/UI graphics. If multiple resolutions of the same photo are listed (e.g. srcset variants), pick the largest. Preserve the listing's display order where it's clear from the markdown.
- For captions, use the alt text shown next to the URL if it describes a room or view (e.g. "Lounge", "Kitchen"). Set to null if the alt is empty, generic, or unrelated.
- For listedAt, return an ISO 8601 date (YYYY-MM-DD). If only relative text ("Added yesterday") is shown, return null.
- The description should be the full marketing copy as a single string with paragraph breaks preserved as newlines.`;

function formatImageCandidates(candidates: ImageCandidate[]): string {
  if (candidates.length === 0) return "(none found in HTML)";
  return candidates
    .map((c) => (c.alt ? `- ${c.url}  alt: "${c.alt}"` : `- ${c.url}`))
    .join("\n");
}

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }
  return new Anthropic({ apiKey });
}

export async function extractPropertyFromHtml(
  html: string,
  url: string,
  source: PropertySource,
): Promise<ParsedProperty> {
  const imageCandidates = extractImageCandidates(html);
  const markdown = truncateForLLM(htmlToMarkdown(html));
  const client = getClient();

  const userContent = [
    `URL: ${url}`,
    "",
    "--- IMAGE CANDIDATES ---",
    formatImageCandidates(imageCandidates),
    "",
    "--- PAGE CONTENT ---",
    "",
    markdown,
  ].join("\n");

  const response = await client.messages.parse({
    model: "claude-haiku-4-5",
    max_tokens: 16000,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userContent }],
    output_config: {
      format: zodOutputFormat(PropertyExtractionSchema),
    },
  });

  if (!response.parsed_output) {
    throw new Error(
      `Extraction did not return structured output. Stop reason: ${response.stop_reason}`,
    );
  }

  return toParsedProperty(response.parsed_output, url, source);
}

function toParsedProperty(
  extracted: PropertyExtraction,
  url: string,
  source: PropertySource,
): ParsedProperty {
  const images: PropertyImage[] = extracted.images
    .filter((img) => img.url && /^https?:\/\//i.test(img.url))
    .map((img) => ({
      url: img.url,
      caption: img.caption ?? undefined,
    }));

  return {
    source,
    url,
    title: extracted.title ?? undefined,
    addressLine: extracted.addressLine ?? undefined,
    postcode: extracted.postcode ?? undefined,
    latitude: extracted.latitude ?? undefined,
    longitude: extracted.longitude ?? undefined,
    price:
      extracted.price !== null && Number.isFinite(extracted.price)
        ? extracted.price.toFixed(2)
        : undefined,
    priceQualifier: extracted.priceQualifier ?? undefined,
    bedrooms: extracted.bedrooms ?? undefined,
    bathrooms: extracted.bathrooms ?? undefined,
    sqft: extracted.sqft ?? undefined,
    propertyType: extracted.propertyType ?? undefined,
    tenure: extracted.tenure ?? undefined,
    description: extracted.description ?? undefined,
    images,
    agentName: extracted.agentName ?? undefined,
    agentPhone: extracted.agentPhone ?? undefined,
    listedAt: parseDate(extracted.listedAt),
  };
}

function parseDate(raw: string | null): Date | undefined {
  if (!raw) return undefined;
  const d = new Date(raw);
  return Number.isFinite(d.getTime()) ? d : undefined;
}
