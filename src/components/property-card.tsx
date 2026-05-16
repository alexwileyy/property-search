import {
  Badge,
  Card,
  Flex,
  Heading,
  Inset,
  Link,
  Text,
} from "@radix-ui/themes";
import type { Property } from "@/db/schema";

const statusLabels: Record<Property["status"], string> = {
  interested: "Interested",
  viewing_booked: "Viewing booked",
  viewing_attended: "Viewing attended",
  second_viewing_booked: "2nd viewing booked",
  second_viewing_attended: "2nd viewing attended",
  offer_made: "Offer made",
  rejected: "Rejected",
};

const sourceLabels: Record<Property["source"], string> = {
  rightmove: "RightMove",
  zoopla: "Zoopla",
  other: "Other",
};

function formatPrice(price: string | null, qualifier: string | null): string {
  if (!price) return "Price n/a";
  const n = Number(price);
  if (!Number.isFinite(n)) return price;
  const formatted = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(n);
  return qualifier ? `${formatted} - ${qualifier}` : formatted;
}

export function PropertyCard({ property }: { property: Property }) {
  const cover = property.images[0]?.url;

  return (
    <Card size="2" asChild>
      <Link href={property.url} target="_blank" rel="noopener noreferrer" underline="none">
        <Flex direction="column" gap="3">
          {cover ? (
            <Inset side="top" pb="current">
              <img
                src={cover}
                alt={property.title ?? property.addressLine ?? "Property"}
                style={{
                  display: "block",
                  width: "100%",
                  aspectRatio: "4 / 3",
                  objectFit: "cover",
                  background: "var(--gray-3)",
                }}
              />
            </Inset>
          ) : null}

          <Flex direction="column" gap="2">
            <Flex justify="between" align="start" gap="3">
              <Heading size="4" weight="medium" style={{ flex: 1 }}>
                {formatPrice(property.price, property.priceQualifier)}
              </Heading>
              <Badge color="crimson" variant="soft" radius="full">
                {statusLabels[property.status]}
              </Badge>
            </Flex>

            <Text size="2" color="gray">
              {property.addressLine ?? "Address unknown"}
            </Text>

            <Flex gap="3" wrap="wrap">
              {property.bedrooms != null ? (
                <Text size="1" color="gray">
                  {property.bedrooms} bed
                </Text>
              ) : null}
              {property.bathrooms != null ? (
                <Text size="1" color="gray">
                  {property.bathrooms} bath
                </Text>
              ) : null}
              {property.sqft != null ? (
                <Text size="1" color="gray">
                  {property.sqft.toLocaleString()} sqft
                </Text>
              ) : null}
              {property.propertyType ? (
                <Text size="1" color="gray">
                  {property.propertyType}
                </Text>
              ) : null}
            </Flex>

            <Text size="1" color="gray">
              {sourceLabels[property.source]}
            </Text>
          </Flex>
        </Flex>
      </Link>
    </Card>
  );
}
