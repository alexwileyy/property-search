"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Callout, Flex, TextField } from "@radix-ui/themes";
import { addPropertyByUrl } from "@/app/actions";

export function UrlPasteForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [successAt, setSuccessAt] = useState<number | null>(null);

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await addPropertyByUrl(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      formRef.current?.reset();
      setSuccessAt(Date.now());
      router.refresh();
    });
  }

  return (
    <Flex direction="column" gap="3">
      <form ref={formRef} action={onSubmit}>
        <Flex direction={{ initial: "column", sm: "row" }} gap="2">
          <TextField.Root
            name="url"
            type="url"
            placeholder="Paste a RightMove URL"
            size="3"
            required
            disabled={pending}
            style={{ flex: 1 }}
          />
          <Button type="submit" size="3" disabled={pending}>
            {pending ? "Importing..." : "Import"}
          </Button>
        </Flex>
      </form>

      {error ? (
        <Callout.Root color="crimson" variant="soft">
          <Callout.Text>{error}</Callout.Text>
        </Callout.Root>
      ) : null}

      {successAt && !error ? (
        <Callout.Root color="grass" variant="soft">
          <Callout.Text>Saved.</Callout.Text>
        </Callout.Root>
      ) : null}
    </Flex>
  );
}
