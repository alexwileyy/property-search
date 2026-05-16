"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertDialog, Button, Callout, Flex, Text } from "@radix-ui/themes";
import {
  CheckCircle2,
  ImageDown,
  RefreshCw,
  Trash2,
} from "lucide-react";
import type { PropertySource } from "@/db/schema";
import {
  archivePhotosAction,
  deletePropertyAction,
  rescrapePropertyAction,
} from "@/app/actions";

type Props = {
  propertyId: string;
  source: PropertySource;
  totalImages: number;
  archivedImages: number;
};

export function PropertyActions({
  propertyId,
  source,
  totalImages,
  archivedImages,
}: Props) {
  const router = useRouter();
  const [rescraping, startRescrape] = useTransition();
  const [archiving, startArchive] = useTransition();
  const [deleting, startDelete] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [archiveStatus, setArchiveStatus] = useState<string | null>(null);

  const canRescrape = source === "rightmove";
  const hasUnarchived = totalImages > 0 && archivedImages < totalImages;
  const allArchived = totalImages > 0 && archivedImages === totalImages;

  function onRescrape() {
    setError(null);
    setArchiveStatus(null);
    startRescrape(async () => {
      const result = await rescrapePropertyAction(propertyId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function onArchive() {
    setError(null);
    setArchiveStatus(null);
    startArchive(async () => {
      const result = await archivePhotosAction(propertyId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const { archived, remaining } = result;
      setArchiveStatus(
        remaining > 0
          ? `Archived ${archived} photo${archived === 1 ? "" : "s"}; ${remaining} failed and will retry next time.`
          : `Archived ${archived} photo${archived === 1 ? "" : "s"}.`,
      );
      router.refresh();
    });
  }

  function onDelete() {
    startDelete(async () => {
      await deletePropertyAction(propertyId);
    });
  }

  return (
    <Flex direction="column" gap="3">
      <Flex gap="2" wrap="wrap" align="center">
        <Button
          variant="soft"
          color="gray"
          size="2"
          onClick={onRescrape}
          disabled={!canRescrape || rescraping}
        >
          <RefreshCw
            size={14}
            style={{
              animation: rescraping ? "spin 0.8s linear infinite" : undefined,
            }}
          />
          {rescraping ? "Refreshing..." : "Re-fetch listing"}
        </Button>

        {hasUnarchived ? (
          <Button
            variant="soft"
            color="gray"
            size="2"
            onClick={onArchive}
            disabled={archiving}
          >
            <ImageDown
              size={14}
              style={{
                animation: archiving ? "spin 0.8s linear infinite" : undefined,
              }}
            />
            {archiving
              ? "Archiving..."
              : `Archive photos (${archivedImages}/${totalImages})`}
          </Button>
        ) : allArchived ? (
          <Flex
            align="center"
            gap="1"
            style={{ color: "var(--grass-11)", paddingLeft: 4 }}
          >
            <CheckCircle2 size={14} />
            <Text size="1">All {totalImages} photos archived</Text>
          </Flex>
        ) : null}

        <AlertDialog.Root>
          <AlertDialog.Trigger>
            <Button variant="soft" color="crimson" size="2" disabled={deleting}>
              <Trash2 size={14} />
              Delete
            </Button>
          </AlertDialog.Trigger>
          <AlertDialog.Content maxWidth="420px">
            <AlertDialog.Title>Delete this property?</AlertDialog.Title>
            <AlertDialog.Description size="2">
              This removes the property and its status history. The listing on
              the source site is not affected.
            </AlertDialog.Description>
            <Flex gap="3" mt="4" justify="end">
              <AlertDialog.Cancel>
                <Button variant="soft" color="gray">
                  Cancel
                </Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action>
                <Button
                  variant="solid"
                  color="crimson"
                  onClick={onDelete}
                  disabled={deleting}
                >
                  {deleting ? "Deleting..." : "Delete"}
                </Button>
              </AlertDialog.Action>
            </Flex>
          </AlertDialog.Content>
        </AlertDialog.Root>
      </Flex>

      {!canRescrape ? (
        <Callout.Root size="1" variant="surface" color="gray">
          <Callout.Text>
            Re-fetch is RightMove-only. For Zoopla, open the listing in your
            browser and tap the bookmarklet to refresh.
          </Callout.Text>
        </Callout.Root>
      ) : null}

      {archiveStatus ? (
        <Callout.Root size="1" color="grass" variant="soft">
          <Callout.Text>{archiveStatus}</Callout.Text>
        </Callout.Root>
      ) : null}

      {error ? (
        <Callout.Root size="1" color="crimson" variant="soft">
          <Callout.Text>{error}</Callout.Text>
        </Callout.Root>
      ) : null}
    </Flex>
  );
}
