"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
const STORAGE_KEY = "glimpse-theme";

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let stored: Theme | null = null;
    try {
      stored = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
    } catch {
      stored = null;
    }
    setThemeState(stored ?? "system");
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const resolved = theme === "system" ? getSystemTheme() : theme;
    setResolvedTheme(resolved);

    const root = document.documentElement;
    root.classList.add("theme-transition");
    root.classList.toggle("dark", resolved === "dark");

    const timeout = window.setTimeout(() => root.classList.remove("theme-transition"), 300);
    return () => window.clearTimeout(timeout);
  }, [theme, mounted]);

  useEffect(() => {
    if (theme !== "system") return;

    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    function handleChange() {
      const resolved = getSystemTheme();
      setResolvedTheme(resolved);
      document.documentElement.classList.toggle("dark", resolved === "dark");
    }

    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, [theme]);

  function setTheme(next: Theme) {
    setThemeState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore storage failures (private browsing, etc.)
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    // Safe fallback so pages using useTheme() don't crash before
    // <ThemeProvider> is mounted in app/layout.tsx.
    return {
      theme: "system",
      resolvedTheme: "light",
      setTheme: () => {
        console.warn(
          "ThemeProvider is not mounted. Wrap your app in <ThemeProvider> inside app/layout.tsx for dark mode to take effect."
        );
      },
    };
  }
  return context;
}