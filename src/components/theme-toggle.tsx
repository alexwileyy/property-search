"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { IconButton } from "@radix-ui/themes";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <IconButton
      variant="ghost"
      color="gray"
      size="2"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      style={{ visibility: mounted ? "visible" : "hidden" }}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </IconButton>
  );
}
