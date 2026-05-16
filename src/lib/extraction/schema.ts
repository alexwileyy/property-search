import { z } from "zod";

export const ImageSchema = z.object({
  url: z.string().describe("Direct URL to the photo. Must be an absolute URL."),
  caption: z
    .string()
    .nullable()
    .describe("Caption or room label, e.g. 'Lounge'. Null if absent."),
});

export const PropertyExtractionSchema = z.object({
  title: z
    .string()
    .nullable()
    .describe(
      "Short listing title, e.g. '3 bedroom semi-detached house for sale'. Null if not present.",
    ),
  addressLine: z
    .string()
    .nullable()
    .describe(
      "Displayed address line as a single string. Null if not present.",
    ),
  postcode: z
    .string()
    .nullable()
    .describe(
      "UK postcode. Use the full postcode (e.g. 'SW1A 1AA') if shown; otherwise the outward code alone (e.g. 'SW1A'). Null if absent.",
    ),
  latitude: z
    .number()
    .nullable()
    .describe("Latitude if shown on the page. Null if absent."),
  longitude: z
    .number()
    .nullable()
    .describe("Longitude if shown on the page. Null if absent."),
  price: z
    .number()
    .nullable()
    .describe(
      "Asking price as a plain number in GBP, with no currency symbol or commas. For 'POA' or unspecified, return null.",
    ),
  priceQualifier: z
    .string()
    .nullable()
    .describe(
      "Qualifier shown alongside the price, e.g. 'Offers in Excess of', 'Guide Price', 'OIRO'. Null if none.",
    ),
  bedrooms: z
    .number()
    .int()
    .nullable()
    .describe(
      "Bedroom count as an integer. Studios should be 0. Null if not shown.",
    ),
  bathrooms: z
    .number()
    .int()
    .nullable()
    .describe("Bathroom count as an integer. Null if not shown."),
  sqft: z
    .number()
    .int()
    .nullable()
    .describe(
      "Internal floor area in square feet. If a range is given, prefer the larger end. If only square metres are given, convert (1 sqm = 10.7639 sqft). Null if absent.",
    ),
  propertyType: z
    .string()
    .nullable()
    .describe(
      "Specific property type as shown, e.g. 'Terraced house', 'End of terrace', 'Flat', 'Semi-detached'. Null if absent.",
    ),
  tenure: z
    .string()
    .nullable()
    .describe(
      "Tenure as shown, typically 'Freehold', 'Leasehold', or 'Share of freehold'. Null if absent.",
    ),
  description: z
    .string()
    .nullable()
    .describe(
      "Full listing description verbatim. Preserve paragraph breaks with newlines. Null if absent.",
    ),
  images: z
    .array(ImageSchema)
    .describe(
      "All property photos from the listing in display order. Exclude floorplans, EPC charts, brochure thumbnails, and agent logos. Use direct image URLs, not page URLs. Return an empty array if none.",
    ),
  agentName: z
    .string()
    .nullable()
    .describe(
      "Estate agent or branch name as shown, e.g. 'Foxtons - Clapham'. Null if absent.",
    ),
  agentPhone: z
    .string()
    .nullable()
    .describe("Agent contact phone number as shown. Null if absent."),
  listedAt: z
    .string()
    .nullable()
    .describe(
      "Date the listing was added or last updated, as an ISO 8601 date string (YYYY-MM-DD). Null if absent.",
    ),
});

export type PropertyExtraction = z.infer<typeof PropertyExtractionSchema>;
