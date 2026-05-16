"use client";

import { useState, useTransition } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Eye, NotebookPen, Pencil } from "lucide-react";
import {
  Box,
  Button,
  Callout,
  Flex,
  Tabs,
  Text,
  TextArea,
} from "@radix-ui/themes";
import { saveNotesAction } from "@/app/actions";

type Props = {
  propertyId: string;
  initialNotes: string | null;
};

export function NotesEditor({ propertyId, initialNotes }: Props) {
  const [savedNotes, setSavedNotes] = useState(initialNotes ?? "");
  const [draftNotes, setDraftNotes] = useState(initialNotes ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  const dirty = draftNotes !== savedNotes;

  function onSave() {
    setError(null);
    startTransition(async () => {
      const result = await saveNotesAction(propertyId, draftNotes);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSavedNotes(draftNotes);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    });
  }

  return (
    <Flex direction="column" gap="3">
      <Flex align="center" gap="2">
        <NotebookPen size={18} />
        <Text size="3" weight="medium">
          Notes
        </Text>
      </Flex>

      <Tabs.Root defaultValue="edit">
        <Tabs.List>
          <Tabs.Trigger value="edit">
            <Pencil size={14} style={{ marginRight: 6 }} />
            Edit
          </Tabs.Trigger>
          <Tabs.Trigger value="preview" disabled={draftNotes.trim().length === 0}>
            <Eye size={14} style={{ marginRight: 6 }} />
            Preview
          </Tabs.Trigger>
        </Tabs.List>

        <Box pt="3">
          <Tabs.Content value="edit">
            <TextArea
              value={draftNotes}
              onChange={(e) => setDraftNotes(e.target.value)}
              placeholder="Initial impressions, viewing notes, things to ask the agent. Markdown supported."
              rows={8}
              size="2"
              disabled={pending}
            />
          </Tabs.Content>

          <Tabs.Content value="preview">
            <Box
              style={{
                padding: "var(--space-3)",
                background: "var(--gray-2)",
                borderRadius: "var(--radius-3)",
                minHeight: 160,
              }}
            >
              <Markdown content={draftNotes} />
            </Box>
          </Tabs.Content>
        </Box>
      </Tabs.Root>

      <Flex justify="between" align="center" gap="3">
        <Box style={{ flex: 1 }}>
          {error ? (
            <Callout.Root color="crimson" variant="soft" size="1">
              <Callout.Text>{error}</Callout.Text>
            </Callout.Root>
          ) : justSaved ? (
            <Text size="1" color="grass">
              <Check
                size={14}
                style={{ verticalAlign: "middle", marginRight: 4 }}
              />
              Saved
            </Text>
          ) : null}
        </Box>
        <Button
          onClick={onSave}
          disabled={!dirty || pending}
          variant="solid"
          size="2"
        >
          {pending ? "Saving..." : "Save notes"}
        </Button>
      </Flex>
    </Flex>
  );
}

function Markdown({ content }: { content: string }) {
  return (
    <div className="prose-notes">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
