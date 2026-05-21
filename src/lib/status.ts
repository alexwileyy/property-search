import type { Property, PropertyStatus } from "@/db/schema";

export const STATUS_ORDER: PropertyStatus[] = [
  "interested",
  "enquired",
  "viewing_booked",
  "viewing_attended",
  "second_viewing_booked",
  "second_viewing_attended",
  "offer_made",
  "rejected",
];

export const STATUS_LABELS: Record<PropertyStatus, string> = {
  interested: "Interested",
  enquired: "Enquired",
  viewing_booked: "Viewing booked",
  viewing_attended: "Viewing attended",
  second_viewing_booked: "2nd viewing booked",
  second_viewing_attended: "2nd viewing attended",
  offer_made: "Offer made",
  rejected: "Rejected",
};

export type Board = Record<PropertyStatus, Property[]>;
