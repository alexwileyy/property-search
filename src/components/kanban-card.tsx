"use client";

import type { CSSProperties, PointerEvent } from "react";
import NextLink from "next/link";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowRight,
  Bath,
  BedDouble,
  Building2,
  MapPin,
  MoreHorizontal,
  Ruler,
} from "lucide-react";
import {
  Box,
  Button,
  Card,
  DropdownMenu,
  Flex,
  IconButton,
  Text,
} from "@radix-ui/themes";
import type { Property, PropertyStatus } from "@/db/schema";
import { STATUS_LABELS, STATUS_ORDER } from "@/lib/status";

function formatPrice(price: string | null): string {
  if (!price) return "Price n/a";
  const n = Number(price);
  if (!Number.isFinite(n)) return price;
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(n);
}

function stopPropagation(e: PointerEvent | React.MouseEvent) {
  e.stopPropagation();
}

type Props = {
  property: Property;
  onMove: (toStatus: PropertyStatus) => void;
};

export function KanbanCard({ property, onMove }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: property.id,
      data: { fromStatus: property.status },
    });

  const style: CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
    cursor: isDragging ? "grabbing" : "grab",
  };

  const cover = property.images[0]?.url;
  const otherStatuses = STATUS_ORDER.filter((s) => s !== property.status);
  const detailHref = `/property/${property.id}`;

  return (
    <Box ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card size="2" style={{ position: "relative" }}>
        <Flex direction="column" gap="2">
          {cover ? (
            <Box
              style={{
                overflow: "hidden",
                borderRadius: "var(--radius-3)",
                marginBottom: "var(--space-1)",
              }}
            >
              <img
                src={cover}
                alt=""
                style={{
                  display: "block",
                  width: "100%",
                  aspectRatio: "4 / 3",
                  objectFit: "cover",
                  background: "var(--gray-3)",
                }}
                draggable={false}
              />
            </Box>
          ) : null}

          <Flex align="baseline" gap="2" wrap="wrap">
            <Text size="3" weight="medium">
              {formatPrice(property.price)}
            </Text>
            {property.price && property.priceQualifier ? (
              <Text size="1" color="gray">
                {property.priceQualifier.toLowerCase()}
              </Text>
            ) : null}
          </Flex>

          {property.addressLine ? (
            <Flex align="start" gap="1">
              <Box style={{ color: "var(--gray-10)", marginTop: 2 }}>
                <MapPin size={13} />
              </Box>
              <Text size="2" color="gray" style={{ lineHeight: 1.4 }}>
                {property.addressLine}
              </Text>
            </Flex>
          ) : null}

          <Flex gap="3" wrap="wrap">
            {property.bedrooms != null ? (
              <Flex align="center" gap="1">
                <BedDouble size={13} color="var(--gray-10)" />
                <Text size="1" color="gray">
                  {property.bedrooms} bed
                </Text>
              </Flex>
            ) : null}
            {property.bathrooms != null ? (
              <Flex align="center" gap="1">
                <Bath size={13} color="var(--gray-10)" />
                <Text size="1" color="gray">
                  {property.bathrooms} bath
                </Text>
              </Flex>
            ) : null}
            {property.sqft != null ? (
              <Flex align="center" gap="1">
                <Ruler size={13} color="var(--gray-10)" />
                <Text size="1" color="gray">
                  {property.sqft.toLocaleString()} sqft
                </Text>
              </Flex>
            ) : null}
            {property.propertyType ? (
              <Flex align="center" gap="1">
                <Building2 size={13} color="var(--gray-10)" />
                <Text size="1" color="gray">
                  {property.propertyType}
                </Text>
              </Flex>
            ) : null}
          </Flex>

          <Box
            onPointerDown={stopPropagation}
            onMouseDown={stopPropagation}
            onClick={stopPropagation}
            mt="2"
          >
            <Flex gap="2">
              <Button
                asChild
                variant="surface"
                color="gray"
                size="2"
                style={{ flex: 1 }}
              >
                <NextLink href={detailHref}>
                  View details
                  <ArrowRight size={14} />
                </NextLink>
              </Button>
              <DropdownMenu.Root>
                <DropdownMenu.Trigger>
                  <IconButton
                    variant="surface"
                    color="gray"
                    size="2"
                    aria-label="Card actions"
                  >
                    <MoreHorizontal size={16} />
              </IconButton>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>
              <DropdownMenu.Label>Move to</DropdownMenu.Label>
              {otherStatuses.map((s) => (
                <DropdownMenu.Item key={s} onSelect={() => onMove(s)}>
                  {STATUS_LABELS[s]}
                </DropdownMenu.Item>
              ))}
              <DropdownMenu.Separator />
              <DropdownMenu.Item asChild>
                <NextLink href={detailHref}>Open detail</NextLink>
              </DropdownMenu.Item>
              <DropdownMenu.Item asChild>
                <a
                  href={property.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open listing
                </a>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
            </Flex>
          </Box>
        </Flex>
      </Card>
    </Box>
  );
}
