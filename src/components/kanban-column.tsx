"use client";

import { useDroppable } from "@dnd-kit/core";
import { Badge, Box, Flex, Heading, Text } from "@radix-ui/themes";
import type { Property, PropertyStatus } from "@/db/schema";
import { STATUS_LABELS } from "@/lib/status";
import { KanbanCard } from "./kanban-card";

type Props = {
  status: PropertyStatus;
  properties: Property[];
  onMove: (propertyId: string, toStatus: PropertyStatus) => void;
  variant?: "desktop" | "mobile";
};

export function KanbanColumn({
  status,
  properties,
  onMove,
  variant = "desktop",
}: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  const isDesktop = variant === "desktop";

  return (
    <Box
      ref={setNodeRef}
      style={{
        flex: isDesktop ? "0 0 280px" : "1 1 auto",
        width: isDesktop ? 280 : "100%",
        background: isOver ? "var(--accent-3)" : "var(--gray-2)",
        borderRadius: "var(--radius-4)",
        padding: "var(--space-3)",
        transition: "background 120ms ease",
      }}
    >
      <Flex direction="column" gap="3">
        <Flex justify="between" align="center">
          <Heading size="2" weight="medium">
            {STATUS_LABELS[status]}
          </Heading>
          <Badge color="gray" radius="full" variant="soft">
            {properties.length}
          </Badge>
        </Flex>

        <Flex direction="column" gap="2">
          {properties.length === 0 ? (
            <Text size="1" color="gray" style={{ padding: "var(--space-2) 0" }}>
              {isDesktop ? "Drag a card here" : "Nothing here yet"}
            </Text>
          ) : (
            properties.map((p) => (
              <KanbanCard
                key={p.id}
                property={p}
                onMove={(toStatus) => onMove(p.id, toStatus)}
              />
            ))
          )}
        </Flex>
      </Flex>
    </Box>
  );
}
