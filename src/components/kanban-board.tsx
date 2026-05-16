"use client";

import { useOptimistic, useState, useTransition } from "react";
import {
  DndContext,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { Box, Flex, SegmentedControl, Text } from "@radix-ui/themes";
import type { Property, PropertyStatus } from "@/db/schema";
import { STATUS_LABELS, STATUS_ORDER, type Board } from "@/lib/status";
import { movePropertyAction } from "@/app/actions";
import { KanbanColumn } from "./kanban-column";

type Move = { propertyId: string; toStatus: PropertyStatus };

function applyMove(state: Board, move: Move): Board {
  const next: Board = { ...state };
  for (const s of STATUS_ORDER) next[s] = state[s].slice();

  let moved: Property | undefined;
  for (const s of STATUS_ORDER) {
    const idx = next[s].findIndex((p) => p.id === move.propertyId);
    if (idx !== -1) {
      moved = next[s].splice(idx, 1)[0];
      break;
    }
  }
  if (moved && moved.status !== move.toStatus) {
    next[move.toStatus].unshift({ ...moved, status: move.toStatus });
  } else if (moved) {
    next[move.toStatus].unshift(moved);
  }
  return next;
}

export function KanbanBoard({ initialBoard }: { initialBoard: Board }) {
  const [optimisticBoard, addOptimistic] = useOptimistic(
    initialBoard,
    applyMove,
  );
  const [, startTransition] = useTransition();
  const [activeStatus, setActiveStatus] =
    useState<PropertyStatus>("interested");

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
  );

  function move(propertyId: string, toStatus: PropertyStatus) {
    startTransition(async () => {
      addOptimistic({ propertyId, toStatus });
      const result = await movePropertyAction(propertyId, toStatus);
      if (!result.ok) {
        console.error(result.error);
      }
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const propertyId = String(active.id);
    const toStatus = String(over.id) as PropertyStatus;
    const fromStatus = active.data.current?.fromStatus as
      | PropertyStatus
      | undefined;
    if (fromStatus === toStatus) return;
    move(propertyId, toStatus);
  }

  const total = STATUS_ORDER.reduce(
    (sum, s) => sum + optimisticBoard[s].length,
    0,
  );

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <Box display={{ initial: "none", md: "block" }}>
        <Box
          style={{
            display: "flex",
            gap: "var(--space-3)",
            overflowX: "auto",
            paddingBottom: "var(--space-3)",
          }}
        >
          {STATUS_ORDER.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              properties={optimisticBoard[status]}
              onMove={move}
            />
          ))}
        </Box>
      </Box>

      <Box display={{ initial: "block", md: "none" }}>
        {total === 0 ? (
          <Text size="2" color="gray">
            Nothing saved yet. Paste a URL above to get started.
          </Text>
        ) : (
          <Flex direction="column" gap="3">
            <Box style={{ overflowX: "auto" }}>
              <SegmentedControl.Root
                value={activeStatus}
                onValueChange={(v) => setActiveStatus(v as PropertyStatus)}
                size="2"
              >
                {STATUS_ORDER.map((status) => (
                  <SegmentedControl.Item key={status} value={status}>
                    {STATUS_LABELS[status]} ({optimisticBoard[status].length})
                  </SegmentedControl.Item>
                ))}
              </SegmentedControl.Root>
            </Box>
            <KanbanColumn
              status={activeStatus}
              properties={optimisticBoard[activeStatus]}
              onMove={move}
              variant="mobile"
            />
          </Flex>
        )}
      </Box>
    </DndContext>
  );
}
