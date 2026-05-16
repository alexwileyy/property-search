import type { PropertyImage, PropertySource } from "@/db/schema";

export type ParsedProperty = {
  source: PropertySource;
  url: string;
  externalId?: string;
  title?: string;
  addressLine?: string;
  postcode?: string;
  latitude?: number;
  longitude?: number;
  price?: string;
  priceQualifier?: string;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  propertyType?: string;
  tenure?: string;
  description?: string;
  images: PropertyImage[];
  agentName?: string;
  agentPhone?: string;
  listedAt?: Date;
};
