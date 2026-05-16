"use client";

import type { CSSProperties, PointerEvent } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  Box,
  Card,
  DropdownMenu,
  Flex,
  IconButton,
  Text,
} from "@radix-ui/themes";
import type { Property, PropertyStatus } from "@/db/schema";
import { STATUS_LABELS, STATUS_ORDER } from "@/lib/status";

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

  return (
    <Box ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card size="2">
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

          <Flex justify="between" align="start" gap="2">
            <Text size="3" weight="medium" style={{ flex: 1 }}>
              {formatPrice(property.price, property.priceQualifier)}
            </Text>
            <Box
              onPointerDown={stopPropagation}
              onMouseDown={stopPropagation}
              onClick={stopPropagation}
            >
              <DropdownMenu.Root>
                <DropdownMenu.Trigger>
                  <IconButton
                    variant="ghost"
                    size="1"
                    color="gray"
                    aria-label="Move card"
                  >
                    <span aria-hidden style={{ fontSize: 16, lineHeight: 1 }}>
                      &#x22EF;
                    </span>
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
            </Box>
          </Flex>

          {property.addressLine ? (
            <Text size="2" color="gray" style={{ lineHeight: 1.4 }}>
              {property.addressLine}
            </Text>
          ) : null}

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
        </Flex>
      </Card>
    </Box>
  );
}
