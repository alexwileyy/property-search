"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Callout, Flex, Text, TextField } from "@radix-ui/themes";
import { addPropertyByUrl } from "@/app/actions";

type ImportErrors = { url: string; error: string }[];

export function UrlPasteForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<ImportErrors>([]);
  const [importedCount, setImportedCount] = useState<number | null>(null);

  function onSubmit(formData: FormData) {
    setErrors([]);
    setImportedCount(null);
    startTransition(async () => {
      const result = await addPropertyByUrl(formData);
      setErrors(result.errors);
      setImportedCount(result.imported);
      if (result.imported > 0 && result.errors.length === 0) {
        formRef.current?.reset();
      }
      if (result.imported > 0) {
        router.refresh();
      }
    });
  }

  return (
    <Flex direction="column" gap="3">
      <form ref={formRef} action={onSubmit}>
        <Flex direction={{ initial: "column", sm: "row" }} gap="2">
          <TextField.Root
            name="url"
            type="text"
            placeholder="Paste a RightMove URL (or several, comma-separated)"
            size="3"
            required
            disabled={pending}
            style={{ flex: 1 }}
          />
          <Button type="submit" size="3" disabled={pending} loading={pending}>
            {pending ? "Importing..." : "Import"}
          </Button>
        </Flex>
      </form>

      {importedCount !== null && importedCount > 0 ? (
        <Callout.Root color="grass" variant="soft">
          <Callout.Text>
            {importedCount === 1
              ? "Saved 1 property."
              : `Saved ${importedCount} properties.`}
          </Callout.Text>
        </Callout.Root>
      ) : null}

      {errors.length > 0 ? (
        <Callout.Root color="crimson" variant="soft">
          <Callout.Text>
            {errors.length === 1
              ? "1 URL failed to import:"
              : `${errors.length} URLs failed to import:`}
          </Callout.Text>
          <Flex direction="column" gap="1" mt="2">
            {errors.map((e, i) => (
              <Text key={i} size="2">
                {e.url ? <strong>{e.url}: </strong> : null}
                {e.error}
              </Text>
            ))}
          </Flex>
        </Callout.Root>
      ) : null}
    </Flex>
  );
}
