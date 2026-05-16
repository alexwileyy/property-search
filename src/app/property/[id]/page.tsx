import { notFound } from "next/navigation";
import NextLink from "next/link";
import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Separator,
  Text,
} from "@radix-ui/themes";
import {
  ArrowLeft,
  Bath,
  BedDouble,
  Building2,
  ExternalLink,
  MapPin,
  Phone,
  Ruler,
  ScrollText,
  Tag,
} from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { PhotoCarousel } from "@/components/photo-carousel";
import { NotesEditor } from "@/components/notes-editor";
import { PropertyActions } from "@/components/property-actions";
import PropertyMap from "@/components/property-map-wrapper";
import { getProperty } from "@/lib/properties";
import { STATUS_LABELS } from "@/lib/status";
import type { Property } from "@/db/schema";

export const dynamic = "force-dynamic";

function formatPrice(
  price: string | null,
  qualifier: string | null,
): string {
  if (!price) return "Price n/a";
  const n = Number(price);
  if (!Number.isFinite(n)) return price;
  const formatted = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(n);
  return qualifier ? `${formatted} ${qualifier.toLowerCase()}` : formatted;
}

function SpecChip({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Flex
      align="center"
      gap="2"
      style={{
        padding: "6px 12px",
        background: "var(--gray-2)",
        borderRadius: 999,
        fontSize: 13,
        color: "var(--gray-12)",
      }}
    >
      <span style={{ display: "inline-flex", color: "var(--gray-11)" }}>
        {icon}
      </span>
      {label}
    </Flex>
  );
}

function Specs({ property }: { property: Property }) {
  const chips: { icon: React.ReactNode; label: string }[] = [];
  if (property.bedrooms != null)
    chips.push({
      icon: <BedDouble size={14} />,
      label: `${property.bedrooms} bed`,
    });
  if (property.bathrooms != null)
    chips.push({
      icon: <Bath size={14} />,
      label: `${property.bathrooms} bath`,
    });
  if (property.sqft != null)
    chips.push({
      icon: <Ruler size={14} />,
      label: `${property.sqft.toLocaleString()} sqft`,
    });
  if (property.propertyType)
    chips.push({
      icon: <Building2 size={14} />,
      label: property.propertyType,
    });
  if (property.tenure)
    chips.push({ icon: <Tag size={14} />, label: property.tenure });

  if (chips.length === 0) return null;

  return (
    <Flex gap="2" wrap="wrap">
      {chips.map((c, i) => (
        <SpecChip key={i} icon={c.icon} label={c.label} />
      ))}
    </Flex>
  );
}

const SOURCE_LABELS: Record<Property["source"], string> = {
  rightmove: "RightMove",
  zoopla: "Zoopla",
  other: "Other",
};

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = await getProperty(id);
  if (!property) notFound();

  const hasCoords =
    property.latitude != null && property.longitude != null;
  const mapLabel =
    property.addressLine ?? property.postcode ?? undefined;

  return (
    <Box>
      <AppHeader />
      <Separator size="4" />

      <Container size="4" px="4" py="5">
        <Flex direction="column" gap="5">
          <Box>
            <Button asChild variant="ghost" color="gray" size="2">
              <NextLink href="/">
                <ArrowLeft size={16} />
                Back to board
              </NextLink>
            </Button>
          </Box>

          <PhotoCarousel images={property.images} propertyId={property.id} />

          <Flex direction="column" gap="3">
            <Flex justify="between" align="start" gap="3" wrap="wrap">
              <Box style={{ flex: 1, minWidth: 0 }}>
                <Heading size="7" weight="bold">
                  {formatPrice(property.price, property.priceQualifier)}
                </Heading>
                {property.addressLine ? (
                  <Text size="3" color="gray" as="p" mt="1">
                    {property.addressLine}
                  </Text>
                ) : null}
              </Box>
              <Flex direction="column" align="end" gap="2">
                <Badge color="crimson" variant="soft" radius="full" size="2">
                  {STATUS_LABELS[property.status]}
                </Badge>
                <Text size="1" color="gray">
                  {SOURCE_LABELS[property.source]}
                </Text>
              </Flex>
            </Flex>

            <Specs property={property} />

            <Flex gap="3" wrap="wrap" align="center">
              <Button asChild variant="soft" size="2">
                <a
                  href={property.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink size={14} />
                  View original listing
                </a>
              </Button>
              {property.agentName ? (
                <Text size="2" color="gray">
                  Listed by {property.agentName}
                </Text>
              ) : null}
              {property.agentPhone ? (
                <Flex align="center" gap="1">
                  <Phone size={12} color="var(--gray-11)" />
                  <Text size="2" color="gray">
                    {property.agentPhone}
                  </Text>
                </Flex>
              ) : null}
            </Flex>
          </Flex>

          {property.description ? (
            <Box>
              <Flex align="center" gap="2" mb="2">
                <ScrollText size={18} />
                <Text size="3" weight="medium">
                  Description
                </Text>
              </Flex>
              <div className="prose-description">{property.description}</div>
            </Box>
          ) : null}

          {hasCoords ? (
            <Box>
              <Flex align="center" gap="2" mb="2">
                <MapPin size={18} />
                <Text size="3" weight="medium">
                  Location
                </Text>
              </Flex>
              <PropertyMap
                latitude={property.latitude!}
                longitude={property.longitude!}
                label={mapLabel}
              />
              {property.postcode ? (
                <Text size="1" color="gray" mt="2" as="p">
                  {property.postcode}
                </Text>
              ) : null}
            </Box>
          ) : null}

          <Separator size="4" />

          <NotesEditor
            propertyId={property.id}
            initialNotes={property.notes}
          />

          <Separator size="4" />

          <PropertyActions
            propertyId={property.id}
            source={property.source}
            totalImages={property.images.length}
            archivedImages={
              property.images.filter((img) => !!img.sourceUrl).length
            }
          />
        </Flex>
      </Container>
    </Box>
  );
}
