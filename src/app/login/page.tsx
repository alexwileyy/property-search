import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
  Box,
  Button,
  Card,
  Container,
  Flex,
  Heading,
  Text,
  TextField,
} from "@radix-ui/themes";
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE,
  createSessionToken,
} from "@/lib/session";

async function login(formData: FormData) {
  "use server";
  const password = formData.get("password");
  const next = formData.get("next");

  if (typeof password !== "string" || password !== process.env.APP_PASSWORD) {
    const params = new URLSearchParams({ error: "1" });
    if (typeof next === "string" && next) params.set("next", next);
    redirect(`/login?${params.toString()}`);
  }

  const token = await createSessionToken();
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });

  redirect(typeof next === "string" && next ? next : "/");
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;

  return (
    <Container size="1" px="4" py="9">
      <Flex direction="column" gap="5" align="stretch">
        <Box>
          <Heading size="7" weight="bold" align="center">
            Property Search
          </Heading>
          <Text as="p" size="2" color="gray" align="center" mt="2">
            Enter the password to continue.
          </Text>
        </Box>

        <Card size="3">
          <form action={login}>
            <Flex direction="column" gap="3">
              {next ? <input type="hidden" name="next" value={next} /> : null}
              <Box>
                <Text as="label" size="2" weight="medium" htmlFor="password">
                  Password
                </Text>
                <TextField.Root
                  id="password"
                  name="password"
                  type="password"
                  size="3"
                  mt="1"
                  required
                  autoFocus
                  autoComplete="current-password"
                />
              </Box>

              {error ? (
                <Text size="2" color="crimson">
                  Incorrect password.
                </Text>
              ) : null}

              <Button type="submit" size="3" variant="solid">
                Sign in
              </Button>
            </Flex>
          </form>
        </Card>
      </Flex>
    </Container>
  );
}
