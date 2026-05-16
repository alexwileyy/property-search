import { headers } from "next/headers";
import {
  Box,
  Callout,
  Card,
  Container,
  Flex,
  Heading,
  Separator,
  Text,
} from "@radix-ui/themes";
import { AppHeader } from "@/components/app-header";
import { BookmarkletInstaller } from "@/components/bookmarklet-installer";
import { buildBookmarklet } from "@/lib/bookmarklet";

export const dynamic = "force-dynamic";

async function getAppUrl(): Promise<string> {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ??
    (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${proto}://${host}`;
}

export default async function SettingsPage() {
  const token = process.env.BOOKMARKLET_TOKEN;
  const appUrl = await getAppUrl();
  const bookmarklet = token ? buildBookmarklet(appUrl, token) : null;

  return (
    <Box>
      <AppHeader />
      <Separator size="4" />
      <Container size="2" px="4" py="6">
        <Flex direction="column" gap="5">
          <Box>
            <Heading size="7" weight="bold">
              Settings
            </Heading>
            <Text size="2" color="gray" as="p" mt="2">
              Install the bookmarklet so you can save listings from any property
              site your browser has already loaded - RightMove, Zoopla,
              OnTheMarket, individual estate agent sites.
            </Text>
          </Box>

          <Card size="3">
            <Flex direction="column" gap="3">
              <Heading size="4" weight="medium">
                Property bookmarklet
              </Heading>
              {bookmarklet ? (
                <BookmarkletInstaller href={bookmarklet} />
              ) : (
                <Callout.Root color="crimson" variant="soft">
                  <Callout.Text>
                    BOOKMARKLET_TOKEN is not set. Add it to your env vars and
                    restart.
                  </Callout.Text>
                </Callout.Root>
              )}
            </Flex>
          </Card>

          <Card size="3">
            <Flex direction="column" gap="3">
              <Heading size="4" weight="medium">
                Installing on iOS Safari
              </Heading>
              <Text size="2" as="p">
                1. Add any page to bookmarks (Share button → Add Bookmark).
              </Text>
              <Text size="2" as="p">
                2. Open Bookmarks → Edit, find the new bookmark, tap to edit it.
              </Text>
              <Text size="2" as="p">
                3. Rename it &quot;Save to Property Search&quot; and replace the
                URL with the bookmarklet code (use &quot;Copy bookmarklet
                code&quot; above, then paste).
              </Text>
              <Text size="2" as="p">
                4. To use: on any property listing, tap the address bar, type
                &quot;save&quot; (or your prefix), tap the bookmark.
              </Text>
            </Flex>
          </Card>

          <Card size="3">
            <Flex direction="column" gap="3">
              <Heading size="4" weight="medium">
                Installing on Android Chrome
              </Heading>
              <Text size="2" as="p">
                1. Bookmark any page (star icon in the menu).
              </Text>
              <Text size="2" as="p">
                2. Open Bookmarks, find the new bookmark, tap the three-dot menu
                → Edit.
              </Text>
              <Text size="2" as="p">
                3. Replace the URL with the bookmarklet code (copy above, then
                paste).
              </Text>
              <Text size="2" as="p">
                4. To use: type a unique substring of the bookmark name into the
                address bar on a property page, tap the suggestion.
              </Text>
            </Flex>
          </Card>

          <Card size="3">
            <Flex direction="column" gap="3">
              <Heading size="4" weight="medium">
                Installing on desktop
              </Heading>
              <Text size="2" as="p">
                Drag the &quot;Save to Property Search&quot; button to your
                bookmarks bar. Click it from any property listing.
              </Text>
            </Flex>
          </Card>
        </Flex>
      </Container>
    </Box>
  );
}
