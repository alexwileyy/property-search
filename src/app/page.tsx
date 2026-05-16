import {
  Box,
  Container,
  Flex,
  Grid,
  Heading,
  Separator,
  Text,
} from "@radix-ui/themes";
import { AppHeader } from "@/components/app-header";
import { PropertyCard } from "@/components/property-card";
import { UrlPasteForm } from "@/components/url-paste-form";
import { listProperties } from "@/lib/properties";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const properties = await listProperties();

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
                Saved properties
              </Heading>
              <Text size="2" color="gray">
                {properties.length} saved
              </Text>
            </Flex>

            {properties.length === 0 ? (
              <Text size="2" color="gray">
                Nothing saved yet. Paste a URL above to get started.
              </Text>
            ) : (
              <Grid
                columns={{ initial: "1", sm: "2", md: "3" }}
                gap="4"
              >
                {properties.map((p) => (
                  <PropertyCard key={p.id} property={p} />
                ))}
              </Grid>
            )}
          </Box>
        </Flex>
      </Container>
    </Box>
  );
}
