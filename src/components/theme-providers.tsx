"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Theme } from "@radix-ui/themes";
import { ThemeProvider, useTheme } from "next-themes";

function RadixTheme({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Render the same appearance on the server and the first client render to
  // avoid a hydration mismatch. After useEffect runs we flip to the real
  // theme via a subsequent render.
  const appearance: "light" | "dark" = mounted && resolvedTheme === "dark"
    ? "dark"
    : "light";

  return (
    <Theme
      appearance={appearance}
      accentColor="crimson"
      grayColor="sand"
      radius="large"
      scaling="100%"
      panelBackground="solid"
    >
      {children}
    </Theme>
  );
}

export function ThemeProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <RadixTheme>{children}</RadixTheme>
    </ThemeProvider>
  );
}
