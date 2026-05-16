import {
  Box,
  Container,
  Flex,
  Heading,
  Separator,
  Text,
} from "@radix-ui/themes";
import { AppHeader } from "@/components/app-header";
import { KanbanBoard } from "@/components/kanban-board";
import { UrlPasteForm } from "@/components/url-paste-form";
import { getBoard } from "@/lib/properties";
import { STATUS_ORDER } from "@/lib/status";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const board = await getBoard();
  const total = STATUS_ORDER.reduce((sum, s) => sum + board[s].length, 0);

  return (
    <Box>
      <AppHeader />
      <Separator size="4" />

      <Container size="4" px="4" py="6">
        <Flex direction="column" gap="6">
          <Box>
            <Heading size="6" weight="bold" mb="2">
              Add a property
            </Heading>
            <Text size="2" color="gray" mb="4" as="p">
              Paste a RightMove URL. For Zoopla or estate agent sites, use the
              bookmarklet from <strong>Settings</strong>.
            </Text>
            <UrlPasteForm />
          </Box>

          <Separator size="4" />

          <Box>
            <Flex justify="between" align="baseline" mb="4">
              <Heading size="6" weight="bold">
                Board
              </Heading>
              <Text size="2" color="gray">
                {total} saved
              </Text>
            </Flex>

            <KanbanBoard initialBoard={board} />
          </Box>
        </Flex>
      </Container>
    </Box>
  );
}
