"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Code, Flex, Text } from "@radix-ui/themes";

export function BookmarkletInstaller({ href }: { href: string }) {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    linkRef.current?.setAttribute("href", href);
  }, [href]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  function onClickLink(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
  }

  return (
    <Flex direction="column" gap="3">
      <Flex gap="2" align="center" wrap="wrap">
        <Button asChild size="3" variant="solid">
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages, jsx-a11y/anchor-is-valid */}
          <a ref={linkRef} draggable onClick={onClickLink}>
            Save to Property Search
          </a>
        </Button>
        <Button size="3" variant="soft" onClick={copy}>
          {copied ? "Copied" : "Copy bookmarklet code"}
        </Button>
      </Flex>
      <Text size="1" color="gray">
        Drag the button to your bookmarks bar (desktop), or copy the code and
        paste it as the URL of a new bookmark (mobile).
      </Text>
      <Code
        size="1"
        variant="soft"
        style={{
          padding: "var(--space-2)",
          wordBreak: "break-all",
          maxHeight: "10rem",
          overflow: "auto",
        }}
      >
        {href}
      </Code>
    </Flex>
  );
}
