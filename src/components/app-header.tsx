import NextLink from "next/link";
import { Container, Flex, Heading, Link } from "@radix-ui/themes";

export function AppHeader() {
  return (
    <Container size="4" px="4" py="3">
      <Flex align="center" justify="between">
        <Link asChild underline="none" color="gray" highContrast>
          <NextLink href="/">
            <Heading size="4" weight="bold">
              Property Search
            </Heading>
          </NextLink>
        </Link>
        <Link asChild size="2" color="gray">
          <NextLink href="/settings">Settings</NextLink>
        </Link>
      </Flex>
    </Container>
  );
}
