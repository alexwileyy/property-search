"use client";

import type { ReactNode } from "react";
import { Theme } from "@radix-ui/themes";
import { ThemeProvider, useTheme } from "next-themes";

function RadixTheme({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme();
  const appearance = resolvedTheme === "dark" ? "dark" : "light";

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
